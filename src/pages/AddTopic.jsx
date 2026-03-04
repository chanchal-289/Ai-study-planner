import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
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

  const steps = [
    { day: 'Day 1', color: 'from-indigo-500 to-indigo-400', desc: 'First review' },
    { day: 'Day 3', color: 'from-blue-500 to-blue-400', desc: 'Short gap' },
    { day: 'Day 7', color: 'from-violet-500 to-violet-400', desc: 'One week' },
    { day: 'Day 14', color: 'from-purple-500 to-purple-400', desc: 'Two weeks' },
    { day: 'Day 30', color: 'from-fuchsia-500 to-fuchsia-400', desc: 'One month' },
  ]

  return (
    <div className="min-h-screen bg-[#080b12] md:flex">
      <AppSidebar />
      <div className="flex-1 flex items-start justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="mb-8">
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-4 transition md:hidden">
              ← Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-lg">
                📝
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Add New Topic</h1>
                <p className="text-slate-500 text-sm">We'll automatically schedule your spaced reviews</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Form */}
            <div className="md:col-span-3">
              <div className="bg-[#0f1117] border border-white/5 rounded-2xl p-6">
                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                    ✅ Topic added! Redirecting...
                  </div>
                )}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-5">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Topic Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Photosynthesis, Linked Lists, World War II..."
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-500/5 transition text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Biology, DSA, History, Music..."
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-500/5 transition text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Adding...
                      </span>
                    ) : '+ Add Topic'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right side info */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-[#0f1117] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  🧠 How it works
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  After adding, reviews are scheduled using the SM-2 algorithm. Your confidence rating adjusts the next interval.
                </p>
                <div className="space-y-2">
                  {steps.map(({ day, color, desc }) => (
                    <div key={day} className="flex items-center gap-3">
                      <div className={`w-14 h-6 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-xs font-bold text-white">{day}</span>
                      </div>
                      <span className="text-xs text-slate-500">{desc}</span>
                    </div>
                  ))}
                  <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-white/5">
                    ↑ adjusts based on your confidence rating
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4">
                <div className="text-xs font-semibold text-indigo-400 mb-2">💡 Pro tip</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Be specific with topic names. "Newton's 3rd Law" is better than "Physics" — it helps the AI generate more targeted study tips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}