import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<{ code?: string; server?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setResendSuccess('')

    if (!email.trim()) {
      setErrors({ server: 'Email is required' })
      return
    }
    if (code.length !== 6) {
      setErrors({ code: 'Please enter the 6-digit code' })
      return
    }

    setIsLoading(true)
    try {
      await authAPI.verifyEmail(email.trim(), code.trim())
      navigate('/')
    } catch (error) {
      setErrors({
        server: error instanceof Error ? error.message : 'Verification failed. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim() || countdown > 0) return
    setErrors({})
    setResendSuccess('')
    setIsResending(true)

    try {
      const result = await authAPI.resendVerification(email.trim())
      setResendSuccess(result.message)
      setCountdown(60)
    } catch (error) {
      setErrors({
        server: error instanceof Error ? error.message : 'Failed to resend code.',
      })
    } finally {
      setIsResending(false)
    }
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
          <p className="text-[#bdc3c7] text-sm">Verify your email address</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300">
          <h1 className="text-2xl font-semibold text-[#2c3e50] mb-2 text-center">
            Email Verification
          </h1>
          <p className="text-sm text-[#7f8c8d] text-center mb-6">
            We've sent a 6-digit code to your email. Please enter it below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.server && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {errors.server}
              </div>
            )}
            {resendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
                {resendSuccess}
              </div>
            )}

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

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[#555] mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(val)
                }}
                className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 transition-colors text-gray-900 text-center text-2xl tracking-[0.5em] font-mono ${
                  errors.code
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-[#f39c12]/20 focus:border-[#f39c12]'
                }`}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded-md font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#7f8c8d]">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="text-[#f39c12] hover:text-[#e67e22] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : isResending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-[#7f8c8d]">
              Wrong email?{' '}
              <Link
                to="/signup"
                className="text-[#f39c12] hover:text-[#e67e22] font-medium transition-colors"
              >
                Sign up again
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
