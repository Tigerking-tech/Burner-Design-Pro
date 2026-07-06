import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useSEO } from '../hooks/useSEO'

export default function ResetPasswordPage() {
  useSEO({ title: 'Reset Password', description: 'Set a new password for your account' })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
      setError('Invalid password reset link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await authAPI.confirmPasswordReset(token, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="text-3xl font-semibold tracking-tight text-white mb-2">
                <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-[#2c3e50] mb-4">
                Password Reset Successful!
              </h1>
              <p className="text-[#555] mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-block bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 px-8 rounded-md font-semibold transition-colors shadow-md"
              >
                Go to Sign In
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
          <p className="text-[#bdc3c7] text-sm">Set a new password</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-300">
          <h1 className="text-2xl font-semibold text-[#2c3e50] mb-6 text-center">
            Reset Password
          </h1>

          {email && (
            <p className="text-[#555] text-sm mb-4 text-center">
              Resetting password for <strong>{email}</strong>
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {!isValidToken ? (
            <div className="text-center">
              <p className="text-[#555] mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 px-8 rounded-md font-semibold transition-colors shadow-md"
              >
                Request New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#555] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#555] mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900"
                  placeholder="Confirm your new password"
                  required
                  minLength={8}
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-[#f39c12] hover:text-[#e67e22] font-medium transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
