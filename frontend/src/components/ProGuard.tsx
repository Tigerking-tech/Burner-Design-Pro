import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Crown, Lock, X, Sparkles } from 'lucide-react'

function useIsProUser() {
  return authAPI.isAuthenticated() && authAPI.getSubscriptionTier() === 'pro'
}

interface ProAccessApi {
  isProUser: boolean
  /** Wrap a calculation/export handler. Pro users run it; non-Pro users see the subscribe modal. */
  requirePro: (callback: () => void) => (e?: React.MouseEvent) => void
  /** Render this once inside the page to show the subscribe prompt. */
  modal: React.ReactNode
}

/**
 * Standalone Pro-access hook for a tool page. Call at the top of the page component,
 * wrap calculation/export handlers with `requirePro`, and render `{modal}` in the tree.
 */
export function useProAccess(title: string, description: string, icon: React.ReactNode): ProAccessApi {
  const navigate = useNavigate()
  const isProUser = useIsProUser()
  const isAuthenticated = authAPI.isAuthenticated()
  const [showModal, setShowModal] = useState(false)

  const requirePro = useCallback(
    (callback: () => void) => (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (isProUser) {
        callback()
      } else {
        setShowModal(true)
      }
    },
    [isProUser]
  )

  const handleSubscribe = () => {
    setShowModal(false)
    navigate('/subscription')
  }

  const modal = showModal ? (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-700 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 dark:text-blue-400">{icon}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Subscribe to calculate</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {description || `You've explored the ${title} layout. Upgrade to Pro to run calculations and export reports.`}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              Full access to {title}
            </li>
            <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              All Pro calculators &amp; tools
            </li>
            <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              PDF report export
            </li>
            <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
              Save calculation history
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleSubscribe}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Lock className="w-4 h-4" />
            Upgrade to Pro
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => {
                setShowModal(false)
                navigate('/login')
              }}
              className="w-full py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Log In
            </button>
          )}
          <button
            onClick={() => setShowModal(false)}
            className="w-full py-2 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm"
          >
            Continue previewing
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { isProUser, requirePro, modal }
}

interface ProGuardProps {
  title: string
  description?: string
  icon: React.ReactNode
  children: React.ReactNode
}

/**
 * Renders a "Preview mode" banner for non-Pro users and shows the page layout (children)
 * so visitors can explore it. Calculation actions are gated separately via `useProAccess`.
 */
export default function ProGuard({ title, icon, children }: ProGuardProps) {
  const navigate = useNavigate()
  const isProUser = useIsProUser()

  if (isProUser) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg shadow-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300" />
            </span>
            <div className="leading-tight">
              <div className="font-bold text-sm flex items-center gap-1.5">
                {title}
                <span className="text-[10px] uppercase tracking-wider bg-amber-400/90 text-blue-900 px-1.5 py-0.5 rounded font-extrabold">
                  Pro
                </span>
              </div>
              <div className="text-[11px] opacity-90">Preview mode — explore the layout, subscribe to calculate</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="ml-auto bg-white text-blue-700 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade
          </button>
        </div>
      </div>

      {children}
    </div>
  )
}
