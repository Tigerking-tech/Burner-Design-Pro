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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden">
      <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-6 flex items-center">
        <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">1</span>
        {title}
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">{presetLabel}</label>
        <select
          value={selectedPreset}
          onChange={(e) => {
            setSelectedPreset(e.target.value)
            if (e.target.value) applyPreset(e.target.value)
          }}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
        >
          <option value="">Select gas type...</option>
          <option value="__enter__">Enter %-by-vol.</option>
          {presets.map((preset, i) => (
            <option key={i} value={preset.name}>{preset.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#2c3e50] text-white">
              <th className="text-left py-1.5 px-2 font-medium">Single Gas</th>
              <th className="text-left py-1.5 px-2 font-medium hidden sm:table-cell">Symbol</th>
              <th className="text-right py-1.5 px-2 font-medium w-16">Vol.-%</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component, idx) => (
              <tr key={component.symbol} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                <td className="py-1 px-2 text-gray-700 dark:text-gray-300 text-xs">{component.name}</td>
                <td className="py-1 px-2 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">{component.symbol}</td>
                <td className="py-1 px-2 text-right">
                  <input
                    type="text"
                    value={component.percentage}
                    onChange={(e) => handleComponentChange(component.symbol, e.target.value)}
                    className="w-14 sm:w-16 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-xs text-right text-gray-900 dark:text-white focus:outline-none focus:border-[#f39c12]"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700/50 rounded">
        <span className="text-sm font-medium text-[#555] dark:text-gray-300">Total Percentage:</span>
        <span className={`text-lg font-bold ${isTotalValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {getTotalPercentage().toFixed(2)}%
        </span>
      </div>
    </div>
  )
}