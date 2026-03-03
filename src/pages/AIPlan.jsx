import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function AIPlan() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('daily')
  const [dailyPlan, setDailyPlan] = useState(null)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const generateDaily = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('http://localhost:5000/api/planner/daily', { headers })
      setDailyPlan(res.data)
    } catch (err) {
      setError('Failed to generate plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateWeekly = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('http://localhost:5000/api/planner/weekly', { headers })
      setWeeklyPlan(res.data)
    } catch (err) {
      setError('Failed to generate plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTypeStyle = (type) => {
    if (type === 'review') return 'bg-orange-100 text-orange-600'
    if (type === 'break') return 'bg-green-100 text-green-600'
    return 'bg-indigo-100 text-indigo-600'
  }

  const getTypeIcon = (type) => {
    if (type === 'review') return '🔄'
    if (type === 'break') return '☕'
    return '📖'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-xl">←</button>
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-gray-800">AI Study Planner</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'daily'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📅 Daily Plan
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🗓 Weekly Plan
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Daily Plan Tab */}
        {activeTab === 'daily' && (
          <div>
            {!dailyPlan ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Generate Today's Plan</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Gemini AI will analyze your topics and create a personalized study schedule for today
                </p>
                <button
                  onClick={generateDaily}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Generating...
                    </span>
                  ) : '✨ Generate Daily Plan'}
                </button>
              </div>
            ) : (
              <div>
                {/* Motivational tip */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">💡 Today's Tip</div>
                  <p className="font-medium">{dailyPlan.motivationalTip}</p>
                  <div className="mt-2 text-sm opacity-75">
                    Estimated study time: <strong>{dailyPlan.totalHours} hours</strong>
                  </div>
                </div>

                {/* Plan items */}
                <div className="space-y-3">
                  {dailyPlan.plan?.map((item, i) => (
                    <div key={i} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                      item.type === 'review' ? 'border-orange-400' :
                      item.type === 'break' ? 'border-green-400' : 'border-indigo-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getTypeIcon(item.type)}</span>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{item.topic}</div>
                            {item.subject && item.type !== 'break' && (
                              <div className="text-xs text-gray-400">{item.subject}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-600">{item.time}</div>
                          <div className="text-xs text-gray-400">{item.duration}</div>
                        </div>
                      </div>
                      {item.tip && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          💬 {item.tip}
                        </div>
                      )}
                      <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${getTypeStyle(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Regenerate button */}
                <button
                  onClick={() => { setDailyPlan(null); generateDaily() }}
                  disabled={loading}
                  className="mt-4 w-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 py-3 rounded-xl text-sm font-medium transition"
                >
                  🔄 Regenerate Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Weekly Plan Tab */}
        {activeTab === 'weekly' && (
          <div>
            {!weeklyPlan ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🗓</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Generate Weekly Plan</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Get a full 7-day study schedule balanced across all your topics
                </p>
                <button
                  onClick={generateWeekly}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Generating...
                    </span>
                  ) : '✨ Generate Weekly Plan'}
                </button>
              </div>
            ) : (
              <div>
                {/* Week summary */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 mb-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">📋 Week Overview</div>
                  <p className="font-medium">{weeklyPlan.weekSummary}</p>
                </div>

                {/* Days */}
                <div className="space-y-3">
                  {weeklyPlan.week?.map((day, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div>
                          <span className="font-bold text-gray-800">{day.day}</span>
                          <span className="text-gray-400 text-sm ml-2">{day.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{day.totalHours}h</span>
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                            {day.focus}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        {day.sessions?.map((session, j) => (
                          <div key={j} className="flex items-center gap-3 text-sm">
                            <span>{getTypeIcon(session.type)}</span>
                            <span className="font-medium text-gray-700">{session.topic}</span>
                            <span className="text-gray-400 text-xs">{session.subject}</span>
                            <span className="ml-auto text-gray-400 text-xs">{session.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setWeeklyPlan(null); generateWeekly() }}
                  disabled={loading}
                  className="mt-4 w-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 py-3 rounded-xl text-sm font-medium transition"
                >
                  🔄 Regenerate Plan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}