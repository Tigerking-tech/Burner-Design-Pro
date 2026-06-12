const API_BASE_URL = (import.meta as any).env?.VITE_API_URL 
  ? `${(import.meta as any).env.VITE_API_URL}/api` 
  : '/api'

export async function getHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) {
      throw new Error('Health check failed')
    }
    return response.json()
  } catch (error) {
    console.error('getHealth error:', error)
    throw error
  }
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
  const response = await fetch(`${API_BASE_URL}/fuels`)
  if (!response.ok) {
    throw new Error('Failed to fetch fuels')
  }
  return response.json()
}

export async function getFuel(fuelId: string): Promise<FuelDetail> {
  const response = await fetch(`${API_BASE_URL}/fuels/${fuelId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch fuel')
  }
  return response.json()
}

export async function calculateCombustion(params: CombustionParams): Promise<CombustionResult> {
  const response = await fetch(`${API_BASE_URL}/calculate/combustion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error('Failed to calculate combustion')
  }
  return response.json()
}

export interface GasComposition {
  H2?: number
  CO?: number
  CH4?: number
  C2H6?: number
  C3H8?: number
  C4H10?: number
  C5H12?: number
  C6H14?: number
  C7H16?: number
  C2H4?: number
  C3H6?: number
  C2H2?: number
  N2?: number
  CO2?: number
  O2?: number
}

export interface CapacityParams {
  excess_air_ratio?: number
  burner_capacity?: number
  gas_flow_rate?: number
  air_flow_rate?: number
}

export interface CustomGasInput {
  gas_composition: GasComposition
  capacity_params: CapacityParams
  excess_air_ratio?: number
  desired_o2_in_flue_gas?: number
}

export interface CustomGasResult {
  density: number
  relative_density: number
  lower_heating_value: number
  minimum_air_requirement: number
  burner_capacity: number
  gas_flow_rate: number
  air_fuel_ratio: number
  air_flow_rate: number
  flue_gas_o2: number
  flue_gas_co2: number
  flue_gas_n2: number
  dry_flue_gas_volume: number
  h2o_in_flue_gas: number
  wet_flue_gas_volume: number
  density_of_wet_flue_gas: number
}

export async function calculateCustomGas(params: CustomGasInput): Promise<CustomGasResult> {
  console.log('Calling API with:', params)
  try {
    const response = await fetch(`${API_BASE_URL}/calculate/custom-gas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    console.log('Response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      throw new Error(`Failed to calculate custom gas: ${errorText}`)
    }
    const result = await response.json()
    console.log('API returned:', result)
    return result
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

// Auth and Subscription API
export interface User {
  id: string
  email: string
  full_name?: string
  is_active: boolean
  is_admin: boolean
  subscription_tier: 'free' | 'pro' | 'team'
  subscription_expires_at?: string
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface PricingTier {
  id: 'free' | 'pro' | 'team'
  name: string
  price: number
  price_display: string
  period: string
  features: string[]
  max_calculations?: number
  has_pdf_export: boolean
  has_pro_calculators: boolean
  has_team_features: boolean
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

function getToken(): string | null {
  return localStorage.getItem('token')
}

function getHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (includeAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  return headers
}

export const authAPI = {
  async register(email: string, password: string, fullName?: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || 'Registration failed')
    }
    const data = await response.json()
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
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
      throw new Error(data.detail || 'Login failed')
    }
    const data = await response.json()
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || 'Password change failed')
    }
    return response.json()
  },

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get user')
    }
    const user = await response.json()
    localStorage.setItem('user', JSON.stringify(user))
    return user
  },

  getCurrentUserSync(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  async getPricing(): Promise<{ success: boolean; tiers: PricingTier[] }> {
    const response = await fetch(`${API_BASE_URL}/auth/pricing`, {
      headers: getHeaders(false),
    })
    if (!response.ok) {
      throw new Error('Failed to get pricing')
    }
    return response.json()
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  isAdmin(): boolean {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return !!user.is_admin
    } catch {
      return false
    }
  },

  hasProAccess(): boolean {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.subscription_tier === 'pro' || user.subscription_tier === 'team'
    } catch {
      return false
    }
  },

  getSubscriptionTier(): 'free' | 'pro' | 'team' {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.subscription_tier || 'free'
    } catch {
      return 'free'
    }
  },

  getUser(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },
}

export const pricingAPI = {
  async getPricingTiers(): Promise<PricingTier[]> {
    const response = await fetch(`${API_BASE_URL}/auth/pricing`, {
      headers: getHeaders(false),
    })
    if (!response.ok) {
      throw new Error('Failed to get pricing tiers')
    }
    const data = await response.json()
    return data.tiers
  },
}

export interface Product {
  tier: string
  name: string
  price: number
  price_display: string
  features: string[]
  paddle_price_id?: string
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
    const response = await fetch(`${API_BASE_URL}/subscription`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get subscription')
    }
    const data = await response.json()
    // Ensure tier_name is available
    const tierNames: Record<string, string> = {
      free: 'Free',
      pro: 'Pro',
      team: 'Team',
    }
    return {
      ...data.subscription,
      tier_name: tierNames[data.subscription.tier] || data.subscription.tier,
    }
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to cancel subscription')
    }
    return response.json()
  },

  async getProducts(): Promise<{ success: boolean; products: Product[] }> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get products')
    }
    return response.json()
  },

  async createCheckout(tier: string): Promise<CheckoutSession> {
    const response = await fetch(`${API_BASE_URL}/payment/create-checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tier }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({ detail: 'Failed to create checkout' }))
      throw new Error(data.detail || 'Failed to create checkout')
    }
    return response.json()
  },

  async confirmPayment(orderId: string): Promise<PaymentResult> {
    const response = await fetch(`${API_BASE_URL}/payment/confirm/${orderId}`, {
      method: 'POST',
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to confirm payment')
    }
    return response.json()
  },

  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get orders')
    }
    return response.json()
  },
}

export const adminAPI = {
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get users')
    }
    return response.json()
  },

  async changeUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_password: newPassword }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || 'Failed to change user password')
    }
    return response.json()
  },

  async updateUserSubscription(userId: string, tier: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/subscription`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ tier }),
    })
    if (!response.ok) {
      throw new Error('Failed to update user subscription')
    }
    return response.json()
  },

  async getRevenue(): Promise<RevenueStats> {
    const response = await fetch(`${API_BASE_URL}/admin/revenue`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get revenue')
    }
    return response.json()
  },

  async getAllOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get orders')
    }
    return response.json()
  },

  async getWithdrawals(): Promise<WithdrawalRequest[]> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get withdrawals')
    }
    return response.json()
  },

  async createWithdrawal(amount: number, paymentMethod: string, notes?: string): Promise<WithdrawalRequest> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, payment_method: paymentMethod, notes }),
    })
    if (!response.ok) {
      throw new Error('Failed to create withdrawal')
    }
    return response.json()
  },

  async updateWithdrawalStatus(withdrawalId: string, status: string): Promise<WithdrawalRequest> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${withdrawalId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      throw new Error('Failed to update withdrawal status')
    }
    return response.json()
  },
  
  async updateWithdrawal(withdrawalId: string, status: string): Promise<WithdrawalRequest> {
    return this.updateWithdrawalStatus(withdrawalId, status)
  },
}
