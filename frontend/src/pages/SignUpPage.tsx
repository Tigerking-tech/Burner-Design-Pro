import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import PasswordInput from '../components/PasswordInput'
import { useSEO } from '../hooks/useSEO'
import { useTheme } from '../components/ThemeProvider'

export default function SignUpPage() {
  useSEO({ title: 'Sign Up', description: 'Create a free account to access Burner Design Pro - professional burner design tools, flame temperature calculators, and thermal engineering resources.', keywords: 'burner design sign up, free thermal engineering account, register burner tools' })
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<{email?: string; confirmEmail?: string; password?: string; confirmPassword?: string; terms?: string; server?: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const { theme } = useTheme()

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++

    if (strength <= 1) return { level: 1, label: 'Weak', color: '#ef4444' }
    if (strength === 2) return { level: 2, label: 'Fair', color: '#f59e0b' }
    if (strength === 3) return { level: 3, label: 'Good', color: '#3b82f6' }
    return { level: 4, label: 'Strong', color: '#10b981' }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (pwd: string): boolean => {
    return pwd.length >= 8
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (email !== confirmEmail) {
      newErrors.confirmEmail = 'Email addresses do not match'
    }

    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const result = await authAPI.register(email, password, undefined, agreedToTerms)
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`)
    } catch (error) {
      console.error('Registration failed:', error)
      setErrors({
        server: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

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
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-200/80' : 'text-slate-500'}`}>Create your free account</p>
        </div>

        <div className={`rounded-2xl p-8 border shadow-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-black/20 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
          <h1 className={`text-xl font-semibold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.server && (
              <div className={`p-4 rounded-xl text-sm ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {errors.server}
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
                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500/50'
                    : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-blue-500/50 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmEmail" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Confirm Email Address
              </label>
              <input
                type="email"
                id="confirmEmail"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                  errors.confirmEmail 
                    ? 'border-red-500 focus:ring-red-500/50'
                    : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-blue-500/50 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
                placeholder="Re-enter your email"
              />
              {errors.confirmEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmEmail}</p>
              )}
            </div>

            <div>
              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
                error={!!errors.password}
                errorMessage={errors.password}
              />
              
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1.5 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: level <= passwordStrength.level 
                            ? passwordStrength.color 
                            : theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
                        }}
                      />
                    ))}
                  </div>
                  <p 
                    className="text-xs font-medium"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
              error={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
            />

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
                  Creating Account...
                </>
              ) : (
                'Create Free Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium transition-colors text-blue-500 hover:text-blue-400"
              >
                Log in
              </Link>
            </p>
          </div>

          <div className={`mt-6 pt-6 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="agree-terms" className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                I agree to the{' '}
                <Link to="/terms" className="text-blue-500 hover:text-blue-400 font-medium">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-blue-500 hover:text-blue-400 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-2 text-xs text-red-500">{errors.terms}</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className={`text-sm transition-colors flex items-center justify-center ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
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
