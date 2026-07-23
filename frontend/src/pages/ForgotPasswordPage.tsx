import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useSEO } from '../hooks/useSEO'
import { useTheme } from '../components/ThemeProvider'

export default function ForgotPasswordPage() {
  useSEO({ title: 'Forgot Password', description: 'Reset your Burner Design Pro password' })
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { theme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authAPI.requestPasswordReset(email)
      setEmailSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-blue-50 via-white to-slate-100'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-20 right-0 w-[600px] h-[600px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-blue-500/15' : 'bg-blue-500/10'}`} />
          <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`} />
        </div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? '#3b82f6' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-.5.083-1.033.25-1.5" />
              </svg>
              <span className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Burner<span className="text-blue-600">Design</span>Pro
              </span>
            </Link>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-200/80' : 'text-slate-500'}`}>Check your email</p>
          </div>

          <div className={`rounded-2xl p-8 border shadow-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-black/20 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Check Your Email
              </h1>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                The link will expire in 1 hour.
              </p>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Don't see the email? Check your spam folder or{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className={`font-medium underline transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  try again
                </button>
              </p>
              <Link
                to="/login"
                className={`block text-center font-medium transition-colors flex items-center justify-center ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Sign In
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className={`text-sm transition-colors flex items-center justify-center ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-blue-50 via-white to-slate-100'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 right-0 w-[600px] h-[600px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-blue-500/15' : 'bg-blue-500/10'}`} />
        <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? '#3b82f6' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-.5.083-1.033.25-1.5" />
            </svg>
            <span className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Burner<span className="text-blue-600">Design</span>Pro
            </span>
          </Link>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-200/80' : 'text-slate-500'}`}>Reset your password</p>
        </div>

        <div className={`rounded-2xl p-8 border shadow-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-black/20 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
          <h1 className={`text-xl font-semibold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Forgot Password?
          </h1>
          <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className={`mb-4 p-4 rounded-xl text-sm ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-blue-500/50 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-500/20 focus:border-blue-500'}`}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Remember your password?{' '}
              <Link
                to="/login"
                className={`font-medium transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className={`text-sm transition-colors flex items-center justify-center ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
