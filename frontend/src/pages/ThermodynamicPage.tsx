import ModulePage from './ModulePage'
import { Flame } from 'lucide-react'

export default function ThermodynamicPage() {
  return (
    <ModulePage
      title="Thermodynamic Calculation"
      icon={<Flame size={48} />}
      description="Combustion thermodynamic parameter analysis"
      comingSoon
    />
  )
}
