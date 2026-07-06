import ModulePage from './ModulePage'
import { useSEO } from '../hooks/useSEO'

export default function EfficiencyPage() {
  useSEO({ title: 'Efficiency Calculator', description: 'Calculate burner combustion efficiency, thermal efficiency, and heat balance. Optimize your burner design for maximum energy performance.', keywords: 'burner efficiency calculator, combustion efficiency, thermal efficiency, heat balance, energy optimization' })
  return (
    <ModulePage
      title="Efficiency Analysis"
      icon="📈"
      description="Equipment efficiency calculation and optimization suggestions"
      comingSoon
    />
  )
}
