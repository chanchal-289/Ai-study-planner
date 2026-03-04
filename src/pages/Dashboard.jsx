import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [dueTopics, setDueTopics] = useState([])
  const [stats, setStats] = useState({ streak: 0, totalReviews: 0 })
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
        axios.get('http://localhost:5000/api/auth/stats', { headers })
      ])
      setTopics(allRes.data)
      setDueTopics(dueRes.data)
      setStats(statsRes.data)
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
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (topicId) => {
    if (!window.confirm('Delete this topic? This cannot be undone.')) return
    setDeletingId(topicId)
    try {
      await axios.delete(`http://localhost:5000/api/topics/${topicId}`, { headers })
      fetchAll()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const getNextReview = (date) => {
    const d = new Date(date)
    const today = new Date()
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return '🔴 Due today'
    if (diff === 1) return '🟡 Tomorrow'
    return `🟢 In ${diff} days`
  }

  const mastered = topics.filter(t => t.repetitions > 3).length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-gray-800 hidden sm:block">StudyPlanner AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/ai-plan')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1"
          >
            🤖 <span className="hidden sm:block">AI Plan</span>
          </button>
          <button
            onClick={() => navigate('/add-topic')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1"
          >
            + <span className="hidden sm:block">Add Topic</span>
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            👋 Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {dueTopics.length > 0
              ? `You have ${dueTopics.length} topic${dueTopics.length > 1 ? 's' : ''} due for review today`
              : 'You\'re all caught up for today! 🎉'}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-orange-500">{stats.streak}</div>
            <div className="text-xs text-gray-500 mt-0.5">Day Streak</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <div className="text-3xl mb-1">📚</div>
            <div className="text-2xl font-bold text-indigo-600">{topics.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Topics</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <div className="text-3xl mb-1">⏰</div>
            <div className="text-2xl font-bold text-red-500">{dueTopics.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Due Today</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-2xl font-bold text-green-500">{mastered}</div>
            <div className="text-xs text-gray-500 mt-0.5">Mastered</div>
          </div>
        </div>

        {/* Total reviews badge */}
        {stats.totalReviews > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-6 text-white flex items-center justify-between">
            <div>
              <div className="font-bold">🎯 {stats.totalReviews} total reviews completed!</div>
              <div className="text-sm opacity-80 mt-0.5">Keep up the great work</div>
            </div>
            {stats.streak >= 3 && (
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.streak} 🔥</div>
                <div className="text-xs opacity-80">day streak</div>
              </div>
            )}
          </div>
        )}

        {/* Due today */}
        {dueTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              🔥 Due for Review
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                {dueTopics.length}
              </span>
            </h2>
            <div className="space-y-3">
              {dueTopics.map(topic => (
                <div key={topic._id} className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-400">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{topic.name}</h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {topic.subject}
                      </span>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                      Review #{topic.repetitions + 1}
                    </span>
                  </div>
                  {ratingSuccess[topic._id] ? (
                    <div className="bg-green-50 text-green-600 text-sm font-medium px-3 py-2 rounded-lg">
                      ✅ Rated! Next review scheduled automatically.
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">
                        How well did you remember this?
                      </p>
                      <div className="flex gap-1.5">
                        {[
                          { q: 1, label: '😰', desc: 'Forgot' },
                          { q: 2, label: '😕', desc: 'Hard' },
                          { q: 3, label: '😐', desc: 'Okay' },
                          { q: 4, label: '😊', desc: 'Good' },
                          { q: 5, label: '🤩', desc: 'Perfect' },
                        ].map(({ q, label, desc }) => (
                          <button
                            key={q}
                            onClick={() => handleRate(topic._id, q)}
                            className={`flex-1 py-2 rounded-lg text-center transition hover:scale-105 active:scale-95 ${
                              q <= 2
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : q === 3
                                ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600'
                                : 'bg-green-50 hover:bg-green-100 text-green-600'
                            }`}
                          >
                            <div className="text-lg">{label}</div>
                            <div className="text-xs">{desc}</div>
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
          <h2 className="text-lg font-bold text-gray-800">📚 All Topics</h2>
          <span className="text-sm text-gray-400">{topics.length} topics</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-medium text-gray-700">No topics yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first topic to get started</p>
            <button
              onClick={() => navigate('/add-topic')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              + Add First Topic
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map(topic => (
              <div key={topic._id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{topic.name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {topic.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      topic.repetitions > 3
                        ? 'bg-green-100 text-green-600'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {topic.repetitions > 3 ? '⭐ Mastered' : `Rep ${topic.repetitions}`}
                    </span>
                    <button
                      onClick={() => handleDelete(topic._id)}
                      disabled={deletingId === topic._id}
                      className="text-gray-300 hover:text-red-400 transition text-base"
                      title="Delete topic"
                    >
                      {deletingId === topic._id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {getNextReview(topic.nextReviewDate)}
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-indigo-400 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((topic.repetitions / 5) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.min(topic.repetitions, 5)}/5 reviews to mastery
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}