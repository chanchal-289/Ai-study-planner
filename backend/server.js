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

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected ✅')
    app.listen(process.env.PORT || 5000, () =>
      console.log('Server running on port 5000 ✅')
    )
  })
  .catch(err => console.error('MongoDB connection error:', err))
```

---

**`.env`:**
```
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=supersecretkey123changeme
GEMINI_API_KEY=your_gemini_key_here
PORT=5000