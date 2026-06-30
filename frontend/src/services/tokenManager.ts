const ACCESS_TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

// Calculator states use this prefix so they can be batch-cleared on logout
const CALCULATOR_STATE_PREFIX = 'calculator-state-'

interface UserInfo {
  id: string
  email: string
  full_name?: string
  is_active: boolean
  is_admin: boolean
  subscription_tier: 'free' | 'pro'
  subscription_expires_at?: string
  created_at: string
  updated_at: string
}

interface TokenPair {
  accessToken: string
  refreshToken: string
  user: UserInfo
}

function parseJwt(token: string): { exp: number; sub: string } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function migrateOldTokens() {
  const oldToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  const oldUser = localStorage.getItem(USER_KEY)
  const hasRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

  if (oldToken && !hasRefreshToken) {
    console.info('[tokenManager] Migrating legacy auth data (no refresh token)')
  }
}

migrateOldTokens()

export const tokenManager = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  getUser(): UserInfo | null {
    try {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  setTokens(data: TokenPair) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  },

  updateAccessToken(accessToken: string, user?: UserInfo) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // Clear calculator states on logout to protect user privacy
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CALCULATOR_STATE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },

  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    if (!token) return false

    const payload = parseJwt(token)
    if (!payload) return false

    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  },

  isAccessTokenExpiringSoon(thresholdSeconds: number = 60): boolean {
    const token = this.getAccessToken()
    if (!token) return true

    const payload = parseJwt(token)
    if (!payload) return true

    const now = Math.floor(Date.now() / 1000)
    return payload.exp - now < thresholdSeconds
  },

  isAdmin(): boolean {
    const user = this.getUser()
    return !!user?.is_admin
  },

  getSubscriptionTier(): 'free' | 'pro' {
    const user = this.getUser()
    return user?.subscription_tier || 'free'
  },
}
