import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

const COOKIE_CONSENT_KEY = 'bdp_cookie_consent'

type ConsentLevel = 'none' | 'necessary' | 'all'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  useEffect(() => {
    if (showBanner) {
      document.body.style.paddingBottom = showDetails ? '280px' : '100px'
    } else {
      document.body.style.paddingBottom = '0'
    }
    return () => {
      document.body.style.paddingBottom = '0'
    }
  }, [showBanner, showDetails])

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all')
    setShowBanner(false)
  }

  const acceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'necessary')
    setShowBanner(false)
  }

  const getConsentLevel = (): ConsentLevel => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    return (consent as ConsentLevel) || 'none'
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a252f] dark:bg-gray-900 border-t-2 border-[#f39c12]/30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#f39c12]/10 rounded-sm flex items-center justify-center">
              <Cookie size={20} className="text-[#f39c12]" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-white mb-1 uppercase tracking-wide">
                Cookie Consent
              </h3>
              <p className="text-xs text-[#8b9bad] leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized ads or content,
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                {' '}
                <Link
                  to="/privacy-policy"
                  className="text-[#f39c12] hover:text-[#e67e22] underline underline-offset-2"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 font-mono-tech text-[11px] font-medium text-[#8b9bad] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#f39c12]/30 rounded-sm transition-all tracking-wide uppercase"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 font-mono-tech text-[11px] font-medium text-[#8b9bad] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#f39c12]/30 rounded-sm transition-all tracking-wide uppercase"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 font-display text-sm font-semibold text-[#1a252f] bg-[#f39c12] hover:bg-[#e67e22] rounded-sm transition-all tracking-wide uppercase shadow-[0_2px_10px_rgba(243,156,18,0.25)]"
            >
              Accept All
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-[#8b9bad]">
              <div className="bg-white/5 rounded-sm p-4 border border-white/5">
                <h4 className="font-display font-semibold text-white mb-2 uppercase tracking-wide text-xs">Necessary</h4>
                <p className="leading-relaxed">Required for basic site functionality. Always active. Examples: login state, session management, security tokens.</p>
              </div>
              <div className="bg-white/5 rounded-sm p-4 border border-white/5">
                <h4 className="font-display font-semibold text-white mb-2 uppercase tracking-wide text-xs">Analytics</h4>
                <p className="leading-relaxed">Help us understand how visitors interact with our website. Used to improve the product experience.</p>
              </div>
              <div className="bg-white/5 rounded-sm p-4 border border-white/5">
                <h4 className="font-display font-semibold text-white mb-2 uppercase tracking-wide text-xs">Functional</h4>
                <p className="leading-relaxed">Enable enhanced functionality like personalization and remembering your preferences.</p>
              </div>
              <div className="bg-white/5 rounded-sm p-4 border border-white/5">
                <h4 className="font-display font-semibold text-white mb-2 uppercase tracking-wide text-xs">Marketing</h4>
                <p className="leading-relaxed">Used to track visitors across websites for targeted advertising campaigns.</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-[#5d7385] font-mono-tech">
              You can change your cookie preferences at any time by clearing your browser data.
              For more information, see our{' '}
              <Link to="/privacy-policy" className="text-[#f39c12] hover:text-[#e67e22] underline underline-offset-2">
                Privacy Policy
              </Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function getCookieConsent(): ConsentLevel {
  if (typeof window === 'undefined') return 'none'
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return (consent as ConsentLevel) || 'none'
}
