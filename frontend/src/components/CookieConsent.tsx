import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#2c3e50] dark:text-white mb-1">
                      🍪 Cookie Consent
            </h3>
            <p className="text-xs text-[#555] dark:text-gray-400">
              We use cookies to enhance your browsing experience, serve personalized ads or content, 
              and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              {' '}
              <Link
                to="/privacy-policy"
                className="text-[#f39c12] hover:text-[#e67e22] underline"
              >
                Learn more
              </Link>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-sm font-medium text-[#555] dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-sm font-medium text-[#555] dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-[#f39c12] hover:bg-[#e67e22] rounded-md transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#555] dark:text-gray-400">
              <div>
                <h4 className="font-semibold text-[#2c3e50] dark:text-white mb-2">🍪 Necessary Cookies</h4>
                <p>Required for basic site functionality. Always active. Examples: login state, session management, security tokens.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3e50] dark:text-white mb-2">📊 Analytics Cookies</h4>
                <p>Help us understand how visitors interact with our website. Used to improve the product experience.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3e50] dark:text-white mb-2">💾 Functional Cookies</h4>
                <p>Enable enhanced functionality like personalization and remembering your preferences.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3e50] dark:text-white mb-2">📢 Marketing Cookies</h4>
                <p>Used to track visitors across websites for targeted advertising campaigns.</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[#7f8c8d] dark:text-gray-500">
              You can change your cookie preferences at any time by clearing your browser data. 
              For more information, see our{' '}
              <Link to="/privacy-policy" className="text-[#f39c12] hover:text-[#e67e22] underline">
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
