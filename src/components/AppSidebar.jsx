import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/add-topic', label: 'Add Topic' },
  { to: '/ai-plan', label: 'AI Planner' },
]

export default function AppSidebar() {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:min-h-screen bg-[#1a1d27] border-r border-[#2d3148] p-4 sticky top-0">
      <div className="mb-6">
        <h2 className="text-white font-bold text-lg">StudyPlanner AI</h2>
        <p className="text-xs text-slate-400 mt-1">Navigation</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2 rounded-lg text-sm transition border ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'text-slate-300 border-transparent hover:bg-[#2d3148] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <ThemeToggle className="w-full" />
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="w-full px-3 py-2 rounded-lg text-sm border border-[#2d3148] text-slate-300 hover:text-white hover:border-red-500/40 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
