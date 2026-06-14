import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { authAPI, subscriptionAPI, pricingAPI, PricingTier, Subscription, Order } from "../services/api"
import PasswordInput from "../components/PasswordInput"

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(authAPI.getCurrentUserSync())
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await authAPI.logout()
    navigate("/")
  }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return
    setError("")
    setSuccess("")

    try {
      const result = await subscriptionAPI.cancelSubscription()
      setSuccess(result.message)
      await loadData()
      const currentUser = await authAPI.getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel")
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors">
          <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
        </Link>
        <div className="flex gap-6 items-center">
          {user?.is_admin && (
            <Link to="/admin" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-[#bdc3c7] hover:text-white transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-white mb-8">My Account</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded text-green-300">
            {success}
          </div>
        )}

        <div className="grid gap-8">
          {/* User Info */}
          <div className="bg-white rounded-lg p-6 shadow-xl border border-gray-300">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Profile</h2>
            <div className="space-y-2 text-[#555]">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.full_name || "Not set"}</p>
              <p><strong>Current Plan:</strong> {subscription?.tier_name || "Free"}</p>
              {subscription?.expires_at && (
                <p><strong>Expires:</strong> {new Date(subscription.expires_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg p-6 shadow-xl border border-gray-300">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Change Password</h2>
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

          {/* Subscription Management */}
          <div className="bg-white rounded-lg p-6 shadow-xl border border-gray-300">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-6">Subscription</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-4 rounded-lg border ${
                    subscription?.tier === tier.id
                      ? "border-[#f39c12] bg-[#f39c12]/5"
                      : "border-gray-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-[#2c3e50]">{tier.name}</h3>
                  <p className="text-2xl font-bold text-[#2c3e50] my-2">
                    {tier.price_display}
                    <span className="text-sm font-normal text-[#7f8c8d]">{tier.period}</span>
                  </p>
                  <ul className="text-sm text-[#555] mb-4 space-y-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  {subscription?.tier === tier.id ? (
                    <div className="text-center text-[#7f8c8d] text-sm py-2">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={processingPayment || tier.id === "free"}
                      className={`w-full py-2 rounded-md font-semibold text-sm transition-colors ${
                        tier.id === "free"
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 text-sm underline"
              >
                Cancel Subscription
              </button>
            )}
          </div>

          {/* Order History */}
          {orders.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-xl border border-gray-300">
              <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Order History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-[#555]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Plan</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-100">
                        <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 capitalize">{order.tier}</td>
                        <td className="px-4 py-2">${(order.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-2 capitalize">{order.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-12 px-6 mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center gap-8 mb-5 flex-wrap">
            <Link to="/" className="text-sm hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="text-sm hover:text-white transition-colors">About</Link>
            <Link to="/privacy-policy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
            <a href="mailto:Support@burnerdesignpro.com" className="text-sm hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-center mb-4">
            <a href="mailto:Support@burnerdesignpro.com" className="text-[#f39c12] hover:text-white transition-colors text-sm font-medium">
              Support@burnerdesignpro.com
            </a>
          </div>
          <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
        </div>
      </footer>
    </div>
  )
}
