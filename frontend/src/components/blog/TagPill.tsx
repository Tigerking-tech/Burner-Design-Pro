import { ReactNode } from 'react'

interface TagPillProps {
  tag?: string
  label?: string
  name?: string
  color?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'
  icon?: ReactNode
  onClick?: () => void
  className?: string
  count?: number
  selected?: boolean
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-700/10 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-400/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-700/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-700/10 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-700/10 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-700/10 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20',
}

export const categoryColorMap: Record<string, TagPillProps['color']> = {
  'Thermal Design': 'amber',
  'Combustion Engineering': 'blue',
  'Emissions & Compliance': 'emerald',
  'Emissions': 'emerald',
  'Flow Measurement': 'cyan',
  'Insulation': 'violet',
  'Industry Insights': 'violet',
  'Tutorials': 'cyan',
}

export function TagPill(props: TagPillProps) {
  const {
    tag,
    label,
    name,
    color,
    icon,
    onClick,
    className = '',
    count,
    selected,
  } = props

  const displayLabel = label ?? name ?? tag ?? ''
  const baseColor = color ?? 'slate'

  let baseClasses = ''
  if (selected !== undefined) {
    baseClasses = `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
      selected
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-inset ring-blue-700/10'
        : `${colorMap[baseColor]} hover:brightness-95 dark:hover:brightness-110 cursor-pointer`
    }`
  } else {
    baseClasses = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition-colors ${colorMap[baseColor] || colorMap.slate}`
  }

  const clickableClasses = onClick ? 'cursor-pointer hover:brightness-95 dark:hover:brightness-110' : ''

  const content = (
    <>
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      {displayLabel}
      {count !== undefined && (
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-semibold rounded-full ${
            selected
              ? 'bg-white/20 text-white'
              : 'bg-white/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300'
          }`}
        >
          {count}
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} ${clickableClasses} ${className}`}>
        {content}
      </button>
    )
  }

  return (
    <span className={`${baseClasses} ${className}`}>
      {content}
    </span>
  )
}

export default TagPill
