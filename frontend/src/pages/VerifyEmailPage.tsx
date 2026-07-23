import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useTheme } from '../components/ThemeProvider'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''
  const { theme } = useTheme()

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
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-blue-50 via-white to-slate-100'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 right-0 w-[600px] h-[600px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-blue-500/15' : 'bg-blue-500/10'}`} />
        <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-.5.083-1.033.25-1.5" />
            </svg>
            <span className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Burner<span className="text-blue-600">Design</span>Pro
            </span>
          </Link>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-200/80' : 'text-slate-500'}`}>Verify your email address</p>
        </div>

        <div className={`rounded-2xl p-8 border shadow-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-black/20 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
          <h1 className={`text-xl font-semibold mb-2 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Email Verification
          </h1>
          <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            We've sent a 6-digit code to your email. Please enter it below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.server && (
              <div className={`p-4 rounded-xl text-sm ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {errors.server}
              </div>
            )}
            {resendSuccess && (
              <div className={`p-4 rounded-xl text-sm ${theme === 'dark' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-50 border border-green-200 text-green-600'}`}>
                {resendSuccess}
              </div>
            )}

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

            <div>
              <label htmlFor="code" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
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
                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 text-center text-2xl tracking-[0.5em] font-mono ${
                  errors.code
                    ? theme === 'dark'
                      ? 'bg-white/5 border-red-500/50 text-white focus:ring-red-500/30 focus:border-red-500'
                      : 'bg-slate-50 border-red-500 text-slate-900 focus:ring-red-200 focus:border-red-500'
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-blue-500/50 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
              {errors.code && (
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errors.code}</p>
              )}
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
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className={`font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : isResending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </div>

          <div className={`mt-6 pt-6 border-t text-center ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Wrong email?{' '}
              <Link
                to="/signup"
                className={`font-medium transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Sign up again
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
