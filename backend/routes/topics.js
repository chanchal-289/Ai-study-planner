import express from 'express'
import Topic from '../models/Topic.js'
import { protect } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

// Add a new topic
router.post('/', protect, async (req, res) => {
  try {
    const { name, subject } = req.body
    const topic = await Topic.create({
      userId: req.userId,
      name,
      subject
    })
    res.json(topic)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all topics for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const topics = await Topic.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(topics)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get topics due for review today
router.get('/due-today', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const topics = await Topic.find({
      userId: req.userId,
      nextReviewDate: { $lte: today }
    })
    res.json(topics)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const topic = await Topic.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    })
    if (!topic) return res.status(404).json({ error: 'Topic not found' })
    res.json({ message: 'Topic deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/review', protect, async (req, res) => {
  try {
    const { quality } = req.body
    const topic = await Topic.findById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })

    // SM-2 Algorithm
    let { repetitions, easeFactor, intervalDays } = topic
    if (quality >= 3) {
      if (repetitions === 0) intervalDays = 1
      else if (repetitions === 1) intervalDays = 6
      else intervalDays = Math.round(intervalDays * easeFactor)
      repetitions += 1
    } else {
      intervalDays = 1
      repetitions = 0
    }
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    topic.repetitions = repetitions
    topic.easeFactor = easeFactor
    topic.intervalDays = intervalDays
    topic.nextReviewDate = new Date(Date.now() + intervalDays * 86400000)
    await topic.save()

    // Update streak
    const user = await User.findById(req.userId)
    const today = new Date().toDateString()
    const lastStudied = user.lastStudiedDate
      ? new Date(user.lastStudiedDate).toDateString()
      : null
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    if (lastStudied === today) {
      // Already studied today
    } else if (lastStudied === yesterday) {
      user.streak += 1
    } else {
      user.streak = 1
    }
    user.lastStudiedDate = new Date()
    user.totalReviews += 1
    await user.save()

    res.json({ topic, streak: user.streak, totalReviews: user.totalReviews })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router