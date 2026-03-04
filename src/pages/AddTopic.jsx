import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import AppSidebar from '../components/AppSidebar'

export default function AddTopic() {
  const [form, setForm] = useState({ name: '', subject: '' })
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
      await axios.post('http://localhost:5000/api/topics', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess(true)
      setForm({ name: '', subject: '' })
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] md:flex">
      <AppSidebar />
      <div className="flex-1">
      {/* Navbar */}
      <nav className="bg-[#1a1d27] border-b border-[#2d3148] px-4 md:px-6 py-4 md:hidden">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white transition text-xl"
          >←</button>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">🧠</div>
          <span className="font-bold text-white">Add New Topic</span>
          <ThemeToggle className="ml-auto" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">What did you study?</h1>
          <p className="text-slate-400 text-sm mt-1">We'll automatically schedule your spaced reviews</p>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
            ✅ Topic added! Redirecting to dashboard...
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-5">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Topic Name *</label>
              <input
                type="text"
                placeholder="e.g. Photosynthesis, World War II, Linked Lists..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1117] border border-[#2d3148] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input
                type="text"
                placeholder="e.g. Biology, History, DSA, Guitar..."
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1117] border border-[#2d3148] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
              />
            </div>

            {/* SR explainer */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-indigo-400 mb-2">🧠 How your reviews will be scheduled</div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { day: 'Day 1', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' },
                  { day: 'Day 3', color: 'bg-purple-500/20 text-purple-400 border-purple-500/20' },
                  { day: 'Day 7', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
                  { day: 'Day 14', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' },
                  { day: 'Day 30', color: 'bg-green-500/20 text-green-400 border-green-500/20' },
                ].map(({ day, color }) => (
                  <span key={day} className={`text-xs px-3 py-1 rounded-full border font-medium ${color}`}>
                    {day}
                  </span>
                ))}
                <span className="text-xs text-slate-500">→ adjusts based on your rating</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm"
            >
              {loading ? 'Adding...' : '+ Add Topic'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
