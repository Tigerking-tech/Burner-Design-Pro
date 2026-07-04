import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authAPI, adminAPI, User, Order, WithdrawalRequest } from "../services/api"
import PasswordInput from "../components/PasswordInput"
import { Navbar } from "../components/Navbar"

type AdminTab = "users" | "orders" | "revenue" | "withdrawals"

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>("users")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
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
      const [userList, orderList, withdrawalList, revenueData] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllOrders(),
        adminAPI.getWithdrawals(),
        adminAPI.getRevenue()
      ])
      setUsers(userList)
      setOrders(orderList)
      setWithdrawals(withdrawalList)
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

  const handleUpdateWithdrawal = async (withdrawalId: string, status: string) => {
    try {
      await adminAPI.updateWithdrawal(withdrawalId, status)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update withdrawal")
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
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#34495e]">
      {/* Header */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-white mb-8">Admin Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500 rounded text-blue-300">
          {error}
        </div>
      )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {[
            { id: "users" as AdminTab, label: "Users" },
            { id: "orders" as AdminTab, label: "Orders" },
            { id: "revenue" as AdminTab, label: "Revenue" },
            { id: "withdrawals" as AdminTab, label: "Withdrawals" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-[#f39c12] text-white"
                  : "bg-white/10 text-[#bdc3c7] hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6">
          {activeTab === "users" && (
            <div>
              <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">User Management</h2>
              
              {/* Password Change Form */}
              {selectedUserId && (
                <div className="mb-6 bg-white rounded-lg p-6 shadow-xl border border-gray-300">
                  <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">
                    Change Password for {users.find(u => u.id === selectedUserId)?.email}
                  </h3>

                  {passwordError && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-700">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded text-green-700">
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
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
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
                        className="px-4 py-2 bg-[#2B6BA0] text-white rounded hover:bg-[#1e4d73] disabled:opacity-50 transition-colors"
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
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-[#555]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Plan</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Expires At</th>
                      <th className="px-4 py-2 text-left">Creem Customer</th>
                      <th className="px-4 py-2 text-left">Creem Sub</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                    <tr key={user.id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2 capitalize">{user.subscription_tier}</td>
                      <td className="px-4 py-2">
                        <span className={user.is_active ? "text-green-600" : "text-red-600"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {user.subscription_expires_at
                          ? new Date(user.subscription_expires_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 font-mono">
                        {user.creem_customer_id
                          ? user.creem_customer_id.substring(0, 12) + "..."
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 font-mono">
                        {user.creem_subscription_id
                          ? user.creem_subscription_id.substring(0, 12) + "..."
                          : "-"}
                      </td>
                      <td className="px-4 py-2 flex flex-col sm:flex-row gap-2">
                        <select
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                          className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-sm hover:bg-gray-200 transition-colors"
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
                  <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-medium text-[#2c3e50] mb-3 break-all">{user.email}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-[#555] mb-3">
                      <div>
                        <span className="text-gray-400">Plan:</span>{" "}
                        <span className="capitalize">{user.subscription_tier}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>{" "}
                        <span className={user.is_active ? "text-green-600" : "text-red-600"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Expires:</span>{" "}
                        {user.subscription_expires_at
                          ? new Date(user.subscription_expires_at).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    {(user.creem_customer_id || user.creem_subscription_id) && (
                      <div className="text-xs text-gray-400 font-mono mb-3 space-y-1">
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
                        className="px-3 py-2 border border-gray-300 rounded text-sm w-full"
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
                        className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-sm hover:bg-gray-200 transition-colors w-full"
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
                <h2 className="text-xl font-semibold text-[#2c3e50]">Order Management</h2>
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
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
                >
                  Cleanup Duplicates
                </button>
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-[#555]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Plan</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-100">
                        <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{order.user_email}</td>
                        <td className="px-4 py-2 capitalize">{order.tier}</td>
                        <td className="px-4 py-2">${(order.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-2 capitalize">
                          <span
                            className={
                              order.status === "succeeded" ? "text-green-600" : "text-orange-600"
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
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div
                        className={`text-sm font-medium capitalize ${
                          order.status === "succeeded" ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                    <div className="font-medium text-[#2c3e50] break-all mb-2">
                      {order.user_email}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-[#555]">
                        <span className="text-gray-400">Plan:</span>{" "}
                        <span className="capitalize">{order.tier}</span>
                      </div>
                      <div className="text-lg font-semibold text-[#f39c12]">
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
              <h2 className="text-xl font-semibold text-[#2c3e50] mb-6">Revenue Overview</h2>
              {revenue && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-[#f39c12]">{revenue.total_revenue_display}</div>
                    <div className="text-sm text-[#7f8c8d]">Total Revenue</div>
                    <div className="text-xs text-gray-400 mt-1">From Creem</div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-[#2c3e50]">{revenue.creem_transaction_count || revenue.total_orders}</div>
                    <div className="text-sm text-[#7f8c8d]">Transactions</div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-green-600">{revenue.active_subscriptions || revenue.successful_orders || 0}</div>
                    <div className="text-sm text-[#7f8c8d]">Active Subscriptions</div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-[#555]">{users.length}</div>
                    <div className="text-sm text-[#7f8c8d]">Total Users</div>
                  </div>
                </div>
              )}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Revenue data is pulled from Creem. To request withdrawal, please log in to your Creem dashboard directly.
                </p>
              </div>
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div>
              <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Withdrawal Management</h2>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-[#555]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Admin</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-t border-gray-100">
                        <td className="px-4 py-2">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{withdrawal.admin_email}</td>
                        <td className="px-4 py-2">${(withdrawal.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-2 capitalize">{withdrawal.status}</td>
                        <td className="px-4 py-2">
                          <select
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            value={withdrawal.status}
                            onChange={(e) => handleUpdateWithdrawal(withdrawal.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-400">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-lg font-semibold text-[#f39c12]">
                        ${(withdrawal.amount / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-medium text-[#2c3e50] break-all mb-3">
                      {withdrawal.admin_email}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#555] capitalize">{withdrawal.status}</span>
                      <select
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        value={withdrawal.status}
                        onChange={(e) => handleUpdateWithdrawal(withdrawal.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
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
