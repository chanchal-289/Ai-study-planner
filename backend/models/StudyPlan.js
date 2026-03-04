import mongoose from 'mongoose'

const studyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true, index: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

studyPlanSchema.index({ userId: 1, type: 1 }, { unique: true })

export default mongoose.model('StudyPlan', studyPlanSchema)
