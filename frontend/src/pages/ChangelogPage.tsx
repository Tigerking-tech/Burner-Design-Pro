import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, Sparkles, Bug, Shield, Zap, ArrowRight } from 'lucide-react'
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
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  fix: {
    icon: Bug,
    label: 'Fix',
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/20',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  security: {
    icon: Shield,
    label: 'Security',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  improvement: {
    icon: Zap,
    label: 'Improvement',
    bgClass: 'bg-violet-500/10 dark:bg-violet-500/20',
    textClass: 'text-violet-700 dark:text-violet-400',
  },
}

export default function ChangelogPage() {
  useSEO({
    title: 'Changelog',
    description: 'See what is new in Burner Design Pro. Product updates, new features, bug fixes, and improvements.',
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-16 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
              Changelog
            </span>
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            What's New
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            See what's new in Burner Design Pro. We're always improving.
          </p>
        </div>

        <div className="space-y-6">
          {changelog.map((release) => (
            <div
              key={release.version}
              className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-white/5 px-6 md:px-8 py-4 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {release.version}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{release.date}</p>
                  </div>
                  {release === changelog[0] && (
                    <span className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Latest
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 md:p-8">
                <ul className="space-y-3">
                  {release.items.map((item, index) => {
                    const config = typeConfig[item.type] || typeConfig.feature
                    const Icon = config.icon
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 mt-0.5 ${config.bgClass} ${config.textClass}`}>
                          <Icon size={12} />
                          {config.label}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 text-sm">
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
        <div className="mt-10 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">Stay updated</h2>
            <p className="text-blue-100/80 mb-6 max-w-xl mx-auto">
              Want to be the first to know about new features? Follow our updates.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/20 text-sm"
            >
              Create a Free Account
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
