import { Link } from 'react-router-dom'

interface Feature {
  id: string
  title: string
  description: string
  icon: string
  color: string
  bgColor: string
  to: string
}

const features: Feature[] = [
  {
    id: 'gas-calculator',
    title: 'Calculate the combustion values',
    description: 'Configure gas composition and calculate combustion parameters',
    icon: '⚙️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    to: '/gas-calculator'
  },
  {
    id: 'unit-converter',
    title: 'Unit Converter',
    description: 'Engineering unit conversion tool',
    icon: '📐',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    to: '/unit-converter'
  },
  {
    id: 'emission',
    title: 'Emission Conversion',
    description: 'Calculate and convert combustion emissions',
    icon: '📊',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    to: '/emission'
  },
  {
    id: 'thermodynamic',
    title: 'Thermodynamic Calculation',
    description: 'Combustion thermodynamic parameter analysis',
    icon: '🌡️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    to: '/thermodynamic'
  },
  {
    id: 'efficiency',
    title: 'Efficiency Analysis',
    description: 'Equipment efficiency calculation and optimization',
    icon: '📈',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    to: '/efficiency'
  },
  {
    id: 'database',
    title: 'Fuel Database',
    description: 'Standard fuel property database query',
    icon: '📚',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    to: '/database'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-6 shadow-lg">
            <span className="text-4xl">🔥</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Burner Design Pro
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Professional burner design and calculation tool for precise thermal analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.to}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="h-1 bg-slate-300"></div>
              <div className="p-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-2xl ${feature.bgColor} ${feature.color} transition-transform group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm">
                  <span>Enter Module</span>
                  <svg className="w-4 h-4 ml-2 group-hover:ml-3 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                <span className="text-lg">⚙️</span>
              </div>
              <h4 className="text-base font-semibold text-slate-800">Precise Calculation</h4>
            </div>
            <p className="text-sm text-slate-600">Accurate calculation engine based on scientific combustion theory</p>
          </div>
          
          <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 mr-3">
                <span className="text-lg">📊</span>
              </div>
              <h4 className="text-base font-semibold text-slate-800">Professional Interface</h4>
            </div>
            <p className="text-sm text-slate-600">Industrial style design with intuitive operation</p>
          </div>
          
          <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 mr-3">
                <span className="text-lg">⚡</span>
              </div>
              <h4 className="text-base font-semibold text-slate-800">Fast Response</h4>
            </div>
            <p className="text-sm text-slate-600">Real-time calculation with instant results</p>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p>© 2025 Burner Design Pro. Designed for industrial combustion.</p>
        </footer>
      </div>
    </div>
  )
}