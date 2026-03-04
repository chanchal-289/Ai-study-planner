import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'
import Topic from '../models/Topic.js'
import StudyPlan from '../models/StudyPlan.js'

const router = express.Router()
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro',
]
const PLAN_TYPES = ['daily', 'weekly', 'monthly']

function parseModelJson(text) {
  const cleaned = text.replace(/```json|```/gi, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1))
    }
    throw new Error('AI response was not valid JSON')
  }
}

function isQuotaError(message = '') {
  const msg = String(message).toLowerCase()
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')
}

function formatErrorSummary(message = '') {
  const first = String(message).split('\n')[0].trim()
  if (isQuotaError(first)) {
    return 'Gemini API quota exceeded. Using fallback planner. Please check billing/quota limits.'
  }
  return first || 'Failed to generate AI plan'
}

function parseTimeToMinutes(timeText) {
  if (!timeText || typeof timeText !== 'string') return null
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(timeText.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function formatMinuteLabel(totalMinutes) {
  const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(minutesInDay / 60)
  const mins = minutesInDay % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = ((hour24 + 11) % 12) + 1
  return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`
}

function normalizeTimeWindow(startTime, endTime, fallbackStart = '09:00', fallbackEnd = '17:00') {
  let start = parseTimeToMinutes(startTime)
  let end = parseTimeToMinutes(endTime)

  if (start === null) start = parseTimeToMinutes(fallbackStart)
  if (end === null) end = parseTimeToMinutes(fallbackEnd)
  if (end <= start) end += 24 * 60
  if (end - start < 120) end = start + 120

  return {
    startMinutes: start,
    endMinutes: end,
    startTime: `${String(Math.floor(start / 60) % 24).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
    endTime: `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
    label: `${formatMinuteLabel(start)} - ${formatMinuteLabel(end)}`,
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function topicDuration(topic, fallback = 45) {
  const raw = Number(topic?.preferredDuration)
  if (!Number.isFinite(raw)) return fallback
  return clamp(Math.round(raw), 15, 240)
}

function buildFallbackDailyPlan(allTopics, dueTopics, timeWindow) {
  const reviewTopics = dueTopics.slice(0, 4)
  const newTopics = allTopics
    .filter((t) => !dueTopics.some((d) => String(d._id) === String(t._id)))
    .slice(0, 4)

  const tasks = []
  reviewTopics.forEach((topic) => {
    const minutes = clamp(Math.round(topicDuration(topic, 35) * 0.75), 20, 90)
    tasks.push({
      durationMinutes: minutes,
      topic: topic.name,
      subject: topic.subject,
      type: 'review',
      tip: 'Recall first, then verify notes.',
    })
  })
  newTopics.forEach((topic) => {
    const minutes = topicDuration(topic, 45)
    tasks.push({
      durationMinutes: minutes,
      topic: topic.name,
      subject: topic.subject,
      type: 'study',
      tip: 'Summarize the key idea in one sentence before moving on.',
    })
  })

  const sessions = []
  let cursor = timeWindow.startMinutes
  const hardEnd = timeWindow.endMinutes

  for (let i = 0; i < tasks.length; i += 1) {
    const item = tasks[i]
    if (cursor + item.durationMinutes > hardEnd) break
    sessions.push({
      time: formatMinuteLabel(cursor),
      duration: `${item.durationMinutes} mins`,
      topic: item.topic,
      subject: item.subject,
      type: item.type,
      tip: item.tip,
    })
    cursor += item.durationMinutes

    const shouldBreak = (i + 1) % 2 === 0 && i !== tasks.length - 1
    if (shouldBreak && cursor + 15 <= hardEnd) {
      sessions.push({
        time: formatMinuteLabel(cursor),
        duration: '15 mins',
        topic: 'Break',
        subject: '',
        type: 'break',
        tip: 'Stretch, hydrate, and rest your eyes.',
      })
      cursor += 15
    }
  }

  const totalHours = Math.round(((cursor - timeWindow.startMinutes) / 60) * 10) / 10

  return {
    motivationalTip: 'Consistency beats intensity. Complete each block before switching context.',
    totalHours: clamp(totalHours, 2, 12),
    startTime: timeWindow.startTime,
    endTime: timeWindow.endTime,
    plan: sessions,
    source: 'fallback',
  }
}

function buildFallbackWeeklyPlan(allTopics, timeWindow) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const start = new Date()
  const windowHours = Math.max(2, Math.round(((timeWindow.endMinutes - timeWindow.startMinutes) / 60) * 10) / 10)
  const targetHours = clamp(Math.round((windowHours * 0.5) * 10) / 10, 1.5, 4)

  const week = days.map((dayName, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const topicA = allTopics[i % Math.max(1, allTopics.length)]
    const topicB = allTopics[(i + 1) % Math.max(1, allTopics.length)]
    const isRest = i === 6
    const aDuration = topicDuration(topicA, 50)
    const bDuration = topicDuration(topicB, 40)

    return {
      day: dayName,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalHours: isRest ? 0 : clamp(Math.round(((aDuration + bDuration) / 60) * 10) / 10, 1.5, Math.max(2, targetHours)),
      focus: isRest ? 'Recovery / light revision' : topicA?.subject || 'General',
      timeWindow: timeWindow.label,
      sessions: isRest
        ? []
        : [
            { topic: topicA?.name || 'Revision', subject: topicA?.subject || 'General', duration: `${aDuration} mins`, type: 'study' },
            { topic: topicB?.name || 'Recall practice', subject: topicB?.subject || 'General', duration: `${bDuration} mins`, type: 'review' },
          ],
    }
  })

  return {
    weekSummary: 'Balanced weekly plan generated locally because AI quota is currently unavailable.',
    startTime: timeWindow.startTime,
    endTime: timeWindow.endTime,
    week,
    source: 'fallback',
  }
}

function buildFallbackMonthlyPlan(allTopics, timeWindow) {
  const topicNames = allTopics.slice(0, 6).map((t) => t.name)
  const topicDurations = allTopics.slice(0, 6).map((t) => `${t.name}: ${topicDuration(t, 45)} mins`)
  const weeks = [1, 2, 3, 4].map((n) => ({
    week: `Week ${n}`,
    focus: topicNames[(n - 1) % Math.max(1, topicNames.length)] || 'Core revision',
    goals: [
      `Complete ${(topicNames[(n - 1) % Math.max(1, topicNames.length)] || 'core topic')} revision`,
      `Use preferred durations (${topicDurations.slice(0, 3).join(', ') || '45 mins default'})`,
      'Do one active-recall checkpoint',
      'Write a short progress summary',
    ],
    studyDays: 5,
    timeWindow: timeWindow.label,
  }))

  return {
    monthSummary: 'Monthly plan generated locally because AI quota is currently unavailable.',
    startTime: timeWindow.startTime,
    endTime: timeWindow.endTime,
    weeks,
    source: 'fallback',
  }
}

async function generatePlanFromPrompt(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in backend/.env')
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const errors = []

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return parseModelJson(text)
    } catch (err) {
      errors.push(`${modelName}: ${err.message}`)
    }
  }

  throw new Error(`Unable to generate AI plan with available models. ${errors.join(' | ')}`)
}

async function upsertPlan(userId, type, startTime, endTime, data) {
  await StudyPlan.findOneAndUpdate(
    { userId, type },
    { userId, type, startTime, endTime, data },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )
}

router.get('/saved', protect, async (req, res) => {
  try {
    const docs = await StudyPlan.find({ userId: req.userId }).sort({ updatedAt: -1 })
    const byType = { daily: null, weekly: null, monthly: null }

    docs.forEach((doc) => {
      if (!byType[doc.type]) {
        byType[doc.type] = {
          id: doc._id,
          type: doc.type,
          startTime: doc.startTime,
          endTime: doc.endTime,
          updatedAt: doc.updatedAt,
          data: doc.data,
        }
      }
    })

    res.json(byType)
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

router.delete('/saved/:type', protect, async (req, res) => {
  try {
    const { type } = req.params
    if (!PLAN_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid plan type' })
    }

    await StudyPlan.findOneAndDelete({ userId: req.userId, type })
    res.json({ message: `${type} plan deleted` })
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

router.post('/daily', protect, async (req, res) => {
  try {
    const timeWindow = normalizeTimeWindow(req.body?.startTime, req.body?.endTime)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const dueTopics = await Topic.find({ userId: req.userId, nextReviewDate: { $lte: today } })
    const allTopics = await Topic.find({ userId: req.userId })

    if (allTopics.length === 0) {
      return res.json({ startTime: timeWindow.startTime, endTime: timeWindow.endTime, plan: [], message: 'Add some topics first!' })
    }

    const prompt = `
You are an expert study coach AI. Create a personalized daily study plan.
Available study window for today: ${timeWindow.label}.
Topics due for review: ${dueTopics.length > 0 ? dueTopics.map((t) => `${t.name} (${t.subject}, preferred ${topicDuration(t, 45)} mins, review #${t.repetitions + 1})`).join(', ') : 'None'}.
All topics: ${allTopics.map((t) => `${t.name} (${t.subject}, preferred ${topicDuration(t, 45)} mins)`).join(', ')}.
Build a realistic schedule inside ONLY the provided time window.
Use each topic's preferred duration when assigning session length. Include review sessions, study sessions, and short breaks.
Respond ONLY JSON:
{
  "motivationalTip": "short tip",
  "totalHours": 4,
  "startTime": "${timeWindow.startTime}",
  "endTime": "${timeWindow.endTime}",
  "plan": [
    {
      "time": "9:00 AM",
      "duration": "30 mins",
      "topic": "Topic name",
      "subject": "Subject",
      "type": "review",
      "tip": "Study tip"
    }
  ]
}
Allowed types: "review", "study", "break".
For breaks use topic "Break".
`

    let result
    try {
      const parsed = await generatePlanFromPrompt(prompt)
      result = { ...parsed, startTime: timeWindow.startTime, endTime: timeWindow.endTime }
    } catch (err) {
      if (!isQuotaError(err.message)) {
        return res.status(500).json({ error: formatErrorSummary(err.message) })
      }
      result = buildFallbackDailyPlan(allTopics, dueTopics, timeWindow)
    }

    await upsertPlan(req.userId, 'daily', timeWindow.startTime, timeWindow.endTime, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

router.post('/weekly', protect, async (req, res) => {
  try {
    const timeWindow = normalizeTimeWindow(req.body?.startTime, req.body?.endTime)
    const allTopics = await Topic.find({ userId: req.userId })

    if (allTopics.length === 0) {
      return res.json({ startTime: timeWindow.startTime, endTime: timeWindow.endTime, week: [], message: 'Add some topics first!' })
    }

    const prompt = `
You are an expert study coach AI. Create a personalized 7-day weekly study plan.
Daily study window for each day: ${timeWindow.label}.
Student topics: ${allTopics.map((t) => `${t.name} (${t.subject}, preferred ${topicDuration(t, 45)} mins, next review ${new Date(t.nextReviewDate).toDateString()}, repetitions ${t.repetitions})`).join(', ')}.
Today is ${new Date().toDateString()}.
Respect each topic's preferred duration when creating sessions.
Respond ONLY JSON:
{
  "weekSummary": "overview",
  "startTime": "${timeWindow.startTime}",
  "endTime": "${timeWindow.endTime}",
  "week": [
    {
      "day": "Monday",
      "date": "Mar 4",
      "totalHours": 2.5,
      "focus": "focus area",
      "sessions": [
        { "topic": "Topic", "subject": "Subject", "duration": "45 mins", "type": "review" }
      ]
    }
  ]
}
`

    let result
    try {
      const parsed = await generatePlanFromPrompt(prompt)
      result = { ...parsed, startTime: timeWindow.startTime, endTime: timeWindow.endTime }
    } catch (err) {
      if (!isQuotaError(err.message)) {
        return res.status(500).json({ error: formatErrorSummary(err.message) })
      }
      result = buildFallbackWeeklyPlan(allTopics, timeWindow)
    }

    await upsertPlan(req.userId, 'weekly', timeWindow.startTime, timeWindow.endTime, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

router.post('/monthly', protect, async (req, res) => {
  try {
    const timeWindow = normalizeTimeWindow(req.body?.startTime, req.body?.endTime)
    const allTopics = await Topic.find({ userId: req.userId })

    if (allTopics.length === 0) {
      return res.json({ startTime: timeWindow.startTime, endTime: timeWindow.endTime, weeks: [], message: 'Add some topics first!' })
    }

    const prompt = `
You are an expert study coach AI. Create a personalized 4-week monthly study plan.
Preferred daily study window: ${timeWindow.label}.
Student topics: ${allTopics.map((t) => `${t.name} (${t.subject}, preferred ${topicDuration(t, 45)} mins)`).join(', ')}.
Use preferred duration guidance when suggesting weekly goals and workload.
Respond ONLY JSON:
{
  "monthSummary": "month overview",
  "startTime": "${timeWindow.startTime}",
  "endTime": "${timeWindow.endTime}",
  "weeks": [
    {
      "week": "Week 1",
      "focus": "main focus",
      "goals": ["goal 1", "goal 2", "goal 3"],
      "studyDays": 5
    }
  ]
}
`

    let result
    try {
      const parsed = await generatePlanFromPrompt(prompt)
      result = { ...parsed, startTime: timeWindow.startTime, endTime: timeWindow.endTime }
    } catch (err) {
      if (!isQuotaError(err.message)) {
        return res.status(500).json({ error: formatErrorSummary(err.message) })
      }
      result = buildFallbackMonthlyPlan(allTopics, timeWindow)
    }

    await upsertPlan(req.userId, 'monthly', timeWindow.startTime, timeWindow.endTime, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

export default router
