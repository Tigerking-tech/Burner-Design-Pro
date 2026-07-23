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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </div>
    )
  }

  const isPro = subscription?.tier && subscription.tier !== 'free'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
              Pricing
            </span>
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Start free and upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isLoggedIn && isPro && (
          <div className="bg-white dark:bg-white/5 rounded-2xl p-6 mb-10 border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {subscription.tier_name || 'Pro'} Plan
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {subscription.auto_renewal_active === false
                      ? "Your subscription has been cancelled. You'll lose access to Pro features on "
                      : 'Your subscription renews automatically. Next billing date: '}
                    <span className="font-medium text-slate-900 dark:text-white">
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
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Status: {subscription.creem_status.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRefreshSubscription}
                  disabled={refreshing}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50 border border-slate-200 dark:border-white/10"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleManageBilling}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:shadow-blue-500/5 transition-shadow">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Free</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Perfect for trying out</p>
            <div className="flex items-baseline mb-6">
              <span className="text-5xl font-bold text-slate-900 dark:text-white">$0</span>
              <span className="text-sm ml-2 text-slate-500 dark:text-slate-400">/month</span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 mb-6" />

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-slate-700 dark:text-slate-300">20 calculations per month</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-slate-700 dark:text-slate-300">Basic calculators</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-slate-700 dark:text-slate-300">Fuel manager</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400">
                  <X size={12} strokeWidth={3} />
                </span>
                <span className="text-slate-400">PDF export</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400">
                  <X size={12} strokeWidth={3} />
                </span>
                <span className="text-slate-400">Advanced calculators</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400">
                  <X size={12} strokeWidth={3} />
                </span>
                <span className="text-slate-400">Compliance reports</span>
              </li>
            </ul>

            {isLoggedIn && subscription?.tier === 'free' ? (
              <button
                disabled
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl font-medium cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : isLoggedIn && isPro ? (
              <Link
                to="/account"
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-center block"
              >
                Manage Plan
              </Link>
            ) : (
              <Link
                to="/signup"
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-center block"
              >
                Get Started Free
              </Link>
            )}
          </div>

          <div className="relative rounded-2xl p-8 border-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 shadow-2xl shadow-blue-500/25">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-sm text-blue-100 mb-6">For professional engineers</p>
            <div className="flex items-baseline mb-6">
              <span className="text-5xl font-bold">$19</span>
              <span className="text-sm ml-2 text-blue-200">/month</span>
            </div>
            <div className="h-px bg-blue-400/30 mb-6" />

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Unlimited calculations</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>All basic + advanced tools</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>PDF report export</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>EPA & EU compliance reports</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Full fuel manager access</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20 text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Priority support</span>
              </li>
            </ul>

            {isLoggedIn && isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={refreshing}
                className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                className={`w-full py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 ${
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

        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
                FAQ
              </span>
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Yes, you can cancel your subscription anytime from the billing portal. 
                Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We accept all major credit cards (Visa, Mastercard, American Express) 
                through our secure payment provider, Creem.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Yes, all payments are processed securely through Creem. 
                We never store your payment details on our servers.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We offer a 14-day money-back guarantee. If you're not satisfied with Pro, 
                contact us within 14 days for a full refund.
              </p>
            </div>
          </div>
        </div>

        {isLoggedIn && subscription?.tier === 'free' && (
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-800 dark:to-blue-900 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to unlock Pro features?
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Upgrade to Pro today and get unlimited calculations, PDF export, 
              and advanced engineering tools.
            </p>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={processing !== null}
              className={`px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold transition-colors shadow-xl hover:bg-blue-50 ${
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
