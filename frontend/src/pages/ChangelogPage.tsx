import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, Sparkles, Bug, Shield, Zap } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'

const changelog = [
  {
    version: 'v2.1.0',
    date: 'July 6, 2026',
    items: [
      { type: 'feature', text: 'Added password reset functionality (forgot password flow)' },
      { type: 'feature', text: 'Added account deletion (GDPR right to erasure)' },
      { type: 'feature', text: 'Added data export feature (GDPR right to data portability)' },
      { type: 'feature', text: 'Added cookie consent banner' },
      { type: 'feature', text: 'Added terms of service acceptance checkbox on signup' },
      { type: 'feature', text: 'Added login attempt protection (account lockout after 5 failed attempts)' },
      { type: 'feature', text: 'Added invoice links in order history' },
      { type: 'feature', text: 'Added Refund Policy page' },
      { type: 'feature', text: 'Added FAQ & Help page' },
      { type: 'feature', text: 'Added Contact page' },
      { type: 'feature', text: 'Added About page' },
      { type: 'feature', text: 'Added Changelog page' },
      { type: 'security', text: 'Upgraded password hashing from SHA256 to bcrypt' },
      { type: 'security', text: 'Improved Content-Security-Policy header' },
      { type: 'security', text: 'Added Permissions-Policy header' },
      { type: 'security', text: 'Added production JWT secret key warning' },
      { type: 'fix', text: 'Fixed CSP policy that could break React frontend' },
    ]
  },
  {
    version: 'v2.0.0',
    date: 'June 15, 2026',
    items: [
      { type: 'feature', text: 'Major redesign with improved user interface' },
      { type: 'feature', text: 'Added Creem subscription billing integration' },
      { type: 'feature', text: 'Added Creem customer portal for billing management' },
      { type: 'feature', text: 'Added Fuel Manager module' },
      { type: 'feature', text: 'Added burner components database with 1000+ components' },
      { type: 'feature', text: 'Added Insulation Calculator' },
      { type: 'feature', text: 'Added Efficiency Calculator' },
      { type: 'feature', text: 'Added dark mode support' },
      { type: 'improvement', text: 'Improved calculation accuracy for all tools' },
      { type: 'improvement', text: 'Faster page load times' },
    ]
  },
  {
    version: 'v1.5.0',
    date: 'April 20, 2026',
    items: [
      { type: 'feature', text: 'Added Thermodynamic Calculator' },
      { type: 'feature', text: 'Added Emissions Calculator' },
      { type: 'feature', text: 'Added Unit Converter' },
      { type: 'improvement', text: 'Enhanced Flame Temperature Calculator with more fuel types' },
      { type: 'fix', text: 'Fixed orifice calculator rounding issues' },
    ]
  },
  {
    version: 'v1.0.0',
    date: 'January 15, 2026',
    items: [
      { type: 'feature', text: 'Initial release of Burner Design Pro' },
      { type: 'feature', text: 'Flame Temperature Calculator' },
      { type: 'feature', text: 'Orifice Sizing Calculator' },
      { type: 'feature', text: 'User authentication and accounts' },
      { type: 'feature', text: 'Responsive design for mobile and desktop' },
    ]
  }
]

const typeConfig: Record<string, { icon: any; label: string; bgClass: string; textClass: string }> = {
  feature: {
    icon: Sparkles,
    label: 'New',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
  fix: {
    icon: Bug,
    label: 'Fix',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  security: {
    icon: Shield,
    label: 'Security',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  improvement: {
    icon: Zap,
    label: 'Improvement',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-400',
  },
}

export default function ChangelogPage() {
  useSEO({
    title: 'Changelog',
    description: 'See what is new in Burner Design Pro. Product updates, new features, bug fixes, and improvements.',
  })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#f39c12]/20 rounded-full flex items-center justify-center">
              <FileText className="text-[#f39c12]" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-semibold mb-4">Changelog</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            See what is new in Burner Design Pro. We are always improving.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f39c12] hover:text-[#e67e22] mb-6 transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="space-y-8">
          {changelog.map((release) => (
            <div
              key={release.version}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#2c3e50] dark:text-white">
                      {release.version}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{release.date}</p>
                  </div>
                  {release === changelog[0] && (
                    <span className="px-3 py-1 bg-[#f39c12] text-white text-xs font-semibold rounded-full">
                      Latest
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {release.items.map((item, index) => {
                    const config = typeConfig[item.type] || typeConfig.feature
                    const Icon = config.icon
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${config.bgClass} ${config.textClass}`}>
                          <Icon size={12} />
                          {config.label}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {item.text}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe CTA */}
        <div className="mt-10 bg-gradient-to-r from-[#2c3e50] to-[#34495e] rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-2">Stay updated</h2>
          <p className="text-[#bdc3c7] mb-6 max-w-xl mx-auto">
            Want to be the first to know about new features? Follow our updates.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-[#f39c12] hover:bg-[#e67e22] text-white px-8 py-3 rounded-md font-semibold transition-colors shadow-md"
          >
            Create a Free Account
          </Link>
        </div>
      </div>
    </div>
  )
}
