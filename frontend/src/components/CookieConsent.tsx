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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d] border-t border-[#2a2a2a] shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-[#ff5722]/10 border border-[#ff5722]/30 flex items-center justify-center">
              <Cookie size={18} className="text-[#ff5722]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tight">
                Cookie Consent
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized ads or content,
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                {' '}
                <Link
                  to="/privacy-policy"
                  className="text-[#ff5722] hover:text-[#f4511e] underline underline-offset-2"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-xs font-bold text-gray-400 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#444] transition-all uppercase tracking-wide"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-xs font-bold text-gray-400 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#444] transition-all uppercase tracking-wide"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-black text-white bg-[#ff5722] hover:bg-[#f4511e] transition-all uppercase tracking-wider border-b-2 border-[#bf360c] active:border-b-0 active:mt-0.5"
            >
              Accept All
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-500">
              <div className="bg-[#111] border border-[#2a2a2a] p-4">
                <h4 className="font-black text-white mb-2 text-xs uppercase tracking-tight">Necessary</h4>
                <p className="leading-relaxed">Required for basic site functionality. Always active. Examples: login state, session management, security tokens.</p>
              </div>
              <div className="bg-[#111] border border-[#2a2a2a] p-4">
                <h4 className="font-black text-white mb-2 text-xs uppercase tracking-tight">Analytics</h4>
                <p className="leading-relaxed">Help us understand how visitors interact with our website. Used to improve the product experience.</p>
              </div>
              <div className="bg-[#111] border border-[#2a2a2a] p-4">
                <h4 className="font-black text-white mb-2 text-xs uppercase tracking-tight">Functional</h4>
                <p className="leading-relaxed">Enable enhanced functionality like personalization and remembering your preferences.</p>
              </div>
              <div className="bg-[#111] border border-[#2a2a2a] p-4">
                <h4 className="font-black text-white mb-2 text-xs uppercase tracking-tight">Marketing</h4>
                <p className="leading-relaxed">Used to track visitors across websites for targeted advertising campaigns.</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-gray-600">
              You can change your cookie preferences at any time by clearing your browser data.
              For more information, see our{' '}
              <Link to="/privacy-policy" className="text-[#ff5722] hover:text-[#f4511e] underline underline-offset-2">
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
