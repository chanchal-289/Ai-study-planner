import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'English', 'Computer Science',
  'Economics', 'Psychology', 'General'
]

export default function AddTopic() {
  const [form, setForm] = useState({ name: '', subject: 'General' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(
        'http://localhost:5000/api/topics',
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess(true)
      setForm({ name: '', subject: 'General' })
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Add New Topic</h1>
            <p className="text-gray-500 text-sm">We'll automatically schedule your reviews</p>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            ✅ Topic added! Redirecting to dashboard...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Photosynthesis, World War II, Quadratic Equations"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* SR Info box */}
            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
              <div className="font-semibold mb-1">🧠 How spaced repetition works</div>
              <p className="text-indigo-600 text-xs leading-relaxed">
                After adding this topic, we'll schedule your first review for <strong>tomorrow</strong>.
                Each time you rate your confidence, the next review date adjusts automatically:
                high confidence = longer gap, low confidence = review sooner.
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30'].map((d, i) => (
                  <span key={i} className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-xs font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Adding topic...' : '+ Add Topic'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}