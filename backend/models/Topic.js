import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  subject: { type: String, default: 'General' },
  repetitions: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  intervalDays: { type: Number, default: 1 },
  nextReviewDate: {
    type: Date,
    default: () => new Date(Date.now() + 86400000)
  },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Topic', topicSchema)