import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authAPI, adminAPI, User, Order } from "../services/api"
import PasswordInput from "../components/PasswordInput"
import { Navbar } from "../components/Navbar"

type AdminTab = "users" | "orders" | "revenue"

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>("users")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [revenue, setRevenue] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  
  // Password change form state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newUserPassword, setNewUserPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [changingUserPassword, setChangingUserPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  useEffect(() => {
    if (!authAPI.isAuthenticated() || !authAPI.isAdmin()) {
      navigate("/")
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userList, orderList, revenueData] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllOrders(),
        adminAPI.getRevenue()
      ])
      setUsers(userList)
      setOrders(orderList)
      setRevenue(revenueData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUserSubscription = async (userId: string, tier?: string) => {
    try {
      await adminAPI.updateUserSubscription(userId, tier || '')
      await loadData()
    } catch (err) {
      setError("User updated")
    }
  }

  const handleChangeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    
    setPasswordError("")
    setPasswordSuccess("")
    
    // Validation
    if (newUserPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters")
      return
    }
    
    if (newUserPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    
    setChangingUserPassword(true)
    
    try {
      const result = await adminAPI.changeUserPassword(selectedUserId, newUserPassword)
      setPasswordSuccess(result.message)
      // Reset form
      setSelectedUserId(null)
      setNewUserPassword("")
      setConfirmNewPassword("")
      await loadData()
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setChangingUserPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Admin Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl text-blue-700 dark:text-blue-300">
          {error}
        </div>
      )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {[
            { id: "users" as AdminTab, label: "Users" },
            { id: "orders" as AdminTab, label: "Orders" },
            { id: "revenue" as AdminTab, label: "Revenue" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6">
          {activeTab === "users" && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">User Management</h2>
              
              {/* Password Change Form */}
              {selectedUserId && (
                <div className="mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Change Password for {users.find(u => u.id === selectedUserId)?.email}
                  </h3>

                  {passwordError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl text-red-700 dark:text-red-300">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-2xl text-green-700 dark:text-green-300">
                      {passwordSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangeUserPassword} className="space-y-4">
                    <div>
                      <PasswordInput
                        label="New Password"
                        value={newUserPassword}
                        onChange={setNewUserPassword}
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Must be at least 8 characters</p>
                    </div>
                    
                    <PasswordInput
                      label="Confirm New Password"
                      value={confirmNewPassword}
                      onChange={setConfirmNewPassword}
                      required
                      minLength={8}
                    />
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={changingUserPassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        {changingUserPassword ? "Changing..." : "Change Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserId(null)
                          setNewUserPassword("")
                          setConfirmNewPassword("")
                          setPasswordError("")
                          setPasswordSuccess("")
                        }}
                        className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-white/20 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Plan</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Expires At</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Creem Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Creem Sub</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3 capitalize">{user.subscription_tier}</td>
                      <td className="px-4 py-3">
                        <span className={user.is_active ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.subscription_expires_at
                          ? new Date(user.subscription_expires_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {user.creem_customer_id
                          ? user.creem_customer_id.substring(0, 12) + "..."
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {user.creem_subscription_id
                          ? user.creem_subscription_id.substring(0, 12) + "..."
                          : "-"}
                      </td>
                      <td className="px-4 py-3 flex flex-col sm:flex-row gap-2">
                        <select
                          className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={user.subscription_tier}
                          onChange={(e) => handleUpdateUserSubscription(user.id, e.target.value)}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                        </select>
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setNewUserPassword("")
                            setConfirmNewPassword("")
                          }}
                          className="px-3 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-medium"
                        >
                          Change Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                    <div className="font-medium text-slate-900 dark:text-white mb-3 break-all">{user.email}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Plan:</span>{" "}
                        <span className="capitalize">{user.subscription_tier}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Status:</span>{" "}
                        <span className={user.is_active ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Expires:</span>{" "}
                        {user.subscription_expires_at
                          ? new Date(user.subscription_expires_at).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    {(user.creem_customer_id || user.creem_subscription_id) && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-3 space-y-1">
                        {user.creem_customer_id && (
                          <div>Cust: {user.creem_customer_id.substring(0, 12)}...</div>
                        )}
                        {user.creem_subscription_id && (
                          <div>Sub: {user.creem_subscription_id.substring(0, 12)}...</div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <select
                        className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm w-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        value={user.subscription_tier}
                        onChange={(e) => handleUpdateUserSubscription(user.id, e.target.value)}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                      </select>
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setNewUserPassword("")
                          setConfirmNewPassword("")
                        }}
                        className="px-3 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-medium w-full"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Order Management</h2>
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure you want to clean up duplicate succeeded orders? This will keep only one succeeded order per user per day.")) return
                    try {
                      const result = await adminAPI.cleanupDuplicateOrders()
                      setError(result.message)
                      await loadData()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to cleanup")
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  Cleanup Duplicates
                </button>
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">User</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Plan</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-slate-100 dark:border-white/5">
                        <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{order.user_email}</td>
                        <td className="px-4 py-3 capitalize">{order.tier}</td>
                        <td className="px-4 py-3">${(order.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-3 capitalize">
                          <span
                            className={
                              order.status === "succeeded" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                            }
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div
                        className={`text-sm font-medium capitalize ${
                          order.status === "succeeded" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white break-all mb-2">
                      {order.user_email}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500">Plan:</span>{" "}
                        <span className="capitalize">{order.tier}</span>
                      </div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        ${(order.amount / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Revenue Overview</h2>
              {revenue && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{revenue.total_revenue_display}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Revenue</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">From Creem</div>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{revenue.creem_transaction_count || revenue.total_orders}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Transactions</div>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{revenue.active_subscriptions || revenue.successful_orders || 0}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active Subscriptions</div>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{users.length}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Users</div>
                  </div>
                </div>
              )}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/30">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Revenue data is pulled from Creem. To request withdrawal, please log in to your Creem dashboard directly.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
