import { useState } from 'react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  minLength?: number
  disabled?: boolean
  className?: string
  error?: boolean
  errorMessage?: string
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  label,
  required = false,
  minLength,
  disabled = false,
  className = '',
  error = false,
  errorMessage,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#555] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className={`w-full px-4 py-2.5 pr-12 border rounded-md focus:outline-none focus:ring-2 transition-colors text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-[#f39c12]/20 focus:border-[#f39c12]'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          disabled={disabled}
        >
          {showPassword ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
