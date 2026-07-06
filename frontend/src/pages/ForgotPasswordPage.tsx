import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useSEO } from '../hooks/useSEO'

export default function ForgotPasswordPage() {
  useSEO({ title: 'Forgot Password', description: 'Reset your Burner Design Pro password' })
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

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
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="text-3xl font-semibold tracking-tight text-white mb-2">
                <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
              </div>
            </Link>
            <p className="text-[#bdc3c7] text-sm">Check your email</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-[#2c3e50] mb-4">
                Check Your Email
              </h1>
              <p className="text-[#555] mb-6">
                If an account exists with <strong>{email}</strong>, we've sent a password reset link. 
                The link will expire in 1 hour.
              </p>
              <p className="text-sm text-[#7f8c8d] mb-6">
                Don't see the email? Check your spam folder or{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-[#f39c12] hover:text-[#e67e22] font-medium underline"
                >
                  try again
                </button>
              </p>
              <Link
                to="/login" className="block text-center text-[#f39c12] hover:text-[#e67e22] font-medium transition-colors">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-3xl font-semibold tracking-tight text-white mb-2">
              <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
            </div>
          </Link>
          <p className="text-[#bdc3c7] text-sm">Reset your password</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300">
          <h1 className="text-2xl font-semibold text-[#2c3e50] mb-6 text-center">
            Forgot Password?
          </h1>
          <p className="text-[#555] text-sm mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#555] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded-md font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            <p className="text-sm text-[#7f8c8d]">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-[#f39c12] hover:text-[#e67e22] font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-[#bdc3c7] hover:text-white transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
