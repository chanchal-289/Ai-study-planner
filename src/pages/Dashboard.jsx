import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👋 Welcome, {user?.name}!</h1>
            <p className="text-gray-500">Here's your study plan for today</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-lg font-medium">No topics yet</p>
          <p className="text-sm mt-1">Add your first topic to get started</p>
          <button
            onClick={() => navigate('/add-topic')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            + Add Topic
          </button>
        </div>
      </div>
    </div>
  )
}