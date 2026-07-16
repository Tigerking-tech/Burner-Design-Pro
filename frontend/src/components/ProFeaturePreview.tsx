import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

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
  
  // Override buttons and interactive elements in children, add interception
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
    
    // No longer intercept all clicks, only show prompt in modal
    if (element.props.children) {
      return React.cloneElement(element, {
        children: React.Children.map(element.props.children, renderWithProGuard)
      })
    }
    
    return child
  }
  
  return (
    <div className="relative">
      {/* Pro badge banner */}
      {!isProUser && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 flex items-center justify-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm opacity-90">Preview Mode - Upgrade to use</p>
          </div>
          <button
            onClick={handleSubscribeClick}
            className="ml-auto bg-white text-amber-600 px-5 py-2 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
      
      {/* Main content area */}
      <div className={!isProUser ? 'opacity-90' : ''}>
        {React.Children.map(children, renderWithProGuard)}
      </div>
      
      {/* Subscription prompt modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-4xl">{icon}</div>
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Unlock {title}</h2>
              <p className="text-gray-600">
                Upgrade to Pro to use this calculator and unlock all premium features
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Pro Features:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500 font-bold">✓</span>
                  Full access to {title}
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500 font-bold">✓</span>
                  All Pro calculators
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500 font-bold">✓</span>
                  PDF report export
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500 font-bold">✓</span>
                  Calculation history
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continue Preview
              </button>
              <button
                onClick={handleSubscribeClick}
                className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
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
