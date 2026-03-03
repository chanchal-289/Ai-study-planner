import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  reviewedAt: { type: Date, default: Date.now },
  qualityRating: { type: Number, min: 1, max: 5, required: true },
  newIntervalDays: { type: Number, required: true }
})

export default mongoose.model('ReviewSchedule', reviewSchema)