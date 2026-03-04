import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  streak: { type: Number, default: 0 },
  lastStudiedDate: { type: Date, default: null },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

userSchema.pre('save', async function() {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 12)
})

export default mongoose.model('User', userSchema)