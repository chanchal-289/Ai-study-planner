import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import AppSidebar from '../components/AppSidebar'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [dueTopics, setDueTopics] = useState([])
  const [stats, setStats] = useState({ streak: 0, totalReviews: 0 })
  const [savedPlans, setSavedPlans] = useState({ daily: null, weekly: null, monthly: null })
  const [loading, setLoading] = useState(true)
  const [ratingSuccess, setRatingSuccess] = useState({})
  const [deletingId, setDeletingId] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [allRes, dueRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/topics', { headers }),
        axios.get('http://localhost:5000/api/topics/due-today', { headers }),
        axios.get('http://localhost:5000/api/auth/stats', { headers }),
      ])
      setTopics(allRes.data)
      setDueTopics(dueRes.data)
      setStats(statsRes.data)
      // Try saved plans separately so it doesn't break if route doesn't exist
      try {
        const plansRes = await axios.get('http://localhost:5000/api/planner/saved', { headers })
        setSavedPlans(plansRes.data || { daily: null, weekly: null, monthly: null })
      } catch {}
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRate = async (topicId, quality) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/topics/${topicId}/review`,
        { quality },
        { headers }
      )
      setRatingSuccess({ ...ratingSuccess, [topicId]: true })
      setStats(s => ({ ...s, streak: res.data.streak, totalReviews: res.data.totalReviews }))
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (topicId) => {
    if (!window.confirm('Delete this topic?')) return
    setDeletingId(topicId)
    try {
      await axios.delete(`http://localhost:5000/api/topics/${topicId}`, { headers })
      fetchAll()
    } catch (err) { console.error(err) }
    finally { setDeletingId(null) }
  }

  const handleDeletePlan = async (type) => {
    if (!window.confirm(`Delete saved ${type} plan?`)) return
    try {
      await axios.delete(`http://localhost:5000/api/planner/saved/${type}`, { headers })
      setSavedPlans(prev => ({ ...prev, [type]: null }))
    } catch (err) { console.error(err) }
  }

  const getNextReview = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return { label: 'Due today', color: 'text-red-400', dot: 'bg-red-400' }
    if (diff === 1) return { label: 'Tomorrow', color: 'text-yellow-400', dot: 'bg-yellow-400' }
    return { label: `In ${diff} days`, color: 'text-emerald-400', dot: 'bg-emerald-400' }
  }

  const mastered = topics.filter(t => t.repetitions > 3).length

  const statCards = [
    {
      icon: '🔥', value: stats.streak, label: 'Day Streak',
      valueColor: 'text-orange-400',
      gradient: 'from-orange-500/10 to-red-500/5',
      border: 'border-orange-500/20',
      glow: 'shadow-orange-500/10'
    },
    {
      icon: '📚', value: topics.length, label: 'Total Topics',
      valueColor: 'text-indigo-400',
      gradient: 'from-indigo-500/10 to-blue-500/5',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/10'
    },
    {
      icon: '⏰', value: dueTopics.length, label: 'Due Today',
      valueColor: 'text-red-400',
      gradient: 'from-red-500/10 to-pink-500/5',
      border: 'border-red-500/20',
      glow: 'shadow-red-500/10'
    },
    {
      icon: '⭐', value: mastered, label: 'Mastered',
      valueColor: 'text-yellow-400',
      gradient: 'from-yellow-500/10 to-amber-500/5',
      border: 'border-yellow-500/20',
      glow: 'shadow-yellow-500/10'
    },
  ]

  const ratings = [
    { q: 1, emoji: '😰', label: 'Forgot', color: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-400/40' },
    { q: 2, emoji: '😕', label: 'Hard', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400/40' },
    { q: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400/40' },
    { q: 4, emoji: '😊', label: 'Good', color: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 hover:border-green-400/40' },
    { q: 5, emoji: '🤩', label: 'Perfect', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400/40' },
  ]

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-[#080b12] md:flex">
      <AppSidebar />

      <div className="flex-1 min-w-0">
        {/* Mobile navbar */}
        <nav className="bg-[#0f1117]/80 backdrop-blur border-b border-white/5 px-4 py-3 sticky top-0 z-10 md:hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-indigo-500/30">🧠</div>
              <span className="font-bold text-white text-sm">StudyPlanner AI</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/ai-plan')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-lg shadow-indigo-500/20">
                🤖 AI
              </button>
              <button onClick={() => navigate('/add-topic')}
                className="bg-white/5 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-white/10">
                + Topic
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 md:p-8 max-w-5xl">

          {/* Welcome header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">{getGreeting()},</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {user?.name} 👋
                </h1>
                <p className={`text-sm mt-2 ${dueTopics.length > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {dueTopics.length > 0
                    ? `⚡ ${dueTopics.length} topic${dueTopics.length > 1 ? 's' : ''} waiting for review`
                    : '✓ You\'re all caught up for today!'}
                </p>
              </div>
              {stats.streak >= 2 && (
                <div className="hidden md:flex flex-col items-center bg-gradient-to-b from-orange-500/15 to-transparent border border-orange-500/20 rounded-2xl px-5 py-3">
                  <span className="text-3xl">🔥</span>
                  <span className="text-2xl font-bold text-orange-400 leading-none">{stats.streak}</span>
                  <span className="text-xs text-slate-500 mt-0.5">day streak</span>
                </div>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {statCards.map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-4 shadow-xl ${s.glow} hover:scale-[1.02] transition-transform duration-200`}>
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className={`text-3xl font-bold ${s.valueColor} leading-none`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Reviews completed banner */}
          {stats.totalReviews > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/15 via-purple-600/10 to-indigo-600/15 border border-indigo-500/20 rounded-2xl p-4 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
              <div className="relative flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold">🎯 {stats.totalReviews} total reviews completed</div>
                  <div className="text-slate-400 text-sm mt-0.5">Keep building that momentum</div>
                </div>
                <button onClick={() => navigate('/ai-plan')}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-lg shadow-indigo-500/20 hidden sm:block">
                  Generate Plan →
                </button>
              </div>
            </div>
          )}

          {/* Saved plans */}
          {(savedPlans.daily || savedPlans.monthly) && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-purple-500 rounded-full inline-block" />
                  Saved Plans
                </h2>
                <button onClick={() => navigate('/ai-plan')}
                  className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-indigo-500/40 px-3 py-1 rounded-lg transition">
                  Open Planner →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedPlans.daily && (
                  <div className="bg-[#0f1117] border border-white/5 rounded-xl p-4 hover:border-indigo-500/20 transition group">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        Daily Plan
                      </h3>
                      <button onClick={() => handleDeletePlan('daily')}
                        className="text-xs text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                        Delete
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Sessions: {savedPlans.daily.data?.plan?.length || 0}</p>
                    <p className="text-sm text-slate-300 mt-2 line-clamp-2">{savedPlans.daily.data?.motivationalTip || 'Daily plan ready'}</p>
                  </div>
                )}
                {savedPlans.monthly && (
                  <div className="bg-[#0f1117] border border-white/5 rounded-xl p-4 hover:border-purple-500/20 transition group">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full" />
                        Monthly Plan
                      </h3>
                      <button onClick={() => handleDeletePlan('monthly')}
                        className="text-xs text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                        Delete
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Weeks: {savedPlans.monthly.data?.weeks?.length || 0}</p>
                    <p className="text-sm text-slate-300 mt-2 line-clamp-2">{savedPlans.monthly.data?.monthSummary || 'Monthly strategy plan ready'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Due for review */}
          {dueTopics.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block" />
                Due for Review
                <span className="bg-orange-500/15 text-orange-400 text-xs px-2 py-0.5 rounded-full border border-orange-500/20 font-medium">
                  {dueTopics.length}
                </span>
              </h2>
              <div className="space-y-3">
                {dueTopics.map(topic => (
                  <div key={topic._id} className="relative bg-[#0f1117] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-orange-500/20 transition">
                    {/* Left accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-l-2xl" />
                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-white text-base">{topic.name}</h3>
                          <span className="text-xs text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                            {topic.subject}
                          </span>
                        </div>
                        <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-semibold">
                          Review #{topic.repetitions + 1}
                        </span>
                      </div>
                      {ratingSuccess[topic._id] ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                          <span>✅</span>
                          <span>Rated! Next review scheduled automatically.</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Rate your recall</p>
                          <div className="flex gap-2">
                            {ratings.map(({ q, emoji, label, color }) => (
                              <button key={q} onClick={() => handleRate(topic._id, q)}
                                className={`flex-1 py-3 rounded-xl text-center border transition-all duration-150 hover:scale-105 active:scale-95 ${color}`}>
                                <div className="text-xl">{emoji}</div>
                                <div className="text-xs mt-1 font-semibold">{label}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All topics */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
                All Topics
                <span className="text-slate-600 font-normal text-sm">{topics.length}</span>
              </h2>
              <button onClick={() => navigate('/add-topic')}
                className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 px-3 py-1.5 rounded-lg transition font-medium">
                + Add Topic
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                <p className="text-slate-600 text-sm">Loading topics...</p>
              </div>
            ) : topics.length === 0 ? (
              <div className="bg-[#0f1117] border border-white/5 rounded-2xl p-16 text-center">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-xl font-bold text-white">Start your study journey</p>
                <p className="text-sm text-slate-500 mt-2 mb-6">Add your first topic and let AI schedule your reviews</p>
                <button onClick={() => navigate('/add-topic')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-lg shadow-indigo-500/20">
                  + Add First Topic
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.map(topic => {
                  const review = getNextReview(topic.nextReviewDate)
                  const progress = Math.min((topic.repetitions / 5) * 100, 100)
                  return (
                    <div key={topic._id}
                      className="bg-[#0f1117] border border-white/5 rounded-2xl p-4 hover:border-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 group cursor-default">
                      
                      {/* Top row */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate">{topic.name}</h3>
                          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full mt-1.5 inline-block border border-white/5">
                            {topic.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                          {topic.repetitions > 3 ? (
                            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">
                              ⭐ Mastered
                            </span>
                          ) : (
                            <span className="text-xs bg-slate-800 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-medium">
                              Rep {topic.repetitions}
                            </span>
                          )}
                          <button onClick={() => handleDelete(topic._id)}
                            disabled={deletingId === topic._id}
                            className="text-slate-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm leading-none p-0.5">
                            {deletingId === topic._id ? '...' : '✕'}
                          </button>
                        </div>
                      </div>

                      {/* Review date */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${review.dot}`} />
                        <span className={`text-xs font-medium ${review.color}`}>{review.label}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progress}%`,
                              background: progress === 100
                                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                            }}
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-700">{Math.min(topic.repetitions, 5)}/5 reviews</span>
                          <span className="text-xs text-slate-700">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}