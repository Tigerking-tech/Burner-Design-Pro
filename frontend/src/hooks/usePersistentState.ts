import { useState, useEffect, useCallback } from 'react';

export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        // Type guard: ensure the parsed value matches the expected type
        if (typeof parsed === typeof initialValue) {
          return parsed as T;
        }
        // For array types, check if parsed is also an array
        if (Array.isArray(initialValue) && Array.isArray(parsed)) {
          return parsed as T;
        }
        // For object types, check if both are objects
        if (typeof initialValue === 'object' && initialValue !== null &&
            typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return parsed as T;
        }
        // Type mismatch, fall back to initial value
        console.warn(`Type mismatch for localStorage key "${key}", using initial value`);
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
