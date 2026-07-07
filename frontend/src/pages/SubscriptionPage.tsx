import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { subscriptionAPI, authAPI, ApiError } from '../services/api'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'
import { Crown, Check, X, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react'

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
  current_period_end?: string | null
  creem_status?: string
  is_active: boolean
  features?: string[]
  billing_portal_url?: string
  auto_renewal_active?: boolean
}

const SubscriptionPage: React.FC = () => {
  useSEO({
    title: 'Pricing & Subscription',
    description: 'Choose the perfect plan for your burner design needs. Start free, upgrade to Pro for unlimited calculations, PDF export, and advanced tools.',
  })
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const isLoggedIn = authAPI.isAuthenticated()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const productsRes = await subscriptionAPI.getProducts()
      if (productsRes.success) {
        setProducts(productsRes.products)
      }

      if (isLoggedIn) {
        try {
          const subRes = await subscriptionAPI.getSubscription()
          setSubscription(subRes)
        } catch (subErr: any) {
          if (!isAuthError(subErr)) {
            console.error('Failed to fetch subscription:', subErr)
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      if (isAuthError(err)) {
        authAPI.logout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSubscription = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const subRes = await subscriptionAPI.getSubscription()
      setSubscription(subRes)
    } catch (err: any) {
      console.error('Failed to refresh subscription:', err)
      setError('Failed to refresh subscription status')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSubscribe = async (tier: string) => {
    if (!isLoggedIn) {
      navigate('/signup')
      return
    }
    setProcessing(tier)
    setError(null)
    try {
      const response = await subscriptionAPI.createCheckout(tier)
      if (response.success && response.checkout_url) {
        window.location.href = response.checkout_url
      } else {
        setError('Failed to create checkout. Please try again.')
      }
    } catch (err: any) {
      console.error('Failed to create checkout:', err)
      setError(err instanceof Error ? err.message : 'Failed to create checkout')
    } finally {
      setProcessing(null)
    }
  }

  const handleManageBilling = async () => {
    if (subscription?.billing_portal_url) {
      window.open(subscription.billing_portal_url, '_blank', 'noopener,noreferrer')
      return
    }
    
    setRefreshing(true)
    setError(null)
    try {
      const currentSub = await subscriptionAPI.getSubscription()
      if (currentSub.billing_portal_url) {
        setSubscription(currentSub)
        window.open(currentSub.billing_portal_url, '_blank', 'noopener,noreferrer')
      } else {
        setError("Unable to open billing portal. Please try refreshing.")
      }
    } catch (err: any) {
      console.error('Failed to open billing portal:', err)
      if (isAuthError(err)) {
        authAPI.logout()
        navigate('/login')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to open billing portal')
      }
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  const isPro = subscription?.tier && subscription.tier !== 'free'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-[#2c3e50] dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-[#7f8c8d] dark:text-gray-400 max-w-2xl mx-auto">
            Start free and upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-6 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Current Plan Banner (for logged-in Pro users) */}
        {isLoggedIn && isPro && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-10 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#f39c12] to-[#e67e22] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2c3e50] dark:text-white">
                    {subscription.tier_name || 'Pro'} Plan
                  </h3>
                  <p className="text-sm text-[#7f8c8d] dark:text-gray-400">
                    {subscription.auto_renewal_active === false
                      ? "Your subscription has been cancelled. You'll lose access to Pro features on "
                      : 'Your subscription renews automatically. Next billing date: '}
                    <span className="font-medium text-[#2c3e50] dark:text-white">
                      {subscription.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : subscription.expires_at
                          ? new Date(subscription.expires_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                    </span>
                  </p>
                  {subscription.creem_status && (
                    <p className="text-xs text-[#95a5a6] dark:text-gray-500 mt-1">
                      Status: {subscription.creem_status.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRefreshSubscription}
                  disabled={refreshing}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-[#2c3e50] dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleManageBilling}
                  disabled={refreshing}
                  className="px-4 py-2 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-[#2c3e50] dark:text-white mb-2">Free</h3>
            <div className="text-4xl font-bold text-[#2c3e50] dark:text-white mb-1">
              $0<span className="text-lg font-normal text-[#7f8c8d] dark:text-gray-400">/month</span>
            </div>
            <p className="text-[#7f8c8d] dark:text-gray-400 text-sm mb-6">Perfect for trying out</p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>20 calculations per month</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Basic calculators</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Fuel manager</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#95a5a6] dark:text-gray-500">
                <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>PDF export</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#95a5a6] dark:text-gray-500">
                <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Advanced calculators</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#95a5a6] dark:text-gray-500">
                <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Compliance reports</span>
              </li>
            </ul>

            {isLoggedIn && subscription?.tier === 'free' ? (
              <button
                disabled
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : isLoggedIn && isPro ? (
              <Link
                to="/account"
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-[#2c3e50] dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center block"
              >
                Manage Plan
              </Link>
            ) : (
              <Link
                to="/signup"
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-[#2c3e50] dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center block"
              >
                Get Started Free
              </Link>
            )}
          </div>

          {/* Pro Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border-2 border-[#f39c12] shadow-md relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#f39c12] text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-semibold text-[#2c3e50] dark:text-white mb-2">Pro</h3>
            <div className="text-4xl font-bold text-[#2c3e50] dark:text-white mb-1">
              $19<span className="text-lg font-normal text-[#7f8c8d] dark:text-gray-400">/month</span>
            </div>
            <p className="text-[#7f8c8d] dark:text-gray-400 text-sm mb-6">For professional engineers</p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Unlimited calculations</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>All basic + advanced tools</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>PDF report export</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>EPA & EU compliance reports</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Full fuel manager access</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#555] dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>

            {isLoggedIn && isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={refreshing}
                className="w-full py-3 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Manage Billing
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe('pro')}
                disabled={processing !== null}
                className={`w-full py-3 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md ${
                  processing === 'pro' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing === 'pro' ? 'Processing...' : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-semibold text-center text-[#2c3e50] dark:text-white mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-[#7f8c8d] dark:text-gray-400">
                Yes, you can cancel your subscription anytime from the billing portal. 
                Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-[#7f8c8d] dark:text-gray-400">
                We accept all major credit cards (Visa, Mastercard, American Express) 
                through our secure payment provider, Creem.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-sm text-[#7f8c8d] dark:text-gray-400">
                Yes, all payments are processed securely through Creem. 
                We never store your payment details on our servers.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-sm text-[#7f8c8d] dark:text-gray-400">
                We offer a 14-day money-back guarantee. If you're not satisfied with Pro, 
                contact us within 14 days for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA for free users */}
        {isLoggedIn && subscription?.tier === 'free' && (
          <div className="mt-16 bg-gradient-to-r from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              Ready to unlock Pro features?
            </h2>
            <p className="text-[#bdc3c7] dark:text-gray-300 mb-8 max-w-xl mx-auto">
              Upgrade to Pro today and get unlimited calculations, PDF export, 
              and advanced engineering tools.
            </p>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={processing !== null}
              className={`px-8 py-3 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-lg font-semibold transition-colors shadow-lg ${
                processing === 'pro' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {processing === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionPage
