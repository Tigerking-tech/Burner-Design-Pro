import React from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Lock, X } from 'lucide-react'

interface ProGuardProps {
  title: string
  description?: string
  icon: React.ReactNode
  children: React.ReactNode
}

export default function ProGuard({ 
  title, 
  description, 
  icon, 
  children 
}: ProGuardProps) {
  const navigate = useNavigate()
  
  const isProUser = authAPI.isAuthenticated() && authAPI.getSubscriptionTier() === 'pro'
  const isAuthenticated = authAPI.isAuthenticated()
  
  const handleSubscribe = () => {
    navigate('/subscription')
  }

  if (isProUser) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            {typeof icon === 'string' ? (
              <span className="text-4xl">{icon}</span>
            ) : (
              <span className="text-white">{icon}</span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {title}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {description || 'This feature is only available for Pro subscribers.'}
          </p>

          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 justify-center text-blue-600 dark:text-blue-400">
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Pro Required</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubscribe}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25"
            >
              Upgrade to Pro
            </button>
            
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/login')}
                className="w-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Log In
              </button>
            )}
            
            <button
              onClick={() => navigate('/')}
              className="w-full text-slate-500 dark:text-slate-400 py-3.5 rounded-xl font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
