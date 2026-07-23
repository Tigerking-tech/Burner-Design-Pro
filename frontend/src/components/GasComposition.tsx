import { useState } from 'react'

export interface GasComponent {
  name: string
  symbol: string
  percentage: string
}

export interface GasPreset {
  name: string
  composition: Record<string, string>
}

interface GasCompositionProps {
  components: GasComponent[]
  setComponents: (components: GasComponent[]) => void
  presets: GasPreset[]
  selectedPreset: string
  setSelectedPreset: (preset: string) => void
  title: string
  presetLabel?: string
}

const defaultGasComponents: GasComponent[] = [
  { name: 'Hydrogen', symbol: 'H₂', percentage: '0' },
  { name: 'Carbon Monoxide', symbol: 'CO', percentage: '0' },
  { name: 'Ammonia', symbol: 'NH₃', percentage: '0' },
  { name: 'Hydrogen sulphide', symbol: 'H₂S', percentage: '0' },
  { name: 'Methane', symbol: 'CH₄', percentage: '0' },
  { name: 'Ethane', symbol: 'C₂H₆', percentage: '0' },
  { name: 'Propane', symbol: 'C₃H₈', percentage: '0' },
  { name: 'Butane', symbol: 'C₄H₁₀', percentage: '0' },
  { name: 'Pentane', symbol: 'C₅H₁₂', percentage: '0' },
  { name: 'Hexane', symbol: 'C₆H₁₄', percentage: '0' },
  { name: 'Heptane', symbol: 'C₇H₁₆', percentage: '0' },
  { name: 'Benzene', symbol: 'C₆H₆', percentage: '0' },
  { name: 'Ethene', symbol: 'C₂H₄', percentage: '0' },
  { name: 'Propene', symbol: 'C₃H₆', percentage: '0' },
  { name: 'Butene', symbol: 'C₄H₈', percentage: '0' },
  { name: 'Ethine', symbol: 'C₂H₂', percentage: '0' },
  { name: 'Nitrogen', symbol: 'N₂', percentage: '0' },
  { name: 'Carbon Dioxide', symbol: 'CO₂', percentage: '0' },
  { name: 'Oxygen', symbol: 'O₂', percentage: '0' },
  { name: 'Steam', symbol: 'H₂O', percentage: '0' },
  { name: 'Air', symbol: 'Air', percentage: '0' },
]

export { defaultGasComponents }

export default function GasComposition({
  components,
  setComponents,
  presets,
  selectedPreset,
  setSelectedPreset,
  title,
  presetLabel = 'Gas type'
}: GasCompositionProps) {
  const getTotalPercentage = () => {
    return components.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0)
  }

  const handleComponentChange = (symbol: string, value: string) => {
    if (value !== '') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue < 0) return
    }
    
    const newComponents = components.map(c =>
      c.symbol === symbol ? { ...c, percentage: value } : c
    )
    setComponents(newComponents)
    setSelectedPreset('')
  }

  const applyPreset = (presetName: string) => {
    if (presetName === '__enter__') {
      setComponents(defaultGasComponents.map(c => ({ ...c, percentage: '0' })))
      setSelectedPreset('__enter__')
      return
    }
    const preset = presets.find(p => p.name === presetName)
    if (!preset) return

    const newComponents = defaultGasComponents.map(c => ({
      ...c,
      percentage: preset.composition[c.symbol] || '0'
    }))

    setComponents(newComponents)
    setSelectedPreset(presetName)
  }

  const isTotalValid = Math.abs(getTotalPercentage() - 100) < 0.01

  return (
    <div className="bg-white dark:bg-white/5 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 overflow-hidden">
      {title && (
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">1</span>
          {title}
        </h2>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{presetLabel}</label>
        <select
          value={selectedPreset}
          onChange={(e) => {
            setSelectedPreset(e.target.value)
            if (e.target.value) applyPreset(e.target.value)
          }}
          className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white text-sm transition-colors duration-200"
        >
          <option value="">Select gas type...</option>
          <option value="__enter__">Enter %-by-vol.</option>
          {presets.map((preset, i) => (
            <option key={i} value={preset.name}>{preset.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white">
              <th className="text-left py-2 px-3 font-semibold border-b border-slate-200 dark:border-white/10">Single Gas</th>
              <th className="text-left py-2 px-3 font-semibold border-b border-slate-200 dark:border-white/10 hidden sm:table-cell">Symbol</th>
              <th className="text-right py-2 px-3 font-semibold w-20 border-b border-slate-200 dark:border-white/10">Vol.-%</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component, idx) => (
              <tr key={component.symbol} className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50 dark:bg-white/5'}>
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">{component.name}</td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 hidden sm:table-cell">{component.symbol}</td>
                <td className="py-2 px-3 text-right border-b border-slate-200 dark:border-white/10">
                  <input
                    type="text"
                    value={component.percentage}
                    onChange={(e) => handleComponentChange(component.symbol, e.target.value)}
                    className="w-16 sm:w-20 px-2 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-sm text-right text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Percentage:</span>
        <span className={`text-lg font-bold ${isTotalValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {getTotalPercentage().toFixed(2)}%
        </span>
      </div>
    </div>
  )
}