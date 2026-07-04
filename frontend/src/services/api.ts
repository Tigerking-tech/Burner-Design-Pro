import { tokenManager } from './tokenManager'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL 
  ? `${(import.meta as any).env.VITE_API_URL}/api` 
  : '/api'

let isRefreshing = false
let refreshQueue: Array<() => void> = []

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken()
  if (!refreshToken) {
    return false
  }

  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(() => resolve(true))
    })
  }

  isRefreshing = true

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      tokenManager.clearTokens()
      return false
    }

    const data = await response.json()
    tokenManager.setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    })

    refreshQueue.forEach(callback => callback())
    refreshQueue = []

    return true
  } catch (error) {
    console.error('[api] Token refresh failed:', error)
    tokenManager.clearTokens()
    refreshQueue.forEach(callback => callback())
    refreshQueue = []
    return false
  } finally {
    isRefreshing = false
  }
}

interface RequestOptions {
  method?: string
  headers?: HeadersInit
  body?: BodyInit | null
  includeAuth?: boolean
}

class ApiError extends Error {
  status: number
  detail?: string

  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.status = status
    this.detail = detail
    this.name = 'ApiError'
  }
}

async function request(
  url: string,
  options: RequestOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    headers: customHeaders = {},
    body = null,
    includeAuth = true,
  } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  if (includeAuth) {
    const token = tokenManager.getAccessToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

  const response = await fetch(fullUrl, {
    method,
    headers,
    body,
  })

  if (response.ok) {
    return response.json()
  }

  if (response.status === 401 && includeAuth) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const newToken = tokenManager.getAccessToken()
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`
      }
      const retryResponse = await fetch(fullUrl, {
        method,
        headers,
        body,
      })
      if (retryResponse.ok) {
        return retryResponse.json()
      }
      if (retryResponse.status === 401) {
        tokenManager.clearTokens()
        const data = await retryResponse.json().catch(() => ({}))
        throw new ApiError(data.detail || 'Session expired', 401, data.detail)
      }
      const data = await retryResponse.json().catch(() => ({}))
      throw new ApiError(
        data.detail || `Request failed with status ${retryResponse.status}`,
        retryResponse.status,
        data.detail
      )
    } else {
      tokenManager.clearTokens()
      const data = await response.json().catch(() => ({}))
      throw new ApiError(data.detail || 'Session expired', 401, data.detail)
    }
  }

  const data = await response.json().catch(() => ({}))
  throw new ApiError(
    data.detail || `Request failed with status ${response.status}`,
    response.status,
    data.detail
  )
}

export async function getHealth() {
  return request('/health', { includeAuth: false })
}

export interface Fuel {
  id: string
  name: string
  category: string
  LHV: number
  HHV: number
}

export interface FuelDetail extends Fuel {
  composition: {
    C: number
    H: number
    O: number
    N: number
    S: number
  }
  CO2_max: number
  siegert_f1: number
  siegert_f2: number
}

export interface CombustionParams {
  fuel_id: string
  excess_air_ratio: number
  air_temperature: number
  air_humidity: number
}

export interface FlueGasComposition {
  CO2: number
  O2: number
  N2: number
  H2O: number
}

export interface CombustionResult {
  fuel: {
    name: string
    LHV: number
    HHV: number
    composition: {
      C: number
      H: number
      O: number
      N: number
      S: number
    }
  }
  theoretical_afr: number
  actual_afr: number
  excess_air_ratio: number
  flue_gas_composition: FlueGasComposition
  adiabatic_flame_temp: number
}

export async function getFuels(): Promise<Fuel[]> {
  return request('/fuels', { includeAuth: false })
}

export async function getFuel(fuelId: string): Promise<FuelDetail> {
  return request(`/fuels/${fuelId}`, { includeAuth: false })
}

export async function calculateCombustion(params: CombustionParams): Promise<CombustionResult> {
  return request('/calculate/combustion', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export interface User {
  id: string
  email: string
  full_name?: string
  is_active: boolean
  is_admin: boolean
  subscription_tier: 'free' | 'pro'
  subscription_expires_at?: string
  creem_customer_id?: string
  creem_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface PricingTier {
  id: 'free' | 'pro'
  name: string
  price: number
  price_display: string
  period: string
  features: string[]
  max_calculations?: number
  has_pdf_export: boolean
  has_pro_calculators: boolean
}

export interface Subscription {
  tier: string
  tier_name?: string
  expires_at?: string
  is_active: boolean
}

export interface PaymentIntent {
  client_secret?: string
  order_id: string
}

export interface PaymentResult {
  success: boolean
  message: string
}

export interface Order {
  id: string
  user_id: string
  user_email: string
  tier: string
  amount: number
  status: string
  created_at: string
  updated_at: string
}

export interface WithdrawalRequest {
  id: string
  admin_id: string
  admin_email: string
  amount: number
  status: string
  payment_method: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface RevenueStats {
  total_revenue: number
  total_orders: number
  active_subscriptions: number
}

export interface RegisterResponse {
  success: boolean
  message: string
  email: string
  requires_verification: boolean
}

export const authAPI = {
  async register(email: string, password: string, fullName?: string): Promise<RegisterResponse> {
    return request('/auth/register', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
  },

  async verifyEmail(email: string, code: string): Promise<LoginResponse> {
    const data = await request('/auth/verify-email', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, code }),
    })
    tokenManager.setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    })
    return data
  },

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    return request('/auth/resend-verification', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email }),
    })
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new ApiError(data.detail || 'Login failed', response.status, data.detail)
    }

    const data = await response.json()
    tokenManager.setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    })
    return data
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' })
    } catch (e) {
      console.warn('[authAPI] Logout API call failed, clearing local tokens anyway')
    }
    tokenManager.clearTokens()
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
  },

  async getCurrentUser(): Promise<User> {
    const user = await request('/auth/me')
    const currentUser = tokenManager.getUser()
    if (currentUser) {
      tokenManager.setTokens({
        accessToken: tokenManager.getAccessToken() || '',
        refreshToken: tokenManager.getRefreshToken() || '',
        user,
      })
    }
    return user
  },

  getCurrentUserSync(): User | null {
    return tokenManager.getUser()
  },

  async getPricing(): Promise<{ success: boolean; tiers: PricingTier[] }> {
    return request('/auth/pricing', { includeAuth: false })
  },

  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated()
  },

  isAdmin(): boolean {
    return tokenManager.isAdmin()
  },

  hasProAccess(): boolean {
    return tokenManager.getSubscriptionTier() === 'pro'
  },

  getSubscriptionTier(): 'free' | 'pro' {
    return tokenManager.getSubscriptionTier()
  },

  getUser(): User | null {
    return tokenManager.getUser()
  },
}

export const pricingAPI = {
  async getPricingTiers(): Promise<PricingTier[]> {
    const data = await request('/auth/pricing', { includeAuth: false })
    return data.tiers
  },
}

export interface Product {
  tier: string
  name: string
  price: number
  price_display: string
  features: string[]
  creem_product_id?: string
  is_configured: boolean
}

export interface CheckoutSession {
  success: boolean
  checkout_url: string
  checkout_id: string
  order_id: string
}

export const subscriptionAPI = {
  async getSubscription(): Promise<Subscription> {
    const data = await request('/subscription')
    const tierNames: Record<string, string> = {
      free: 'Free',
      pro: 'Pro',
    }
    return {
      ...data.subscription,
      tier_name: tierNames[data.subscription.tier] || data.subscription.tier,
    }
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    return request('/subscription/cancel', { method: 'POST' })
  },

  async refreshSubscription(): Promise<{ success: boolean; message: string; tier?: string }> {
    return request('/subscription/refresh', { method: 'POST' })
  },

  async getProducts(): Promise<{ success: boolean; products: Product[] }> {
    return request('/products')
  },

  async createCheckout(tier: string): Promise<CheckoutSession> {
    return request('/payment/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    })
  },

  async confirmPayment(orderId: string): Promise<PaymentResult> {
    return request(`/payment/confirm/${orderId}`, { method: 'POST' })
  },

  async getOrders(): Promise<Order[]> {
    return request('/orders')
  },
}

export const adminAPI = {
  async getAllUsers(): Promise<User[]> {
    return request('/admin/users')
  },

  async changeUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request(`/auth/admin/users/${userId}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    })
  },

  async updateUserSubscription(userId: string, tier: string): Promise<User> {
    return request(`/admin/users/${userId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    })
  },

  async getRevenue(): Promise<RevenueStats> {
    return request('/admin/revenue')
  },

  async getAllOrders(): Promise<Order[]> {
    return request('/admin/orders')
  },

  async getWithdrawals(): Promise<WithdrawalRequest[]> {
    return request('/admin/withdrawals')
  },

  async createWithdrawal(amount: number, paymentMethod: string, notes?: string): Promise<WithdrawalRequest> {
    return request('/admin/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod, notes }),
    })
  },

  async updateWithdrawalStatus(withdrawalId: string, status: string): Promise<WithdrawalRequest> {
    return request(`/admin/withdrawals/${withdrawalId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  
  async updateWithdrawal(withdrawalId: string, status: string): Promise<WithdrawalRequest> {
    return this.updateWithdrawalStatus(withdrawalId, status)
  },
}

export { ApiError }
