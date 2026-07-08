import { useState, useEffect, useCallback } from 'react';

export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Failed to parse localStorage key "${key}":`, e);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to save localStorage key "${key}":`, e);
    }
  }, [key, state]);

  return [state, setState];
}

export function usePersistentObjectState<T extends Record<string, any>>(
  pageKey: string,
  initialValue: T
): [T, (updates: Partial<T>) => void, React.Dispatch<React.SetStateAction<T>>] {
  const fullKey = `burnerpro_${pageKey}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        // Merge with initialValue to handle new fields
        return { ...initialValue, ...parsed };
      }
    } catch (e) {
      console.warn(`Failed to parse localStorage key "${fullKey}":`, e);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to save localStorage key "${fullKey}":`, e);
    }
  }, [fullKey, state]);

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState, setState];
}
