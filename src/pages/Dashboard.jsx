import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [dueTopics, setDueTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState({})
  const [ratingSuccess, setRatingSuccess] = useState({})

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const [allRes, dueRes] = await Promise.all([
        axios.get('http://localhost:5000/api/topics', { headers }),
        axios.get('http://localhost:5000/api/topics/due-today', { headers })
      ])
      setTopics(allRes.data)
      setDueTopics(dueRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRate = async (topicId, quality) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/topics/${topicId}/review`,
        { quality },
        { headers }
      )
      setRatingSuccess({ ...ratingSuccess, [topicId]: true })
      fetchTopics()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (topicId) => {
    if (!window.confirm('Delete this topic? This cannot be undone.')) return
    try {
        await axios.delete(`http://localhost:5000/api/topics/${topicId}`, { headers })
        fetchTopics()
    } catch (err) {
        console.error(err)
    }
 }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getNextReview = (date) => {
    const d = new Date(date)
    const today = new Date()
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Due today'
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-gray-800">StudyPlanner AI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Hi, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
          <button
                onClick={() => navigate('/ai-plan')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
                🤖 AI Plan
            </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{topics.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Topics</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-500">{dueTopics.length}</div>
            <div className="text-xs text-gray-500 mt-1">Due Today</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-500">
              {topics.filter(t => t.repetitions > 3).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Mastered</div>
          </div>
        </div>

        {/* Due today section */}
        {dueTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              🔥 Due for Review Today ({dueTopics.length})
            </h2>
            <div className="space-y-3">
              {dueTopics.map(topic => (
                <div key={topic._id} className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-400">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{topic.name}</h3>
                      <span className="text-xs text-gray-400">{topic.subject}</span>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                      Review #{topic.repetitions + 1}
                    </span>
                  </div>

                  {ratingSuccess[topic._id] ? (
                    <div className="text-green-600 text-sm font-medium">
                      ✅ Rated! Next review scheduled.
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">How well did you remember this?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(q => (
                          <button
                            key={q}
                            onClick={() => handleRate(topic._id, q)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                              q <= 2
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : q === 3
                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                        <span>Forgot</span>
                        <span>Perfect</span>
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
          <button
            onClick={() => navigate('/add-topic')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            + Add Topic
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-medium">No topics yet</p>
            <p className="text-sm mt-1">Add your first topic to get started</p>
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
              <div key={topic._id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-sm">{topic.name}</h3>
                        <span className="text-xs text-gray-400">{topic.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            topic.repetitions > 3
                                ? 'bg-green-100 text-green-600'
                                : 'bg-indigo-100 text-indigo-600'
                        }`}>
                            {topic.repetitions > 3 ? '⭐ Mastered' : `Rep ${topic.repetitions}`}
                        </span>
                        <button
                            onClick={() => handleDelete(topic._id)}
                            className="text-gray-300 hover:text-red-500 transition text-lg leading-none"
                            title="Delete topic"
                        >
                        🗑
                        </button>
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  📅 {getNextReview(topic.nextReviewDate)}
                </div>
                {/* Progress bar */}
                <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-indigo-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((topic.repetitions / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}