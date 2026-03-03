import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'
import Topic from '../models/Topic.js'

const router = express.Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

router.get('/daily', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const topics = await Topic.find({
      userId: req.userId,
      nextReviewDate: { $lte: today }
    })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = `
      You are a study planner AI. A student has these topics due for review today:
      ${topics.map(t => `- ${t.name} (${t.subject})`).join('\n')}
      
      Create a practical daily study plan with time blocks.
      Keep it motivating and realistic. 
      Respond ONLY with a JSON object, no markdown, no backticks:
      { "plan": [{ "time": "9:00 AM", "topic": "", "duration": "30 mins", "tip": "" }] }
    `
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    res.json({ topics, aiPlan: JSON.parse(text) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }