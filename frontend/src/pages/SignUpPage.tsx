import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{email?: string; password?: string; confirmPassword?: string}>({})
  const [isLoading, setIsLoading] = useState(false)

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++

    if (strength <= 1) return { level: 1, label: 'Weak', color: '#e74c3c' }
    if (strength === 2) return { level: 2, label: 'Fair', color: '#f39c12' }
    if (strength === 3) return { level: 3, label: 'Good', color: '#3498db' }
    return { level: 4, label: 'Strong', color: '#27ae60' }
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

    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userEmail', email)
      
      navigate('/gas-calculator')
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-3xl font-semibold tracking-tight text-white mb-2">
              <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
            </div>
          </Link>
          <p className="text-[#bdc3c7] text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300">
          <h1 className="text-2xl font-semibold text-[#2c3e50] mb-6 text-center">
            Sign Up
          </h1>

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
                className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-[#f39c12]/20 focus:border-[#f39c12]'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#555] mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-[#f39c12]/20 focus:border-[#f39c12]'
                }`}
                placeholder="Min. 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: level <= passwordStrength.level 
                            ? passwordStrength.color 
                            : '#e0e0e0'
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#555] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-[#f39c12]/20 focus:border-[#f39c12]'
                }`}
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
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
                  Creating Account...
                </>
              ) : (
                'Create Free Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#7f8c8d]">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-[#f39c12] hover:text-[#e67e22] font-medium transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-[#7f8c8d] text-center">
              By creating an account, you agree to our{' '}
              <a href="#terms" className="text-[#f39c12] hover:text-[#e67e22]">Terms of Service</a>
              {' '}and{' '}
              <a href="#privacy" className="text-[#f39c12] hover:text-[#e67e22]">Privacy Policy</a>
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
