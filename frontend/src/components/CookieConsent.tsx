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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Cookie size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Cookie Consent
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized ads or content,
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                {' '}
                <Link
                  to="/privacy-policy"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl transition-all"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl transition-all"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Accept All
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs">Necessary</h4>
                <p className="leading-relaxed">Required for basic site functionality. Always active. Examples: login state, session management, security tokens.</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs">Analytics</h4>
                <p className="leading-relaxed">Help us understand how visitors interact with our website. Used to improve the product experience.</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs">Functional</h4>
                <p className="leading-relaxed">Enable enhanced functionality like personalization and remembering your preferences.</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs">Marketing</h4>
                <p className="leading-relaxed">Used to track visitors across websites for targeted advertising campaigns.</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-500">
              You can change your cookie preferences at any time by clearing your browser data.
              For more information, see our{' '}
              <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2">
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