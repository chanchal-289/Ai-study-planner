import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const links = [
    { path: '/dashboard', icon: '▦', label: 'Dashboard' },
    { path: '/add-topic', icon: '+', label: 'Add Topic' },
    { path: '/ai-plan', icon: '✦', label: 'AI Planner' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#0a0d14] border-r border-white/5 sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-lg shadow-indigo-500/30">
            🧠
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">StudyPlanner</div>
            <div className="text-xs text-indigo-400 font-medium">AI</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider px-3 mb-3">Menu</p>
        {links.map(({ path, icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive(path)
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
              isActive(path)
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'bg-white/5 text-slate-500'
            }`}>
              {icon}
            </span>
            {label}
            {isActive(path) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm flex-shrink-0">
            ↩
          </span>
          Logout
        </button>
      </div>
    </aside>
  )
}