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
  BrickWall,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Activity,
  Shield,
  Zap,
  Cog,
  Wrench,
  Settings
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
    icon: <Flame size={22} />,
    to: '/fuel-manager',
    category: 'Combustion'
  },
  {
    id: 'emission',
    title: 'Emission Analysis',
    description: 'NOx, CO, SO₂ emission calculations with EPA and EU IED compliance checking.',
    icon: <Leaf size={22} />,
    to: '/emission',
    category: 'Compliance'
  },
  {
    id: 'conversion',
    title: 'Unit Conversion',
    description: 'Comprehensive unit converter for flow rate, pressure, temperature, and emissions.',
    icon: <RefreshCw size={22} />,
    to: '/unit-converter',
    category: 'Utility'
  },
  {
    id: 'orifice',
    title: 'Orifice Calculator',
    description: 'Design restricting or measuring orifice plates with ISO 5167 standard support.',
    icon: <Gauge size={22} />,
    pro: true,
    to: '/orifice-calculator',
    category: 'Flow'
  },
  {
    id: 'flame',
    title: 'Flame Temperature',
    description: 'Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations.',
    icon: <Thermometer size={22} />,
    pro: true,
    to: '/flame-temperature',
    category: 'Thermal'
  },
  {
    id: 'insulation',
    title: 'Insulation Calculator',
    description: 'Calculate optimal insulation thickness for pipes and flat surfaces with ISO 12241 & ASTM C680.',
    icon: <BrickWall size={22} />,
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

const Rivet = ({ className = '' }: { className?: string }) => (
  <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#4a4a4a] to-[#2a2a2a] border border-[#1a1a1a] shadow-inner ${className}`} />
)

const MetalPlate = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-[#3a3a3a] ${className}`}>
    <Rivet className="absolute top-2 left-2" />
    <Rivet className="absolute top-2 right-2" />
    <Rivet className="absolute bottom-2 left-2" />
    <Rivet className="absolute bottom-2 right-2" />
    {children}
  </div>
)

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
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200 font-sans">
      <Navbar />

      {/* === HERO SECTION === */}
      <section className="relative overflow-hidden border-b border-[#2a2a2a]">
        {/* Blueprint grid background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#0d0d0d]" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ff5722" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid-bold" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#ff5722" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#grid-bold)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-transparent to-[#0d0d0d]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-transparent to-[#0d0d0d]" />
        </div>

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#ff5722] to-transparent animate-pulse" style={{ top: '30%' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Industrial badge */}
            <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-[#1a1a1a] border border-[#333]">
              <div className="w-2 h-2 rounded-full bg-[#ff5722] animate-pulse" />
              <span className="font-mono text-xs text-[#ff5722] tracking-[0.15em] uppercase">
                Industrial Grade Engineering
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.05] tracking-tight text-white uppercase">
              Engineered for
              <br />
              <span className="text-[#ff5722]" style={{ textShadow: '0 0 40px rgba(255,87,34,0.3)' }}>
                Thermal Precision.
              </span>
            </h1>

            <p className="text-lg text-gray-400 mb-10 max-w-xl leading-relaxed">
              Deterministic combustion calculations, emission analysis, and unit conversion.
              Built for engineers who demand accuracy — no approximations, no compromises.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {isLoggedIn ? (
                <a
                  href="#features"
                  onClick={handleStartFreeClick}
                  className="group inline-flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-4 border-[#bf360c] hover:border-[#e64a19] active:border-b-0 active:mt-1"
                >
                  <Settings size={18} />
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-4 border-[#bf360c] hover:border-[#e64a19] active:border-b-0 active:mt-1"
                >
                  <Settings size={18} />
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all border border-[#333] border-b-4 border-[#222] hover:border-[#444] active:border-b-0 active:mt-1"
              >
                View Pricing
              </a>
            </div>

            {/* Specs row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { icon: <Shield size={16} />, text: 'ISO 5167 Compliant' },
                { icon: <Cog size={16} />, text: 'ASTM C680 Standards' },
                { icon: <Wrench size={16} />, text: 'EU IED Ready' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase tracking-wide">
                  <span className="text-[#ff5722]">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side industrial decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-[30%] hidden lg:block">
          <svg viewBox="0 0 400 500" className="w-full h-full opacity-20">
            {/* Pipe sections */}
            <circle cx="250" cy="150" r="100" fill="none" stroke="#ff5722" strokeWidth="2" />
            <circle cx="250" cy="150" r="70" fill="none" stroke="#ff5722" strokeWidth="1" />
            <circle cx="250" cy="150" r="40" fill="none" stroke="#ff5722" strokeWidth="0.5" />
            {/* Flange bolts */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180
              const x = 250 + 100 * Math.cos(angle)
              const y = 150 + 100 * Math.sin(angle)
              return <circle key={i} cx={x} cy={y} r="5" fill="#444" stroke="#666" strokeWidth="1" />
            })}
            {/* Cross lines */}
            <line x1="150" y1="150" x2="350" y2="150" stroke="#444" strokeWidth="0.5" strokeDasharray="4,4" />
            <line x1="250" y1="50" x2="250" y2="250" stroke="#444" strokeWidth="0.5" strokeDasharray="4,4" />
            {/* Gauge */}
            <g transform="translate(250, 350)">
              <circle cx="0" cy="0" r="60" fill="none" stroke="#666" strokeWidth="2" />
              <circle cx="0" cy="0" r="50" fill="none" stroke="#444" strokeWidth="1" />
              {/* Tick marks */}
              {[...Array(11)].map((_, i) => {
                const angle = ((-150 + i * 30) * Math.PI) / 180
                const x1 = 50 * Math.cos(angle)
                const y1 = 50 * Math.sin(angle)
                const x2 = 40 * Math.cos(angle)
                const y2 = 40 * Math.sin(angle)
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#888" strokeWidth="1.5" />
              })}
              {/* Needle */}
              <line x1="0" y1="0" x2="30" y2="-35" stroke="#ff5722" strokeWidth="2" />
              <circle cx="0" cy="0" r="4" fill="#ff5722" />
            </g>
          </svg>
        </div>
      </section>

      {/* === STATS BAR === */}
      <section className="bg-[#121212] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#2a2a2a]">
            {[
              { label: 'Calculations', value: '6+', desc: 'Engineering Tools' },
              { label: 'Standards', value: 'ISO/ASTM', desc: 'Industry Compliant' },
              { label: 'Accuracy', value: '< 0.1%', desc: 'Formula Precision' },
              { label: 'Exports', value: 'PDF', desc: 'Professional Reports' }
            ].map((stat, i) => (
              <div key={i} className="px-6 py-2 text-center md:text-left first:pl-0 last:pr-0">
                <p className="text-3xl font-black text-white mb-1 tracking-tight font-mono">
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold text-[#ff5722] uppercase tracking-[0.2em] mb-0.5">
                  {stat.label}
                </p>
                <p className="text-xs text-gray-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-10 h-px bg-[#ff5722]" />
            <span className="font-mono text-xs text-[#ff5722] tracking-[0.2em] uppercase font-bold">
              06 Tools
            </span>
            <div className="w-10 h-px bg-[#ff5722]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-white uppercase">
            Everything you need
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            From fuel composition to compliance reporting — complete your entire workflow without switching tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <Link
              key={feature.id}
              to={feature.to}
              className="group relative bg-gradient-to-b from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] p-6 hover:border-[#ff5722]/40 transition-all duration-300"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ff5722]/30 group-hover:border-[#ff5722]/60 transition-colors" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ff5722]/30 group-hover:border-[#ff5722]/60 transition-colors" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ff5722]/30 group-hover:border-[#ff5722]/60 transition-colors" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#ff5722]/30 group-hover:border-[#ff5722]/60 transition-colors" />

              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 bg-[#0d0d0d] border border-[#333] flex items-center justify-center text-gray-400 group-hover:text-[#ff5722] group-hover:border-[#ff5722]/40 transition-colors">
                  {feature.icon}
                </div>
                {feature.pro ? (
                  <span className="text-[10px] font-black bg-[#ff5722] text-white px-3 py-1 tracking-wider uppercase">
                    PRO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-500 px-3 py-1 border border-[#333] uppercase tracking-wider">
                    Free
                  </span>
                )}
              </div>

              <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] mb-2 font-bold">
                {feature.category}
              </p>
              <h3 className="text-lg font-bold mb-2 text-white uppercase tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                {feature.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-[#ff5722] group-hover:gap-3 transition-all uppercase tracking-wide">
                Open Tool
                <ChevronRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* === WHY US / ADVANTAGE === */}
      <section className="bg-[#121212] border-y border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-3 mb-5">
                <div className="w-6 h-px bg-[#ff5722]" />
                <span className="font-mono text-xs text-[#ff5722] tracking-[0.2em] uppercase font-bold">
                  Why Burner Design Pro
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight text-white uppercase">
                Built for precision,
                <br />
                trusted by engineers.
              </h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                Stop juggling spreadsheets and reference manuals. Everything from fuel selection
                to compliance reporting in one place — with calculations you can verify.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: <Activity size={20} />,
                    title: 'Deterministic Calculations',
                    desc: 'Every result is formula-based and traceable to established engineering standards.'
                  },
                  {
                    icon: <Shield size={20} />,
                    title: 'Standards Compliant',
                    desc: 'ISO 5167, ISO 12241, EPA, and EU IED — built according to industry specifications.'
                  },
                  {
                    icon: <Zap size={20} />,
                    title: 'Instant Results',
                    desc: 'No waiting, no server round-trips. All calculations run locally in your browser.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#0d0d0d] border border-[#2a2a2a]">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#ff5722]/10 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722]">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1 text-white uppercase tracking-tight">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Control panel mockup */}
              <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#141414] border-2 border-[#333] p-6">
                {/* Panel screws */}
                <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#555] to-[#222] border border-[#111]" />
                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#555] to-[#222] border border-[#111]" />
                <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#555] to-[#222] border border-[#111]" />
                <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#555] to-[#222] border border-[#111]" />

                <div className="font-mono text-[10px] text-gray-600 mb-5 tracking-[0.2em] uppercase font-bold pl-3 border-l-2 border-[#ff5722]">
                  // System Output
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Orifice Diameter', value: '52.3 mm', sub: 'β = 0.523', status: 'ok' },
                    { label: 'Pressure Drop', value: '2.4 kPa', sub: 'ΔP design', status: 'ok' },
                    { label: 'Discharge Coeff', value: '0.6048', sub: 'ISO 5167-2:2024', status: 'ok' },
                    { label: 'Uncertainty', value: '± 0.85%', sub: 'k = 2, 95% conf.', status: 'warn' }
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-4 bg-[#0d0d0d] border border-[#2a2a2a]">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${row.status === 'ok' ? 'bg-green-500' : 'bg-[#ff5722]'} animate-pulse`} />
                        <span className="text-sm text-gray-400 font-mono">{row.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black font-mono text-[#ff5722]">
                          {row.value}
                        </p>
                        <p className="text-[10px] text-gray-600 font-mono tracking-wider">
                          {row.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                      System Online
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-600">
                    v2.4.1
                  </span>
                </div>
              </div>

              {/* Back panel shadow */}
              <div className="absolute -z-10 -bottom-3 -right-3 w-full h-full bg-[#0a0a0a] border border-[#222]" />
            </div>
          </div>
        </div>
      </section>

      {/* === PRICING SECTION === */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-6 h-px bg-[#ff5722]" />
            <span className="font-mono text-xs text-[#ff5722] tracking-[0.2em] uppercase font-bold">
              Pricing
            </span>
            <div className="w-6 h-px bg-[#ff5722]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-white uppercase">
            Simple, transparent
          </h2>
          <p className="text-gray-500">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative ${
                plan.popular
                  ? 'bg-gradient-to-b from-[#1f1410] to-[#18100d] border-2 border-[#ff5722]/50'
                  : 'bg-gradient-to-b from-[#1a1a1a] to-[#141414] border border-[#2a2a2a]'
              } p-8 transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ff5722] text-white px-5 py-1.5 text-xs font-black uppercase tracking-[0.15em]">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-black mb-1 text-white uppercase tracking-tight">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-black tracking-tight text-white">{plan.price}</span>
                <span className="text-sm text-gray-500 ml-2">{plan.period}</span>
              </div>

              <div className="h-px bg-[#2a2a2a] mb-6" />

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center border-2 ${
                      feature.available
                        ? 'border-[#ff5722] bg-[#ff5722]/10 text-[#ff5722]'
                        : 'border-[#333] text-[#444]'
                    }`}>
                      <Check size={12} strokeWidth={4} />
                    </span>
                    <span className={feature.available ? 'text-gray-300' : 'text-gray-600'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePricingButtonClick(plan.name)}
                className={`w-full py-3.5 text-sm font-black uppercase tracking-wider transition-all border-b-4 active:border-b-0 active:mt-1 ${
                  plan.buttonPrimary
                    ? 'bg-[#ff5722] hover:bg-[#f4511e] text-white border-[#bf360c] hover:border-[#e64a19]'
                    : 'bg-[#222] hover:bg-[#2a2a2a] text-white border-[#111] hover:border-[#1a1a1a]'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="bg-[#121212] border-y border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-[#ff5722]" />
              <span className="font-mono text-xs text-[#ff5722] tracking-[0.2em] uppercase font-bold">
                Testimonials
              </span>
              <div className="w-6 h-px bg-[#ff5722]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-white uppercase">
              Trusted by engineers
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Used by process engineers, environmental specialists, and consultants worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="relative bg-gradient-to-b from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] p-7"
              >
                {/* Quote mark */}
                <div className="absolute top-5 right-5 text-[#ff5722]/20">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                </div>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed mt-4">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-5 border-t border-[#2a2a2a]">
                  <div className="w-10 h-10 bg-[#0d0d0d] border border-[#333] flex items-center justify-center text-xs font-black text-gray-400">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative bg-gradient-to-r from-[#ff5722] to-[#e64a19] p-12 md:p-16 text-center text-white overflow-hidden border-b-4 border-[#bf360c]">
          {/* Industrial pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              {[...Array(20)].map((_, i) => (
                <line key={i} x1={i * 20} y1="0" x2={i * 20} y2="200" stroke="white" strokeWidth="0.5" />
              ))}
              {[...Array(10)].map((_, i) => (
                <line key={i} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="white" strokeWidth="0.5" />
              ))}
            </svg>
          </div>

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight uppercase">
              Ready to work faster?
            </h2>
            <p className="text-white/80 max-w-lg mx-auto mb-8">
              Join engineers who stopped calculating manually and started designing.
              Free forever for basic use.
            </p>
            {isLoggedIn ? (
              <a
                href="#features"
                onClick={handleStartFreeClick}
                className="inline-flex items-center gap-2 bg-[#0d0d0d] text-white px-8 py-4 text-sm font-black uppercase tracking-wider hover:bg-black transition-all border-b-4 border-black active:border-b-0 active:mt-1"
              >
                Explore Tools
                <ArrowRight size={16} />
              </a>
            ) : (
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-[#0d0d0d] text-white px-8 py-4 text-sm font-black uppercase tracking-wider hover:bg-black transition-all border-b-4 border-black active:border-b-0 active:mt-1"
              >
                Get Started Free
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Disclaimer */}
          <div className="bg-[#111] border border-[#2a2a2a] p-6 mb-12">
            <h4 className="text-sm font-black mb-3 flex items-center gap-2 text-[#ff5722] uppercase tracking-tight">
              <AlertTriangle size={16} />
              Disclaimer
            </h4>
            <div className="text-xs text-gray-500 space-y-2 leading-relaxed">
              <p>
                The calculators and tools provided on this website are for <strong className="text-gray-300">informational and reference purposes only</strong>.
              </p>
              <p>
                While every effort has been made to ensure accuracy based on recognized engineering standards (ISO 5167, ISO 12241, EPA, EU IED),
                <strong className="text-gray-300"> Burner-Design-Pro makes no warranty or guarantee</strong> regarding the accuracy, reliability, or applicability of the results.
              </p>
              <p className="text-[#ff5722] font-bold">
                All results should be reviewed and validated by a qualified professional engineer before application to any real-world project.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Features</a>
                <a href="#pricing" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Pricing</a>
                <Link to="/changelog" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Changelog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-4">Company</h4>
              <div className="space-y-3">
                <Link to="/about" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">About</Link>
                <Link to="/contact" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Contact</Link>
                <Link to="/faq" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">FAQ / Help</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-4">Legal</h4>
              <div className="space-y-3">
                <Link to="/privacy-policy" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Terms of Service</Link>
                <Link to="/refund-policy" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Refund Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500 mb-4">Support</h4>
              <div className="space-y-3">
                <Link to="/faq" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Help Center</Link>
                <Link to="/contact" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">Contact Us</Link>
                <a href="mailto:support@burnerdesignpro.com" className="block text-sm text-gray-400 hover:text-[#ff5722] transition-colors">
                  support@burnerdesignpro.com
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600 font-mono">
              © 2026 Burner-Design-Pro. Industrial-grade engineering tools.
            </p>
            <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em] uppercase font-bold">
              ISO · ASTM · EPA STANDARDS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
