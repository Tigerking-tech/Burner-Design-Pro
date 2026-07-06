import { useState, useCallback, useRef, useEffect } from 'react'

const CALCULATOR_STATE_PREFIX = 'calculator-state-'

/**
 * A drop-in replacement for useState that automatically persists
 * state to localStorage and restores it on page load.
 *
 * All keys are automatically prefixed with 'calculator-state-' so that
 * they can be batch-cleared on logout via clearAllCalculatorStates().
 *
 * Usage:
 *   const [value, setValue] = useLocalStorageState('my-key', 'default')
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T),
  options?: {
    /** Debounce save delay in ms (default: 300) */
    debounceMs?: number
  }
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const debounceMs = options?.debounceMs ?? 300
  const fullKey = CALCULATOR_STATE_PREFIX + key

  // Initialize from localStorage or default
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      if (raw !== null) {
        return JSON.parse(raw)
      }
    } catch {
      // ignore parse errors
    }
    return typeof defaultValue === 'function'
      ? (defaultValue as () => T)()
      : defaultValue
  })

  // Use ref to always access latest state in cleanup
  const stateRef = useRef(state)
  stateRef.current = state
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced save on state change
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(state))
      } catch {
        // ignore quota exceeded
      }
    }, debounceMs)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, fullKey, debounceMs])

  // Force save on unmount using latest state ref
  useEffect(() => {
    return () => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(stateRef.current))
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey])

  const setStateWrapped = useCallback(
    (value: React.SetStateAction<T>) => {
      setState(value)
    },
    []
  )

  return [state, setStateWrapped]
}

/** Clear all calculator states from localStorage (called on logout) */
export function clearAllCalculatorStates() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CALCULATOR_STATE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}
