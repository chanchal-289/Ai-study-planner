import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'
import Topic from '../models/Topic.js'

const router = express.Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Weekly plan
router.get('/weekly', protect, async (req, res) => {
  try {
    const allTopics = await Topic.find({ userId: req.userId })

    if (allTopics.length === 0) {
      return res.json({ week: [], message: 'Add some topics first!' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router