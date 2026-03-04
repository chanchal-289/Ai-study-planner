import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
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
      const [allRes, dueRes, statsRes, plansRes] = await Promise.all([
        axios.get('http://localhost:5000/api/topics', { headers }),
        axios.get('http://localhost:5000/api/topics/due-today', { headers }),
        axios.get('http://localhost:5000/api/auth/stats', { headers }),
        axios.get('http://localhost:5000/api/planner/saved', { headers })
      ])
      setTopics(allRes.data)
      setDueTopics(dueRes.data)
      setStats(statsRes.data)
      setSavedPlans(plansRes.data || { daily: null, weekly: null, monthly: null })
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
      setSavedPlans((prev) => ({ ...prev, [type]: null }))
    } catch (err) {
      console.error(err)
    }
  }

  const getNextReview = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return { label: 'Due today', color: 'text-red-400' }
    if (diff === 1) return { label: 'Tomorrow', color: 'text-yellow-400' }
    return { label: `In ${diff} days`, color: 'text-green-400' }
  }

  const mastered = topics.filter(t => t.repetitions > 3).length

  const ratings = [
    { q: 1, emoji: '😰', label: 'Forgot', color: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' },
    { q: 2, emoji: '😕', label: 'Hard', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20' },
    { q: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20' },
    { q: 4, emoji: '😊', label: 'Good', color: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' },
    { q: 5, emoji: '🤩', label: 'Perfect', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117] md:flex">
      <AppSidebar />
      <div className="flex-1">

      {/* Navbar */}
      <nav className="bg-[#1a1d27] border-b border-[#2d3148] px-4 md:px-6 py-4 sticky top-0 z-10 md:hidden">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">🧠</div>
            <span className="font-bold text-white hidden sm:block">StudyPlanner AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/ai-plan')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              🤖 <span className="hidden sm:block">AI Plan</span>
            </button>
            <button
              onClick={() => navigate('/add-topic')}
              className="flex items-center gap-1.5 bg-[#2d3148] hover:bg-[#363b57] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition border border-[#3d4266]"
            >
              + <span className="hidden sm:block">Add Topic</span>
            </button>
            <ThemeToggle />
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            👋 Hey, {user?.name}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {dueTopics.length > 0
              ? `You have ${dueTopics.length} topic${dueTopics.length > 1 ? 's' : ''} waiting for review`
              : "You're all caught up for today! 🎉"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '🔥', value: stats.streak, label: 'Day Streak', color: 'text-orange-400' },
            { icon: '📚', value: topics.length, label: 'Total Topics', color: 'text-indigo-400' },
            { icon: '⏰', value: dueTopics.length, label: 'Due Today', color: 'text-red-400' },
            { icon: '⭐', value: mastered, label: 'Mastered', color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {(savedPlans.daily || savedPlans.monthly) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Saved Plans</h2>
              <button
                onClick={() => navigate('/ai-plan')}
                className="text-xs border border-[#2d3148] text-slate-400 hover:text-white hover:border-indigo-500/50 px-3 py-1 rounded-lg transition"
              >
                Open Planner
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedPlans.daily && (
                <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">Daily Plan</h3>
                    <button
                      onClick={() => handleDeletePlan('daily')}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete plan
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Window: {savedPlans.daily.data?.startTime || savedPlans.daily.startTime} - {savedPlans.daily.data?.endTime || savedPlans.daily.endTime}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Sessions: {savedPlans.daily.data?.plan?.length || 0}
                  </p>
                  <p className="text-sm text-slate-300 mt-2">
                    {savedPlans.daily.data?.motivationalTip || 'Daily plan ready'}
                  </p>
                </div>
              )}
              {savedPlans.monthly && (
                <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">Monthly Plan</h3>
                    <button
                      onClick={() => handleDeletePlan('monthly')}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete plan
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Window: {savedPlans.monthly.data?.startTime || savedPlans.monthly.startTime} - {savedPlans.monthly.data?.endTime || savedPlans.monthly.endTime}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Weeks: {savedPlans.monthly.data?.weeks?.length || 0}
                  </p>
                  <p className="text-sm text-slate-300 mt-2">
                    {savedPlans.monthly.data?.monthSummary || 'Monthly strategy plan ready'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews banner */}
        {stats.totalReviews > 0 && (
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <div className="text-white font-semibold">🎯 {stats.totalReviews} reviews completed!</div>
              <div className="text-slate-400 text-sm">Keep building that streak</div>
            </div>
            {stats.streak >= 2 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">{stats.streak} 🔥</div>
                <div className="text-xs text-slate-400">day streak</div>
              </div>
            )}
          </div>
        )}

        {/* Due today */}
        {dueTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              🔥 Due for Review
              <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full border border-orange-500/20">
                {dueTopics.length}
              </span>
            </h2>
            <div className="space-y-3">
              {dueTopics.map(topic => (
                <div key={topic._id} className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-5 border-l-4 border-l-orange-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{topic.name}</h3>
                      <span className="text-xs text-slate-400 bg-[#0f1117] px-2 py-0.5 rounded-full mt-1 inline-block border border-[#2d3148]">
                        {topic.subject}
                      </span>
                    </div>
                    <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-full font-medium">
                      Review #{topic.repetitions + 1}
                    </span>
                  </div>
                  {ratingSuccess[topic._id] ? (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2.5 rounded-lg">
                      ✅ Rated! Next review scheduled automatically.
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">How well did you remember this?</p>
                      <div className="flex gap-2">
                        {ratings.map(({ q, emoji, label, color }) => (
                          <button
                            key={q}
                            onClick={() => handleRate(topic._id, q)}
                            className={`flex-1 py-2.5 rounded-xl text-center border transition ${color}`}
                          >
                            <div className="text-lg">{emoji}</div>
                            <div className="text-xs mt-0.5 font-medium">{label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All topics */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-white">📚 All Topics</h2>
          <span className="text-sm text-slate-500">{topics.length} topics</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-medium text-white">No topics yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first topic to get started</p>
            <button
              onClick={() => navigate('/add-topic')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition"
            >
              + Add First Topic
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map(topic => {
              const review = getNextReview(topic.nextReviewDate)
              return (
                <div key={topic._id} className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-4 hover:border-indigo-500/40 transition group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">{topic.name}</h3>
                      <span className="text-xs text-slate-400 bg-[#0f1117] border border-[#2d3148] px-2 py-0.5 rounded-full mt-1 inline-block">
                        {topic.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                        topic.repetitions > 3
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {topic.repetitions > 3 ? '⭐ Mastered' : `Rep ${topic.repetitions}`}
                      </span>
                      <button
                        onClick={() => handleDelete(topic._id)}
                        disabled={deletingId === topic._id}
                        className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className={`text-xs font-medium mb-2 ${review.color}`}>
                    📅 {review.label}
                  </div>
                  <div className="bg-[#0f1117] rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((topic.repetitions / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {Math.min(topic.repetitions, 5)}/5 to mastery
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
