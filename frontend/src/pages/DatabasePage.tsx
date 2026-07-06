import ModulePage from './ModulePage'
import { useSEO } from '../hooks/useSEO'

export default function DatabasePage() {
  useSEO({ title: 'Fuel & Gas Database', description: 'Comprehensive database of fuel properties and gas compositions for burner design engineering. Includes natural gas, fuel oil, LPG, and biogas data.', keywords: 'fuel database, gas composition database, natural gas properties, fuel oil data, LPG properties, biogas composition' })
  return (
    <ModulePage
      title="Fuel Database"
      icon="📚"
      description="Standard fuel properties database lookup"
      comingSoon
    />
  )
}
