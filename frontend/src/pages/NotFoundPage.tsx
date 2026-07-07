import { Link, useNavigate } from 'react-router-dom'
import { Flame, ArrowLeft, Home } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

export default function NotFoundPage() {
  useSEO({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist. Return to Burner Design Pro home page.',
  })
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-semibold text-white">
              <Flame className="w-8 h-8 text-[#f39c12]" />
              <span>Burner-Design-Pro</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
            <div className="text-8xl font-bold text-[#f39c12] mb-4">404</div>
            <h1 className="text-3xl font-semibold text-[#2c3e50] mb-4">
              Page Not Found
            </h1>
            <p className="text-[#7f8c8d] mb-8">
              Oops! The page you're looking for doesn't exist or has been moved.
              Let's get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-[#2c3e50] rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>

          <div className="mt-8 text-gray-400 text-sm">
            <p>Need help? <a href="mailto:support@burnerdesignpro.com" className="text-[#f39c12] hover:underline">Contact support</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
