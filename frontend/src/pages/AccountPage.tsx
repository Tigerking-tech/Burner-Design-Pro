import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authAPI, subscriptionAPI, pricingAPI, PricingTier, Subscription, Order, ApiError } from "../services/api"
import PasswordInput from "../components/PasswordInput"
import { Navbar } from "../components/Navbar"
import { RefreshCw } from "lucide-react"

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

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(authAPI.getCurrentUserSync())
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [refreshingSubscription, setRefreshingSubscription] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Data export state
  const [exportingData, setExportingData] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login")
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [sub, orderList, tiers] = await Promise.all([
        subscriptionAPI.getSubscription(),
        subscriptionAPI.getOrders(),
        pricingAPI.getPricingTiers()
      ])
      setSubscription(sub)
      setOrders(orderList)
      setPricingTiers(tiers)
    } catch (err: any) {
      if (isAuthError(err)) {
        authAPI.logout()
        setError('Your session has expired. Please log in again.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err instanceof Error ? err.message : "Failed to load data")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshSubscription = async () => {
    setRefreshingSubscription(true)
    setError("")
    setSuccess("")
    
    try {
      const refreshResult = await subscriptionAPI.refreshSubscription()
      
      if (refreshResult.success) {
        await loadData()
        const currentUser = await authAPI.getCurrentUser()
        setUser(currentUser)
        setSuccess(refreshResult.message)
      } else {
        const currentSub = await subscriptionAPI.getSubscription()
        if (currentSub.tier === 'pro') {
          await loadData()
          const currentUser = await authAPI.getCurrentUser()
          setUser(currentUser)
          setSuccess('Subscription is active (Pro)')
        } else {
          setError(refreshResult.message)
        }
      }
    } catch (err: any) {
      if (isAuthError(err)) {
        authAPI.logout()
        setError('Your session has expired. Please log in again.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err instanceof Error ? err.message : "Failed to refresh subscription status")
      }
    } finally {
      setRefreshingSubscription(false)
    }
  }

  useEffect(() => {
    if (isLoading || refreshingSubscription) return
    
    const hasPendingOrder = orders.some(o => o.status === 'pending')
    if (hasPendingOrder) {
      const timer = setTimeout(() => {
        handleRefreshSubscription()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [orders, isLoading])

  const handleSubscribe = async (tierId: string) => {
    if (tierId === "free") return
    setProcessingPayment(true)
    setError("")
    setSuccess("")

    try {
      const checkout = await subscriptionAPI.createCheckout(tierId)
      if (checkout.success && checkout.checkout_url) {
        window.location.href = checkout.checkout_url
      } else {
        setError("Failed to create checkout session")
      }
    } catch (err: any) {
      if (isAuthError(err)) {
        authAPI.logout()
        setError('Your session has expired. Please log in again.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err instanceof Error ? err.message : "Payment failed")
      }
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel auto-renewal? Your Pro access will remain active until the end of your current billing period.")) return
    setError("")
    setSuccess("")

    try {
      const result = await subscriptionAPI.cancelSubscription()
      setSuccess(result.message)
      await loadData()
      const currentUser = await authAPI.getCurrentUser()
      setUser(currentUser)
    } catch (err: any) {
      if (isAuthError(err)) {
        authAPI.logout()
        setError('Your session has expired. Please log in again.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err instanceof Error ? err.message : "Failed to cancel")
      }
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }
    
    if (currentPassword === newPassword) {
      setError("New password must be different from current password")
      return
    }
    
    setChangingPassword(true)
    
    try {
      const result = await authAPI.changePassword(currentPassword, newPassword)
      setSuccess(result.message)
      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password change failed")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleExportData = async () => {
    setError("")
    setExportingData(true)
    try {
      const data = await authAPI.exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `burner-design-pro-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccess("Your data has been exported successfully.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data export failed")
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    setError("")
    if (!deletePassword) {
      setError("Please enter your password to confirm deletion")
      return
    }
    setDeletingAccount(true)
    try {
      await authAPI.deleteAccount(deletePassword)
      authAPI.logout()
      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account deletion failed")
      setDeletingAccount(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-[#2c3e50] dark:to-[#34495e] flex items-center justify-center">
        <div className="text-[#2c3e50] dark:text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-[#2c3e50] dark:to-[#34495e]">
      {/* Header */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-[#2c3e50] dark:text-white mb-8">My Account</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500 rounded text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500 rounded text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        <div className="grid gap-8">
          {/* User Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-[#2c3e50] dark:text-white mb-4">Profile</h2>
            <div className="space-y-2 text-[#555] dark:text-gray-300">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Current Plan:</strong> {subscription?.tier_name || "Free"}</p>
              {subscription?.tier && subscription.tier !== "free" && subscription.creem_status && 
                (subscription.creem_status.toLowerCase() === "active" || 
                 subscription.creem_status.toLowerCase() === "trialing") && (
                <p>
                  <strong>Next Billing Date:</strong>{" "}
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : subscription.expires_at
                      ? new Date(subscription.expires_at).toLocaleDateString()
                      : "-"}
                </p>
              )}
              {subscription?.tier && subscription.tier !== "free" && subscription.creem_status && 
                subscription.creem_status.toLowerCase() === "scheduled_cancel" && (
                <p>
                  <strong>Pro Access Until:</strong>{" "}
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : subscription.expires_at
                      ? new Date(subscription.expires_at).toLocaleDateString()
                      : "-"}
                </p>
              )}
              {subscription?.tier && subscription.tier !== "free" && !subscription.creem_status && subscription.expires_at && (
                <p><strong>Pro Access Until:</strong> {new Date(subscription.expires_at).toLocaleDateString()}</p>
              )}
              {subscription?.tier && subscription.tier !== "free" && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription.creem_status?.toLowerCase() === "scheduled_cancel"
                    ? "Your subscription has been cancelled. Pro features will remain active until the date above."
                    : "Your subscription renews automatically. Pro features will remain active as long as your subscription is active."}
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRefreshSubscription}
                disabled={refreshingSubscription}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {refreshingSubscription ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh Subscription
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-[#2c3e50] dark:text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                required
              />
              
              <div>
                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>
              
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                minLength={8}
              />
              
              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-[#2B6BA0] text-white rounded hover:bg-[#1e4d73] disabled:opacity-50 transition-colors"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* Data Export */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-[#2c3e50] dark:text-white mb-2">Export My Data</h2>
            <p className="text-sm text-[#555] dark:text-gray-400 mb-4">
              Download all your personal data in JSON format (GDPR right to data portability).
            </p>
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exportingData ? "Exporting..." : "Export My Data"}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-red-200 dark:border-red-900">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-[#555] dark:text-gray-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                    ⚠️ This action is irreversible!
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    All your data, including your subscription, order history, and personal information will be permanently deleted.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">
                    Enter your password to confirm:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {deletingAccount ? "Deleting..." : "Permanently Delete Account"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword("")
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-[#2c3e50] dark:text-white mb-6">Subscription</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-4 rounded-lg border ${
                    subscription?.tier === tier.id
                      ? "border-[#f39c12] bg-[#f39c12]/5"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-[#2c3e50] dark:text-white">{tier.name}</h3>
                  <p className="text-lg md:text-2xl font-bold text-[#2c3e50] dark:text-white my-2">
                    {tier.price_display}
                    <span className="text-sm font-normal text-[#7f8c8d] dark:text-gray-400">{tier.period}</span>
                  </p>
                  <ul className="text-sm text-[#555] dark:text-gray-300 mb-4 space-y-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  {subscription?.tier === tier.id ? (
                    <div className="text-center text-[#7f8c8d] dark:text-gray-400 text-sm py-2">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={processingPayment || tier.id === "free"}
                      className={`w-full py-2 rounded-md font-semibold text-sm transition-colors ${
                        tier.id === "free"
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-[#f39c12] hover:bg-[#e67e22] text-white disabled:opacity-50"
                      }`}
                    >
                      {processingPayment ? "Processing..." : "Upgrade"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {subscription && subscription.tier !== "free" && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    subscription.auto_renewal_active === false
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {subscription.auto_renewal_active === false ? "Auto-Renewal: OFF" : "Auto-Renewal: ON"}
                  </span>
                  {subscription.creem_status && (
                    <span className="text-xs text-gray-500">
                      ({subscription.creem_status.replace("_", " ").toUpperCase()})
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {subscription.auto_renewal_active === false
                    ? "Your subscription will not renew. Pro access remains active until the expiration date."
                    : "Cancelling will stop auto-renewal. Your Pro access remains active until the expiration date."}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {subscription.auto_renewal_active !== false && (
                    <button
                      onClick={handleCancelSubscription}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm underline"
                    >
                      Cancel Auto-Renewal
                    </button>
                  )}
                  {subscription.billing_portal_url && (
                    <a
                      href={subscription.billing_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm underline"
                    >
                      Manage in Creem Portal
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order History */}
          {orders.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#2c3e50] dark:text-white">Order History</h2>
                {subscription?.billing_portal_url && (
                  <a
                    href={subscription.billing_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#f39c12] hover:text-[#e67e22] font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    All Invoices
                  </a>
                )}
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-[#555] dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Plan</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 capitalize">{order.tier}</td>
                        <td className="px-4 py-2">${(order.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.status === "succeeded" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          }`}>
                            {order.status === "succeeded" ? "Paid" : order.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {order.status === "succeeded" && subscription?.billing_portal_url ? (
                            <a
                              href={subscription.billing_portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#f39c12] hover:text-[#e67e22] font-medium text-xs flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile: Cards */}
              <div className="md:hidden space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-lg font-semibold text-[#f39c12]">
                        ${(order.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="capitalize text-sm text-[#555] dark:text-gray-300">{order.tier}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        order.status === "succeeded" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      }`}>
                        {order.status === "succeeded" ? "Paid" : order.status}
                      </span>
                    </div>
                    {order.status === "succeeded" && subscription?.billing_portal_url && (
                      <a
                        href={subscription.billing_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#f39c12] hover:text-[#e67e22] font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Invoice
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
