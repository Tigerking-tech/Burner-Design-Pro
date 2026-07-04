import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { authAPI, subscriptionAPI } from '../services/api'
import { CheckCircle, Loader, ArrowRight } from 'lucide-react'

const SubscriptionSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const checkoutId = searchParams.get('checkout_id') || ''
  const orderId = searchParams.get('order_id') || ''

  useEffect(() => {
    confirmPayment()
  }, [])

  const confirmPayment = async () => {
    try {
      if (!authAPI.isAuthenticated()) {
        setStatus('success')
        setMessage('Payment successful! Please log in to access your Pro features.')
        return
      }

      // Poll for payment confirmation (webhook may take a few seconds)
      let attempts = 0
      const maxAttempts = 10

      const poll = async () => {
        attempts++
        try {
          if (orderId) {
            const result = await subscriptionAPI.confirmPayment(orderId)
            if (result.success) {
              setStatus('success')
              setMessage('Your Pro subscription is now active!')
              return
            }
          }

          // Also try refreshing subscription info
          const sub = await subscriptionAPI.getSubscription()
          if (sub.tier === 'pro') {
            setStatus('success')
            setMessage('Your Pro subscription is now active!')
            return
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            // Timeout - but payment likely succeeded, just webhook delay
            setStatus('success')
            setMessage('Payment received! Your subscription is being activated. If Pro features are not available yet, please refresh in a moment.')
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            setStatus('success')
            setMessage('Payment received! Your subscription is being activated. If Pro features are not available yet, please refresh in a moment.')
          }
        }
      }

      // Start polling after a short delay to give webhook time to process
      setTimeout(poll, 1500)
    } catch (err) {
      setStatus('success')
      setMessage('Payment received! Your subscription is being activated.')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-[#2c3e50] dark:to-[#34495e]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-200 dark:border-gray-700">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-3">
                Processing Your Payment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we confirm your subscription...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-[#2c3e50] dark:text-white mb-4">
                Welcome to Pro!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                {message}
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-3 text-left">
                  You now have access to:
                </h3>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    Flame Temperature Calculator
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    Insulation Calculator
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    Orifice Plate Calculator
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    PDF Report Export
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    Unlimited Calculations
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-[#2c3e50] dark:bg-amber-500 text-white rounded-lg font-semibold hover:bg-[#34495e] dark:hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  Start Using Pro Features
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/subscription')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
