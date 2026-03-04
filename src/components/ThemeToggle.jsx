import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-[#2d3148] dark:text-slate-200 dark:border-[#3d4266] dark:hover:bg-[#363b57] ${className}`}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}
