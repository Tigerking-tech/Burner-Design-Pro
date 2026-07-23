import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { authAPI, subscriptionAPI } from '../services/api'
import { CheckCircle, Loader, ArrowRight, RefreshCw } from 'lucide-react'

const SubscriptionSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'pending'>('loading')
  const [message, setMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkoutId = searchParams.get('checkout_id') || ''
  const orderId = searchParams.get('order_id') || ''

  useEffect(() => {
    confirmPayment()
  }, [])

  const refreshSubscriptionStatus = async () => {
    setIsRefreshing(true)
    try {
      if (orderId) {
        await subscriptionAPI.confirmPayment(orderId)
      }

      const refreshResult = await subscriptionAPI.refreshSubscription()
      
      const sub = await subscriptionAPI.getSubscription()
      if (sub.tier === 'pro') {
        await authAPI.getCurrentUser()
        setStatus('success')
        setMessage('Your Pro subscription is now active!')
        return
      }

      if (refreshResult.success) {
        await authAPI.getCurrentUser()
        const updatedSub = await subscriptionAPI.getSubscription()
        if (updatedSub.tier === 'pro') {
          setStatus('success')
          setMessage('Your Pro subscription is now active!')
        } else {
          setMessage('Refreshed successfully but subscription not yet active. Please wait a moment.')
        }
      } else {
        setMessage('Refresh failed: ' + refreshResult.message)
      }
    } catch (err: any) {
      setMessage('Failed to refresh: ' + (err.message || 'Unknown error'))
    } finally {
      setIsRefreshing(false)
    }
  }

  const confirmPayment = async () => {
    try {
      if (!authAPI.isAuthenticated()) {
        setStatus('success')
        setMessage('Payment successful! Please log in to access your Pro features.')
        return
      }

      let attempts = 0
      const maxAttempts = 20

      const poll = async () => {
        attempts++
        try {
          let proActivated = false

          if (orderId) {
            const result = await subscriptionAPI.confirmPayment(orderId)
            if (result.success) {
              proActivated = true
            }
          }

          if (!proActivated) {
            const refreshResult = await subscriptionAPI.refreshSubscription()
            if (refreshResult.success && refreshResult.tier === 'pro') {
              proActivated = true
            }
          }

          if (!proActivated) {
            const sub = await subscriptionAPI.getSubscription()
            if (sub.tier === 'pro') {
              proActivated = true
            }
          }

          if (proActivated) {
            await authAPI.getCurrentUser()
            setStatus('success')
            setMessage('Your Pro subscription is now active!')
            return
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, 3000)
          } else {
            await authAPI.getCurrentUser()
            setStatus('pending')
            setMessage('Payment received! Your subscription is being activated. If Pro features are not available yet, please use the refresh button below.')
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000)
          } else {
            await authAPI.getCurrentUser()
            setStatus('pending')
            setMessage('Payment received! Your subscription is being activated. If Pro features are not available yet, please use the refresh button below.')
          }
        }
      }

      setTimeout(poll, 1500)
    } catch (err) {
      try {
        await authAPI.getCurrentUser()
      } catch {}
      setStatus('pending')
      setMessage('Payment received! Your subscription is being activated.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-xl p-8 md:p-12 text-center border border-slate-200 dark:border-white/10 backdrop-blur-xl">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Processing Your Payment
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Please wait while we confirm your subscription...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Welcome to Pro!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                {message}
              </p>

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-left">
                  You now have access to:
                </h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Flame Temperature Calculator
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Insulation Calculator
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Orifice Plate Calculator
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    PDF Report Export
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Unlimited Calculations
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  Start Using Pro Features
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/subscription')}
                  className="px-6 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  View Subscription
                </button>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Payment Received
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                {message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <button
                  onClick={refreshSubscriptionStatus}
                  disabled={isRefreshing}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Refresh Subscription Status
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-left">
                  You will soon have access to:
                </h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Flame Temperature Calculator
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Insulation Calculator
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Orifice Plate Calculator
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    PDF Report Export
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={12} strokeWidth={3} />
                    </span>
                    Unlimited Calculations
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  Continue to App
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/subscription')}
                  className="px-6 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  View Subscription
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionSuccessPage
