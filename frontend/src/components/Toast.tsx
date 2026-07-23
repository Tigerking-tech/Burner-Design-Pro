import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

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

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1))
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  const getToastStyles = (type: Toast['type']) => {
    const base = 'flex items-center gap-3 min-w-[320px] max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden'
    const typeStyles = {
      success: 'border-l-4 border-l-emerald-500',
      error: 'border-l-4 border-l-red-500',
      warning: 'border-l-4 border-l-amber-500',
      info: 'border-l-4 border-l-blue-500',
    }
    return `${base} ${typeStyles[type]}`
  }

  const getIcon = (type: Toast['type']) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
      error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
      warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
      info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    }
    return icons[type]
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`${getToastStyles(toast.type)} animate-slide-in`}
            style={{
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <div className="px-4 py-3 flex-1 flex items-center gap-3">
              {getIcon(toast.type)}
              <span className="flex-1 text-sm text-slate-900 dark:text-slate-100 font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
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
