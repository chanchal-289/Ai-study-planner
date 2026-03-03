import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'
import Topic from '../models/Topic.js'

const router = express.Router()
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro'
]

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

function formatHourLabel(hour24) {
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = ((hour24 + 11) % 12) + 1
  return `${hour12}:00 ${suffix}`
}

function buildFallbackDailyPlan(allTopics, dueTopics) {
  const sessions = []
  const reviewTopics = dueTopics.slice(0, 4)
  const newTopics = allTopics.filter(t => !dueTopics.some(d => String(d._id) === String(t._id))).slice(0, 4)
  let hour = 9

  reviewTopics.forEach((topic) => {
    sessions.push({
      time: formatHourLabel(hour),
      duration: '30 mins',
      topic: topic.name,
      subject: topic.subject,
      type: 'review',
      tip: 'Recall from memory first, then verify with notes.'
    })
    hour += 1
  })

  sessions.push({
    time: formatHourLabel(hour),
    duration: '20 mins',
    topic: 'Break',
    subject: '',
    type: 'break',
    tip: 'Hydrate and take a short walk.'
  })
  hour += 1

  newTopics.forEach((topic) => {
    sessions.push({
      time: formatHourLabel(hour),
      duration: '45 mins',
      topic: topic.name,
      subject: topic.subject,
      type: 'study',
      tip: 'Use active recall: close notes and explain the idea aloud.'
    })
    hour += 1
  })

  return {
    motivationalTip: 'Consistency beats intensity. Focus on finishing each session.',
    totalHours: Math.max(2, Math.round((sessions.length * 0.5) * 10) / 10),
    plan: sessions,
    source: 'fallback'
  }
}

function buildFallbackWeeklyPlan(allTopics) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const start = new Date()
  const week = days.map((dayName, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const topic = allTopics[i % Math.max(1, allTopics.length)]
    const isRest = i === 6

    return {
      day: dayName,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalHours: isRest ? 0 : 2,
      focus: isRest ? 'Recovery / light revision' : topic?.subject || 'General',
      sessions: isRest ? [] : [
        {
          topic: topic?.name || 'Revision',
          subject: topic?.subject || 'General',
          duration: '60 mins',
          type: 'study'
        },
        {
          topic: topic?.name || 'Recall Practice',
          subject: topic?.subject || 'General',
          duration: '45 mins',
          type: 'review'
        }
      ]
    }
  })

  return {
    weekSummary: 'Balanced weekly plan generated locally because AI quota is currently unavailable.',
    week,
    source: 'fallback'
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

// Daily plan
router.get('/daily', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const dueTopics = await Topic.find({
      userId: req.userId,
      nextReviewDate: { $lte: today }
    })

    const allTopics = await Topic.find({ userId: req.userId })

    if (allTopics.length === 0) {
      return res.json({ plan: [], message: 'Add some topics first!' })
    }

    const prompt = `
      You are an expert study coach AI. Create a personalized daily study plan.
      
      Topics due for review today: ${dueTopics.length > 0
        ? dueTopics.map(t => `${t.name} (${t.subject}, review #${t.repetitions + 1})`).join(', ')
        : 'None'}
      
      All topics being studied: ${allTopics.map(t => `${t.name} (${t.subject})`).join(', ')}
      
      Create a realistic 6-8 hour study day plan. Include:
      - Review sessions for due topics (30 min each)
      - New study sessions for other topics
      - Short breaks every 2 hours
      - A motivating tip for the day
      
      Respond ONLY with this exact JSON structure, no markdown, no backticks:
      {
        "motivationalTip": "A short motivating message for today",
        "totalHours": 4,
        "plan": [
          {
            "time": "9:00 AM",
            "duration": "30 mins",
            "topic": "Topic name",
            "subject": "Subject",
            "type": "review",
            "tip": "Quick study tip for this topic"
          }
        ]
      }
      Types can be: "review", "study", "break"
      For breaks, set topic as "Break" and tip as a relaxation suggestion.
    `

    try {
      const parsed = await generatePlanFromPrompt(prompt)
      res.json(parsed)
    } catch (err) {
      if (isQuotaError(err.message)) {
        return res.json(buildFallbackDailyPlan(allTopics, dueTopics))
      }
      res.status(500).json({ error: formatErrorSummary(err.message) })
    }
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

// Weekly plan
router.get('/weekly', protect, async (req, res) => {
  try {
    const allTopics = await Topic.find({ userId: req.userId })

    if (allTopics.length === 0) {
      return res.json({ week: [], message: 'Add some topics first!' })
    }

    const prompt = `
      You are an expert study coach AI. Create a personalized 7-day weekly study plan.
      
      Student's topics: ${allTopics.map(t =>
        `${t.name} (${t.subject}, next review: ${new Date(t.nextReviewDate).toDateString()}, repetitions: ${t.repetitions})`
      ).join(', ')}
      
      Today is ${new Date().toDateString()}.
      
      Create a balanced weekly plan that:
      - Distributes topics evenly across 7 days
      - Schedules reviews on their due dates
      - Allows rest on at least 1 day
      - Keeps daily study to 2-4 hours max
      
      Respond ONLY with this exact JSON structure, no markdown, no backticks:
      {
        "weekSummary": "Brief overview of the week",
        "week": [
          {
            "day": "Monday",
            "date": "Mar 4",
            "totalHours": 2,
            "focus": "Main focus for the day",
            "sessions": [
              {
                "topic": "Topic name",
                "subject": "Subject",
                "duration": "45 mins",
                "type": "review"
              }
            ]
          }
        ]
      }
    `

    try {
      const parsed = await generatePlanFromPrompt(prompt)
      res.json(parsed)
    } catch (err) {
      if (isQuotaError(err.message)) {
        return res.json(buildFallbackWeeklyPlan(allTopics))
      }
      res.status(500).json({ error: formatErrorSummary(err.message) })
    }
  } catch (err) {
    res.status(500).json({ error: formatErrorSummary(err.message) })
  }
})

export default router
