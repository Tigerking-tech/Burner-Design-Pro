class DeviceFingerprintService {
  private cachedFingerprint: string | null = null

  async getFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint
    }

    try {
      const nav = navigator as any
      const components = [
        navigator.userAgent,
        navigator.platform || '',
        navigator.language || '',
        nav.browserLanguage || '',
        `${screen.width}x${screen.height}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        navigator.hardwareConcurrency?.toString() || '',
        nav.deviceMemory?.toString() || '',
      ]

      const raw = components.join('|')
      const encoder = new TextEncoder()
      const data = encoder.encode(raw)
      const hash = await crypto.subtle.digest('SHA-256', data)
      
      const hex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      this.cachedFingerprint = hex
      return hex
    } catch {
      const fallback = `${navigator.userAgent}-${Date.now()}`
      this.cachedFingerprint = fallback
      return fallback
    }
  }

  reset() {
    this.cachedFingerprint = null
  }
}

export const deviceFingerprintService = new DeviceFingerprintService()