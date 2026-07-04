import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscriptionAPI, authAPI, ApiError } from '../services/api'
import { Navbar } from '../components/Navbar'

function isAuthError(err: any): boolean {
  if (err instanceof ApiError && err.status === 401) return true
  const errorMsg = (err?.message || '').toLowerCase()
  return (
    errorMsg.includes('401') ||
    errorMsg.includes('could not validate credentials') ||
    errorMsg.includes('not authenticated') ||
    errorMsg.includes('session expired') ||
    errorMsg.includes('token') ||
    err?.status === 401
  )
}

interface Product {
  tier: string
  name: string
  price: number
  price_display: string
  features: string[]
  creem_product_id?: string
  is_configured: boolean
}

interface Subscription {
  tier: string
  tier_name?: string
  expires_at?: string | null
  is_active: boolean
  features?: string[]
  billing_portal_url?: string
}

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, subscriptionRes] = await Promise.all([
        subscriptionAPI.getProducts(),
        subscriptionAPI.getSubscription(),
      ])
      
      if (productsRes.success) {
        setProducts(productsRes.products)
      }
      
      setSubscription(subscriptionRes)
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      if (isAuthError(error)) {
        authAPI.logout()
        setError('Your session has expired. Please log in again.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError('Failed to load subscription data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (tier: string) => {
    setProcessing(tier)
    setError(null)
    try {
      const response = await subscriptionAPI.createCheckout(tier)
      
      if (response.success && response.checkout_url) {
        // Redirect to Creem hosted checkout
        window.location.href = response.checkout_url
      } else {
        setError('Failed to create checkout. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create checkout:', error)
      setError(error instanceof Error ? error.message : 'Failed to create checkout')
    } finally {
      setProcessing(null)
    }
  }

  const handleManageSubscription = () => {
    if (subscription?.billing_portal_url) {
      window.location.href = subscription.billing_portal_url
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel auto-renewal? Your Pro access will remain active until the end of your current billing period.')) {
      return
    }

    try {
      const response = await subscriptionAPI.cancelSubscription()
      if (response.success) {
        alert('Subscription cancelled successfully')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      setError('Failed to cancel subscription')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e]">
      {/* Header */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400">
            Unlock all features with a premium subscription
          </p>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-6 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Current Subscription Status */}
        {subscription && subscription.tier !== 'free' && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Current Plan: {subscription.tier_name || subscription.tier}
                </h3>
                <p className="text-gray-400">
                  {subscription.expires_at && (
                    <>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                {subscription.billing_portal_url && (
                  <button
                    onClick={handleManageSubscription}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Manage Billing
                  </button>
                )}
                <button
                  onClick={handleCancelSubscription}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Auto-Renewal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <div className="text-4xl font-bold text-white mb-6">$0</div>
            <p className="text-gray-400 mb-6">Perfect for trying out</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-gray-300">
                <span className="text-green-500 mr-2">✓</span>
                20 calculations per month
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-500 mr-2">✓</span>
                Basic calculators
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-500 mr-2">✓</span>
                Preview professional tools
              </li>
              <li className="flex items-center text-gray-500">
                <span className="text-red-500 mr-2">✗</span>
                PDF export
              </li>
            </ul>

            {subscription?.tier === 'free' ? (
              <button
                disabled
                className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Continue Free
              </button>
            )}
          </div>

          {/* Paid Tiers */}
          {products.map((product) => (
            <div
              key={product.tier}
              className={`bg-gray-800 rounded-xl p-8 border ${
                product.tier === 'pro' ? 'border-2 border-amber-500' : 'border-gray-700'
              } ${product.tier === 'pro' ? 'relative' : ''}`}
            >
              {product.tier === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
              <div className="text-4xl font-bold text-white mb-2">
                {product.price_display}
              </div>
              
              <ul className="space-y-3 mb-6">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {!product.is_configured && (
                <p className="text-yellow-500 text-sm mb-4">
                  Product not configured yet
                </p>
              )}

              {subscription?.tier === product.tier ? (
                <button
                  disabled
                  className="w-full py-3 bg-amber-500 text-white rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : product.is_configured ? (
                <button
                  onClick={() => handleSubscribe(product.tier)}
                  disabled={processing !== null}
                  className={`w-full py-3 text-white rounded-lg transition-colors ${
                    product.tier === 'pro'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-green-600 hover:bg-green-700'
                  } ${processing === product.tier ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing === product.tier ? 'Processing...' : 'Subscribe'}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Features Comparison</h2>
          
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Feature</th>
                  <th className="pb-3">Free</th>
                  <th className="pb-3">Pro</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700">
                  <td className="py-3">Basic Calculators</td>
                  <td className="py-3">✓</td>
                  <td className="py-3">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3">Calculation Limit</td>
                  <td className="py-3">Limited</td>
                  <td className="py-3">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3">PDF Export</td>
                  <td className="py-3">✗</td>
                  <td className="py-3">✓</td>
                </tr>
                <tr>
                  <td className="py-3">Advanced Calculators</td>
                  <td className="py-3">✗</td>
                  <td className="py-3">✓</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {[
              { feature: 'Basic Calculators', free: '✓', pro: '✓' },
              { feature: 'Calculation Limit', free: 'Limited', pro: 'Unlimited' },
              { feature: 'PDF Export', free: '✗', pro: '✓' },
              { feature: 'Advanced Calculators', free: '✗', pro: '✓' },
            ].map((row, i) => (
              <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-white font-medium mb-2">{row.feature}</div>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1">
                    <span className="text-gray-400">Free: </span>
                    <span className={`${row.free === '✓' ? 'text-green-400' : row.free === '✗' ? 'text-red-400' : 'text-gray-300'}`}>{row.free}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-400">Pro: </span>
                    <span className={`${row.pro === '✓' ? 'text-green-400' : row.pro === '✗' ? 'text-red-400' : 'text-amber-400 font-medium'}`}>{row.pro}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes, you can cancel your subscription anytime. Your access will continue until the end of the billing period.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400">
                We accept all major credit cards (Visa, Mastercard, American Express) and PayPal through our secure payment provider.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-400">
                Yes, all payments are processed securely through Creem. We never store your payment details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage
