import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Navbar } from '../components/Navbar'
import {
  Flame,
  Leaf,
  RefreshCw,
  Gauge,
  Thermometer,
  ArrowRight,
  Check,
  ChevronRight,
  Shield,
  Zap,
  BarChart3,
  FileText,
  Layers,
  Award,
  Users,
  Cpu,
  FileOutput,
  Sparkles,
  Crosshair,
  Target,
  ChevronDown
} from 'lucide-react'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  pro?: boolean
  to: string
  category: string
}

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: Array<{ text: string; available: boolean }>
  popular?: boolean
  buttonText: string
  buttonPrimary?: boolean
}

const features: Feature[] = [
  {
    id: 'fuel',
    title: 'Fuel Manager',
    description: 'Calculate gas properties, Wobbe index, and manage fuel mixtures for optimal combustion.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="8" height="10" rx="1" />
        <rect x="10" y="10" width="4" height="4" rx="0.5" />
        <path d="M16 8v-2a2 2 0 0 0-2-2H6v2" />
        <path d="M18 8v-4a2 2 0 0 0-2-2h-1" />
        <path d="M18 10v2a2 2 0 0 1-2 2h-1" />
        <path d="M17 13l1 5" />
        <circle cx="12" cy="16" r="1.5" />
        <path d="M11 16l0-1" />
        <path d="M13 16l0-1" />
        <path d="M12 15l-1 1" />
        <path d="M12 15l1 1" />
      </svg>
    ),
    to: '/fuel-manager',
    category: 'Combustion'
  },
  {
    id: 'emission',
    title: 'Emission Analysis',
    description: 'NOx, CO, SO₂ emission calculations with EPA and EU IED compliance checking.',
    icon: <Leaf size={24} />,
    to: '/emission',
    category: 'Compliance'
  },
  {
    id: 'conversion',
    title: 'Unit Conversion',
    description: 'Comprehensive unit converter for flow rate, pressure, temperature, and emissions.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6-3 6 3" />
        <path d="M6 15l6 3 6-3" />
      </svg>
    ),
    to: '/unit-converter',
    category: 'Utility'
  },
  {
    id: 'orifice',
    title: 'Orifice Calculator',
    description: 'Design restricting or measuring orifice plates with ISO 5167 standard support.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="2" y1="12" x2="8" y2="12" />
        <line x1="16" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="8" />
        <line x1="12" y1="16" x2="12" y2="22" />
      </svg>
    ),
    pro: true,
    to: '/orifice-calculator',
    category: 'Flow'
  },
  {
    id: 'flame',
    title: 'Flame Temperature',
    description: 'Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations.',
    icon: <Thermometer size={24} />,
    pro: true,
    to: '/flame-temperature',
    category: 'Thermal'
  },
  {
    id: 'insulation',
    title: 'Insulation Calculator',
    description: 'Calculate optimal insulation thickness for pipes and flat surfaces with ISO 12241 & ASTM C680.',
    icon: <Layers size={24} />,
    pro: true,
    to: '/insulation-calculator',
    category: 'Thermal'
  }
]

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Perfect for trying out',
    features: [
      { text: '20 calculations per month', available: true },
      { text: 'Fuel Manager', available: true },
      { text: 'Emission Analysis', available: true },
      { text: 'Unit Converter', available: true },
      { text: 'Professional tools preview', available: true }
    ],
    buttonText: 'Get Started Free',
    buttonPrimary: false
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    description: 'All-in-one engineering workflow',
    features: [
      { text: 'Unlimited calculations', available: true },
      { text: 'Full access to all tools', available: true },
      { text: 'Advanced orifice calculator', available: true },
      { text: 'PDF report export', available: true },
      { text: 'EPA & EU compliance reports', available: true },
      { text: 'One-stop workflow', available: true }
    ],
    popular: true,
    buttonText: 'Start Pro',
    buttonPrimary: true
  }
]

const testimonials = [
  {
    quote: "Finally, a comprehensive burner design tool that doesn't require a PhD to use. The orifice calculator alone saved me hours of manual calculations.",
    name: 'Michael R.',
    title: 'Senior Process Engineer',
    initials: 'MR'
  },
  {
    quote: "The emission analysis module is fantastic. EPA compliance reporting used to take days — now it's done in minutes. Worth every penny.",
    name: 'Sarah K.',
    title: 'Environmental Engineer',
    initials: 'SK'
  },
  {
    quote: "As a consultant, I need reliable tools I can trust. The calculations here match my spreadsheets perfectly. The PDF export is a huge time-saver.",
    name: 'David L.',
    title: 'Consulting Engineer',
    initials: 'DL'
  }
]

export default function HomePage() {
  const navigate = useNavigate()
  const isLoggedIn = authAPI.isAuthenticated()

  const handleStartFreeClick = (e: React.MouseEvent) => {
    if (isLoggedIn) {
      e.preventDefault()
      const featuresSection = document.getElementById('features')
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const handlePricingButtonClick = (planName: string) => {
    if (planName === 'Free') {
      if (isLoggedIn) {
        navigate('/account')
      } else {
        navigate('/signup')
      }
    } else if (planName === 'Pro') {
      if (isLoggedIn) {
        navigate('/account')
      } else {
        navigate('/login')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(147,197,253,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/10">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-100">Professional Engineering Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">Precision</span>
                <br />
                <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Thermal Engineering
                </span>
              </h1>

              <p className="text-lg text-blue-100/80 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Deterministic combustion calculations, emission analysis, and unit conversion.
                Built for engineers who demand accuracy — no approximations, no compromises.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                {isLoggedIn ? (
                  <a
                    href="#features"
                    onClick={handleStartFreeClick}
                    className="group inline-flex items-center justify-center gap-2 bg-white text-blue-900 px-8 py-4 text-sm font-semibold rounded-xl transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/20"
                  >
                    Get Started
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link
                    to="/signup"
                    className="group inline-flex items-center justify-center gap-2 bg-white text-blue-900 px-8 py-4 text-sm font-semibold rounded-xl transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/20"
                  >
                    Get Started Free
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white px-8 py-4 text-sm font-semibold rounded-xl transition-all bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                >
                  View Pricing
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
                {[
                  { 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      </svg>
                    ), 
                    text: 'ISO 5167 Compliant' 
                  },
                  { 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="12 22 12 12 9 9" />
                        <polyline points="12 22 12 12 15 9" />
                      </svg>
                    ), 
                    text: 'ASTM C680 Standards' 
                  },
                  { 
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    ), 
                    text: 'PDF Export Ready' 
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-blue-200">
                    <span className="text-blue-400">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-blue-300/60">Dashboard</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Cpu className="text-blue-400" size={14} />
                      </div>
                      <span className="text-xs text-blue-300/80">Active Tools</span>
                    </div>
                    <p className="text-2xl font-bold text-white">6</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <FileOutput className="text-emerald-400" size={14} />
                      </div>
                      <span className="text-xs text-blue-300/80">Reports Generated</span>
                    </div>
                    <p className="text-2xl font-bold text-white">28</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Gauge className="text-blue-400" size={16} />
                      </div>
                      <span className="text-xs text-blue-200">Flow Calculations</span>
                    </div>
                    <span className="text-xs font-mono text-blue-300">156</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Thermometer className="text-orange-400" size={16} />
                      </div>
                      <span className="text-xs text-blue-200">Thermal Analysis</span>
                    </div>
                    <span className="text-xs font-mono text-blue-300">89</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Leaf className="text-purple-400" size={16} />
                      </div>
                      <span className="text-xs text-blue-200">Emission Reports</span>
                    </div>
                    <span className="text-xs font-mono text-blue-300">42</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-full h-full bg-blue-500/20 rounded-2xl blur-3xl -z-10" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent" />
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '6+', label: 'Engineering Tools', icon: <Cpu className="text-blue-600 dark:text-blue-400" size={28} /> },
              { value: 'ISO/ASTM', label: 'Industry Standards', icon: <Shield className="text-emerald-600 dark:text-emerald-400" size={28} /> },
              { value: 'Compliant', label: 'Standards Verified', icon: <Target className="text-orange-600 dark:text-orange-400" size={28} /> },
              { value: 'PDF', label: 'Professional Reports', icon: <FileOutput className="text-violet-600 dark:text-violet-400" size={28} /> }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl mb-4 shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50 group-hover:scale-105 transition-transform">
                  {stat.icon}
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
                Engineering Tools
              </span>
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From fuel composition to compliance reporting — complete your entire workflow without switching tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={feature.to}
                className="group bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  {feature.pro ? (
                    <span className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold rounded-full">
                      PRO
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                      Free
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{feature.description}</p>
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                  Open Tool
                  <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
                  Why Choose Us
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Built for Precision, Trusted by Engineers
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Stop juggling spreadsheets and reference manuals. Everything from fuel selection
                to compliance reporting in one place — with calculations you can verify.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ),
                    title: 'Deterministic Calculations',
                    desc: 'Every result is formula-based and traceable to established engineering standards.'
                  },
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      </svg>
                    ),
                    title: 'Standards Compliant',
                    desc: 'ISO 5167, ISO 12241, EPA, and EU IED — built according to industry specifications.'
                  },
                  {
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    ),
                    title: 'Instant Results',
                    desc: 'No waiting, no server round-trips. All calculations run locally in your browser.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 dark:bg-white/5 rounded-xl flex items-center justify-center border border-blue-100 dark:border-white/10">
                      <span className="text-blue-600 dark:text-blue-400">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Standards Certification</span>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'ISO 5167', desc: 'Flow measurement standard', status: 'verified' },
                    { name: 'ISO 12241', desc: 'Thermal insulation standard', status: 'verified' },
                    { name: 'EPA Method 29', desc: 'Emission testing protocol', status: 'verified' },
                    { name: 'EU IED', desc: 'Industrial emissions directive', status: 'verified' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">✓</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Last Verification</span>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Q2 2026</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
                Pricing
              </span>
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 dark:text-slate-400">Start free, upgrade when you need more</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border-2 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 shadow-2xl shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {plan.description}
                </p>

                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className={`text-sm ml-2 ${plan.popular ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.period}
                  </span>
                </div>

                <div className={`h-px mb-6 ${plan.popular ? 'bg-blue-400/30' : 'bg-slate-200 dark:bg-slate-700'}`} />

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.available
                          ? plan.popular
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className={feature.available ? '' : 'text-slate-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePricingButtonClick(plan.name)}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.buttonPrimary
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase">
                Testimonials
              </span>
              <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Engineer Insights
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Real-world feedback from engineers who use our tools every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
              >
                <svg className="w-8 h-8 text-blue-200 dark:text-blue-800 mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.571 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Work Faster?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join engineers who stopped calculating manually and started designing.
            Free forever for basic use.
          </p>
          {isLoggedIn ? (
            <a
              href="#features"
              onClick={handleStartFreeClick}
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-4 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-xl"
            >
              Explore Tools
              <ArrowRight size={16} />
            </a>
          ) : (
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-4 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-xl"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      <footer className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-.5.083-1.033.25-1.5" />
                </svg>
                Burner<span className="text-blue-600 dark:text-blue-400">Design</span>Pro
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 max-w-sm">
                Professional engineering tools for burner design, combustion analysis, and regulatory compliance.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <Users className="text-slate-400" size={16} />
                <span className="text-xs text-slate-500 dark:text-slate-500">Trusted by engineers worldwide</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
                <a href="#pricing" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
                <Link to="/changelog" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Changelog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Company</h4>
              <div className="space-y-3">
                <Link to="/about" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
                <Link to="/contact" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link>
                <Link to="/faq" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ / Help</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Legal</h4>
              <div className="space-y-3">
                <Link to="/privacy-policy" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
                <Link to="/refund-policy" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Refund Policy</Link>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                © 2026 Burner-Design-Pro. Professional tools for burner engineers.
              </p>
              <div className="flex items-center gap-6">
                <span className="text-xs text-slate-400 dark:text-slate-500">ISO 5167 · ASTM C680 · EPA Standards</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}