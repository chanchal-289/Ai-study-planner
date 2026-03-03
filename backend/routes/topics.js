import express from 'express'
import Topic from '../models/Topic.js'
import { protect } from '../middleware/auth.js'

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

export default router