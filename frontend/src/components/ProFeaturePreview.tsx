import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Sparkles, X } from 'lucide-react'

interface ProFeaturePreviewProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

export default function ProFeaturePreview({ 
  title, 
  description, 
  icon, 
  children 
}: ProFeaturePreviewProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const navigate = useNavigate()
  
  const isProUser = authAPI.isAuthenticated() && authAPI.getSubscriptionTier() !== 'free'
  
  const handleProAction = (e: React.MouseEvent) => {
    if (!isProUser) {
      e.preventDefault()
      e.stopPropagation()
      setShowSubscriptionModal(true)
    }
  }
  
  const handleSubscribeClick = () => {
    setShowSubscriptionModal(false)
    navigate('/subscription')
  }
  
  const renderWithProGuard = (child: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(child)) {
      return child
    }
    
    const element = child as React.ReactElement
    const tagName = element.type
    
    const isClickableElement = 
      tagName === 'button' || 
      (typeof tagName === 'string' && ['button', 'a', 'input'].includes(tagName)) ||
      element.props.onClick ||
      element.props.type === 'submit'
    
    if (element.props.children) {
      return React.cloneElement(element, {
        children: React.Children.map(element.props.children, renderWithProGuard)
      })
    }
    
    return child
  }
  
  return (
    <div className="relative">
      {!isProUser && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 flex items-center justify-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm opacity-90">Preview Mode - Upgrade to use</p>
          </div>
          <button
            onClick={handleSubscribeClick}
            className="ml-auto bg-white text-blue-600 px-5 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
      
      <div className={!isProUser ? 'opacity-90' : ''}>
        {React.Children.map(children, renderWithProGuard)}
      </div>
      
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-4xl text-blue-600 dark:text-blue-400">{icon}</div>
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white mb-2">Unlock {title}</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Upgrade to Pro to use this calculator and unlock all premium features
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 mb-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Pro Features:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  Full access to {title}
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  All Pro calculators
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  PDF report export
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                  Calculation history
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Continue Preview
              </button>
              <button
                onClick={handleSubscribeClick}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
