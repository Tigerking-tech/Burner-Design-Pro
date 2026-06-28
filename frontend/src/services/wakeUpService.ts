const API_BASE_URL = (import.meta as any).env?.VITE_API_URL 
  ? `${(import.meta as any).env.VITE_API_URL}`
  : ''

const HEALTH_ENDPOINT = '/health'

class WakeUpService {
  private isAwake: boolean = false
  private wakeUpPromise: Promise<void> | null = null

  async wakeUp(): Promise<void> {
    if (this.isAwake) return

    if (this.wakeUpPromise) {
      return this.wakeUpPromise
    }

    this.wakeUpPromise = this._doWakeUp()
    try {
      await this.wakeUpPromise
      this.isAwake = true
    } finally {
      this.wakeUpPromise = null
    }
  }

  private async _doWakeUp(): Promise<void> {
    const maxAttempts = 3
    let lastError: Error | null = null

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${API_BASE_URL}${HEALTH_ENDPOINT}`, {
          method: 'GET',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          return
        }
      } catch (error) {
        lastError = error as Error
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
        }
      }
    }

    console.warn('[WakeUp] Failed to wake up backend after max attempts', lastError)
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}${HEALTH_ENDPOINT}`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  }

  reset() {
    this.isAwake = false
    this.wakeUpPromise = null
  }
}

export const wakeUpService = new WakeUpService()
