import ModulePage from './ModulePage'
import { Flame } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

export default function ThermodynamicPage() {
  useSEO({ title: 'Thermodynamic Properties', description: 'Access comprehensive thermodynamic property data for gases and fuels used in burner design. Includes specific heat, density, viscosity, and thermal conductivity.', keywords: 'thermodynamic properties, gas properties, specific heat, thermal conductivity, viscosity, combustion gas properties' })
  return (
    <ModulePage
      title="Thermodynamic Calculation"
      icon={<Flame size={48} />}
      description="Combustion thermodynamic parameter analysis"
      comingSoon
    />
  )
}
