import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import AppSidebar from '../components/AppSidebar'

const DEFAULT_WINDOW = { startTime: '09:00', endTime: '17:00' }

export default function AIPlan() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('daily')
  const [dailyPlan, setDailyPlan] = useState(null)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [monthlyPlan, setMonthlyPlan] = useState(null)
  const [dailyWindow, setDailyWindow] = useState(DEFAULT_WINDOW)
  const [weeklyWindow, setWeeklyWindow] = useState(DEFAULT_WINDOW)
  const [monthlyWindow, setMonthlyWindow] = useState(DEFAULT_WINDOW)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const loadSavedPlans = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/planner/saved', { headers })
        if (res.data?.daily?.data) {
          setDailyPlan(res.data.daily.data)
          setDailyWindow({
            startTime: res.data.daily.startTime || '09:00',
            endTime: res.data.daily.endTime || '17:00',
          })
        }
        if (res.data?.weekly?.data) {
          setWeeklyPlan(res.data.weekly.data)
          setWeeklyWindow({
            startTime: res.data.weekly.startTime || '09:00',
            endTime: res.data.weekly.endTime || '17:00',
          })
        }
        if (res.data?.monthly?.data) {
          setMonthlyPlan(res.data.monthly.data)
          setMonthlyWindow({
            startTime: res.data.monthly.startTime || '09:00',
            endTime: res.data.monthly.endTime || '17:00',
          })
        }
      } catch {
        // Keep this silent; AI plan can still be generated manually.
      }
    }
    loadSavedPlans()
  }, [])

  const generateDaily = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('http://localhost:5000/api/planner/daily', dailyWindow, { headers })
      setDailyPlan(res.data)
    } catch {
      setError('Failed to generate daily plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateWeekly = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('http://localhost:5000/api/planner/weekly', weeklyWindow, { headers })
      setWeeklyPlan(res.data)
    } catch {
      setError('Failed to generate weekly plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateMonthly = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('http://localhost:5000/api/planner/monthly', monthlyWindow, { headers })
      setMonthlyPlan(res.data)
    } catch {
      setError('Failed to generate monthly plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const typeStyle = (type) => ({
    review: 'border-l-orange-500 bg-orange-500/5',
    break: 'border-l-green-500 bg-green-500/5',
    study: 'border-l-indigo-500 bg-indigo-500/5',
  }[type] || 'border-l-indigo-500 bg-indigo-500/5')

  const typeIcon = (type) => ({ review: 'Review', break: 'Break', study: 'Study' }[type] || 'Study')

  const typeBadge = (type) => ({
    review: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    break: 'bg-green-500/10 text-green-400 border-green-500/20',
    study: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  }[type] || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20')

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )

  const TimeInputs = ({ window, setWindow, label }) => (
    <div className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-4 mb-4">
      <p className="text-sm text-slate-300 mb-3">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Start time</label>
          <input
            type="time"
            value={window.startTime}
            onChange={(e) => setWindow({ ...window, startTime: e.target.value })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d3148] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">End time</label>
          <input
            type="time"
            value={window.endTime}
            onChange={(e) => setWindow({ ...window, endTime: e.target.value })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d3148] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] md:flex">
      <AppSidebar />
      <div className="flex-1">
      <nav className="bg-[#1a1d27] border-b border-[#2d3148] px-4 md:px-6 py-4 md:hidden">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition text-xl">{'<'}</button>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">AI</div>
          <span className="font-bold text-white">AI Study Planner</span>
          <ThemeToggle className="ml-auto" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">AI Generated Plans</h1>
          <p className="text-slate-400 text-sm mt-1">Saved plans stay available until you delete them from dashboard.</p>
        </div>

        <div className="flex gap-2 mb-6 bg-[#1a1d27] border border-[#2d3148] rounded-xl p-1">
          {[
            { id: 'daily', label: 'Daily Plan' },
            { id: 'weekly', label: 'Weekly Plan' },
            { id: 'monthly', label: 'Monthly Plan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {activeTab === 'daily' && (
          !dailyPlan ? (
            <div className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl p-8 text-center">
              <TimeInputs window={dailyWindow} setWindow={setDailyWindow} label="Choose your study window for today." />
              <h2 className="text-xl font-bold text-white mb-2">Generate Today&apos;s Plan</h2>
              <p className="text-slate-400 text-sm mb-6">The daily plan will respect your start and end time.</p>
              <button
                onClick={generateDaily}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? <><Spinner /> Generating...</> : 'Generate Daily Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-xl p-5">
                <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">Today&apos;s Tip</div>
                <p className="text-white font-medium">{dailyPlan.motivationalTip}</p>
                <div className="text-slate-400 text-sm mt-2">Estimated: <strong className="text-white">{dailyPlan.totalHours} hours</strong></div>
                <div className="text-slate-400 text-sm mt-1">Window: {dailyPlan.startTime} - {dailyPlan.endTime}</div>
              </div>
              {dailyPlan.plan?.map((item, i) => (
                <div key={i} className={`bg-[#1a1d27] border border-[#2d3148] border-l-4 rounded-xl p-4 ${typeStyle(item.type)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-white text-sm">{item.topic}</div>
                      {item.subject && item.type !== 'break' && <div className="text-xs text-slate-400">{item.subject}</div>}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-slate-300">{item.time}</div>
                      <div className="text-xs text-slate-500">{item.duration}</div>
                    </div>
                  </div>
                  {item.tip && <div className="mt-3 text-xs text-slate-400 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2">{item.tip}</div>}
                  <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${typeBadge(item.type)}`}>{typeIcon(item.type)}</span>
                </div>
              ))}
              <button
                onClick={generateDaily}
                disabled={loading}
                className="w-full border border-[#2d3148] text-slate-400 hover:text-white hover:border-indigo-500/50 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Regenerating...</> : 'Regenerate Daily Plan'}
              </button>
            </div>
          )
        )}

        {activeTab === 'weekly' && (
          !weeklyPlan ? (
            <div className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl p-8 text-center">
              <TimeInputs window={weeklyWindow} setWindow={setWeeklyWindow} label="Choose your daily available hours for the week." />
              <h2 className="text-xl font-bold text-white mb-2">Generate Weekly Plan</h2>
              <p className="text-slate-400 text-sm mb-6">Each day in the weekly plan follows this time window.</p>
              <button
                onClick={generateWeekly}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? <><Spinner /> Generating...</> : 'Generate Weekly Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-xl p-4 mb-4">
                <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Week Overview</div>
                <p className="text-white font-medium">{weeklyPlan.weekSummary}</p>
                <p className="text-slate-400 text-sm mt-1">Window: {weeklyPlan.startTime} - {weeklyPlan.endTime}</p>
              </div>
              {weeklyPlan.week?.map((day, i) => (
                <div key={i} className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 bg-[#0f1117] border-b border-[#2d3148]">
                    <div>
                      <span className="font-bold text-white">{day.day}</span>
                      <span className="text-slate-500 text-sm ml-2">{day.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{day.totalHours}h</span>
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">{day.focus}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {day.sessions?.map((s, j) => (
                      <div key={j} className="flex items-center gap-3 text-sm">
                        <span className="text-slate-300 font-medium">{s.topic}</span>
                        <span className="text-slate-500 text-xs">{s.subject}</span>
                        <span className="ml-auto text-slate-500 text-xs">{s.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={generateWeekly}
                disabled={loading}
                className="w-full border border-[#2d3148] text-slate-400 hover:text-white hover:border-indigo-500/50 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Regenerating...</> : 'Regenerate Weekly Plan'}
              </button>
            </div>
          )
        )}

        {activeTab === 'monthly' && (
          !monthlyPlan ? (
            <div className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl p-8 text-center">
              <TimeInputs window={monthlyWindow} setWindow={setMonthlyWindow} label="Optional: set your preferred daily study window for this month." />
              <h2 className="text-xl font-bold text-white mb-2">Generate Monthly Plan</h2>
              <p className="text-slate-400 text-sm mb-6">Get a 4-week strategy saved to your dashboard.</p>
              <button
                onClick={generateMonthly}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? <><Spinner /> Generating...</> : 'Generate Monthly Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 border border-indigo-500/20 rounded-xl p-4 mb-4">
                <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">Month Overview</div>
                <p className="text-white font-medium">{monthlyPlan.monthSummary}</p>
                <p className="text-slate-400 text-sm mt-1">Window: {monthlyPlan.startTime} - {monthlyPlan.endTime}</p>
              </div>
              {monthlyPlan.weeks?.map((week, i) => (
                <div key={i} className="bg-[#1a1d27] border border-[#2d3148] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">{week.week}</h3>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">{week.focus}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Study days: {week.studyDays}</p>
                  <ul className="space-y-1">
                    {week.goals?.map((goal, idx) => (
                      <li key={idx} className="text-sm text-slate-300">{goal}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <button
                onClick={generateMonthly}
                disabled={loading}
                className="w-full border border-[#2d3148] text-slate-400 hover:text-white hover:border-indigo-500/50 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Regenerating...</> : 'Regenerate Monthly Plan'}
              </button>
            </div>
          )
        )}
      </div>
      </div>
    </div>
  )
}
