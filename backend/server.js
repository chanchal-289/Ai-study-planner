import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import topicRoutes from './routes/topics.js'
import plannerRoutes from './routes/planner.js'

dotenv.config()

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/topics', topicRoutes)
app.use('/api/planner', plannerRoutes)

app.get('/', (req, res) => res.json({ message: 'AI Study Planner API ✅' }))

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected ✅')
    app.listen(process.env.PORT || 5000, () =>
      console.log('Server running on port 5000 ✅')
    )
  } catch (err) {
    console.error('MongoDB connection error:', err)
  }
}

startServer()