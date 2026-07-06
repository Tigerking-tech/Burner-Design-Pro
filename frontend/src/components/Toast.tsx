import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [toastId, setToastId] = useState(0)

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = toastId + 1
    setToastId(id)
    setToasts(prev => [...prev, { id, message, type }])
  }, [toastId])

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1))
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  const getToastStyles = (type: Toast['type']) => {
    const base = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-md transform transition-all duration-300'
    const typeStyles = {
      success: 'bg-green-600 text-white border border-green-500',
      error: 'bg-red-600 text-white border border-red-500',
      warning: 'bg-yellow-600 text-white border border-yellow-500',
      info: 'bg-blue-600 text-white border border-blue-500',
    }
    return `${base} ${typeStyles[type]}`
  }

  const getIcon = (type: Toast['type']) => {
    const icons = {
      success: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    }
    return icons[type]
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`${getToastStyles(toast.type)} animate-slide-in`}
            style={{
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {getIcon(toast.type)}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
