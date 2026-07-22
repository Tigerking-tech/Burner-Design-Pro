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
  Quote
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
    icon: <Flame size={32} />,
    to: '/fuel-manager',
    category: 'COMBUSTION'
  },
  {
    id: 'emission',
    title: 'Emission Analysis',
    description: 'NOx, CO, SO₂ emission calculations with EPA and EU IED compliance checking.',
    icon: <Leaf size={32} />,
    to: '/emission',
    category: 'COMPLIANCE'
  },
  {
    id: 'conversion',
    title: 'Unit Conversion',
    description: 'Comprehensive unit converter for flow rate, pressure, temperature, and emissions.',
    icon: <RefreshCw size={32} />,
    to: '/unit-converter',
    category: 'UTILITY'
  },
  {
    id: 'orifice',
    title: 'Orifice Calculator',
    description: 'Design restricting or measuring orifice plates with ISO 5167 standard support.',
    icon: <Gauge size={32} />,
    pro: true,
    to: '/orifice-calculator',
    category: 'FLOW'
  },
  {
    id: 'flame',
    title: 'Flame Temperature',
    description: 'Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations.',
    icon: <Thermometer size={32} />,
    pro: true,
    to: '/flame-temperature',
    category: 'THERMAL'
  },
  {
    id: 'insulation',
    title: 'Insulation Calculator',
    description: 'Calculate optimal insulation thickness for pipes and flat surfaces with ISO 12241 & ASTM C680.',
    icon: <BrickWall size={32} />,
    pro: true,
    to: '/insulation-calculator',
    category: 'THERMAL'
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
    <div className="min-h-screen bg-[#f5f6f7] dark:bg-gray-900">
      <Navbar />

      {/* === HERO SECTION === */}
      <section className="relative bg-[#1a252f] dark:bg-gray-950 text-white overflow-hidden">
        {/* Blueprint grid background */}
        <div className="absolute inset-0 blueprint-grid" />
        {/* Radial glow */}
        <div
          className="absolute inset-0 glow-pulse"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(243,156,18,0.12) 0%, transparent 60%)'
          }}
        />
        {/* Scanline effect */}
        <div className="scanline-effect" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          {/* Technical label */}
          <div className="stagger-1 inline-flex items-center gap-2 mb-8 border border-[#f39c12]/30 rounded-full px-4 py-1.5 bg-[#f39c12]/5">
            <span className="w-2 h-2 rounded-full bg-[#f39c12] animate-pulse" />
            <span className="font-mono-tech text-xs text-[#f39c12] tracking-widest uppercase">
              ISO 5167 · ISO 12241 · ASTM C680 · EPA · EU IED
            </span>
          </div>

          <h1 className="stagger-2 font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] uppercase tracking-tight">
            Thermal Design Tools<br />
            <span className="text-[#f39c12]">for Burner Engineers</span>
          </h1>

          <p className="stagger-3 text-base md:text-lg text-[#8b9bad] mb-10 max-w-2xl mx-auto leading-relaxed">
            Deterministic, formula-based combustion calculations, emission analysis, and
            unit conversion — built for industrial applications, not guessing.
          </p>

          <div className="stagger-4 flex flex-col sm:flex-row gap-4 justify-center mb-10">
            {isLoggedIn ? (
              <a
                href="#features"
                onClick={handleStartFreeClick}
                className="group bg-[#f39c12] hover:bg-[#e67e22] text-[#1a252f] px-8 py-4 rounded-sm font-display font-semibold text-base uppercase tracking-wide transition-all shadow-[0_4px_20px_rgba(243,156,18,0.3)] hover:shadow-[0_6px_30px_rgba(243,156,18,0.4)] flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <Link
                to="/signup"
                className="group bg-[#f39c12] hover:bg-[#e67e22] text-[#1a252f] px-8 py-4 rounded-sm font-display font-semibold text-base uppercase tracking-wide transition-all shadow-[0_4px_20px_rgba(243,156,18,0.3)] hover:shadow-[0_6px_30px_rgba(243,156,18,0.4)] flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a
              href="#pricing"
              className="border border-[#3d5266] hover:border-[#f39c12] hover:bg-[#f39c12]/5 text-white px-8 py-4 rounded-sm font-display font-semibold text-base uppercase tracking-wide transition-all flex items-center justify-center"
            >
              View Pricing
            </a>
          </div>

          {/* Trust indicators */}
          <div className="stagger-5 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono-tech text-xs text-[#5d7385]">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-[#f39c12]" /> Free plan available
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-[#f39c12]" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-[#f39c12]" /> Upgrade anytime
            </span>
          </div>
        </div>

        {/* Bottom transition line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f39c12]/40 to-transparent" />
      </section>

      {/* === PRODUCT HIGHLIGHTS === */}
      <section className="max-w-5xl mx-auto px-5 -mt-12 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <Flame size={24} />, title: 'Combustion Tools', desc: 'Fuel management, flame temperature, orifice design — all in one place', num: '01' },
            { icon: <Leaf size={24} />, title: 'Emission Analysis', desc: 'NOx, CO, SO₂ calculations with industry-standard compliance checks', num: '02' },
            { icon: <BrickWall size={24} />, title: 'Insulation Design', desc: 'Optimal insulation thickness for pipes and flat surfaces per ISO/ASTM', num: '03' }
          ].map((item, i) => (
            <div
              key={i}
              className={`industrial-card stagger-${i + 2} bg-white dark:bg-gray-800 dark:border-gray-700 rounded-sm p-7 shadow-sm border border-gray-200 relative overflow-hidden`}
            >
              <span className="corner-mark tl" />
              <span className="corner-mark tr" />
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 bg-[#1a252f] dark:bg-gray-700 rounded-sm flex items-center justify-center text-[#f39c12]">
                  {item.icon}
                </div>
                <span className="font-mono-tech text-2xl font-bold text-gray-200 dark:text-gray-700">{item.num}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#1a252f] dark:text-white mb-2 uppercase tracking-wide">{item.title}</h3>
              <p className="text-[#7f8c8d] dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section id="features" className="max-w-5xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <span className="font-mono-tech text-xs text-[#f39c12] tracking-widest uppercase mb-3 block">
            // 06 Integrated Tools
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a252f] dark:text-white uppercase tracking-tight">
            Everything You Need for Burner Design
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <Link
              key={feature.id}
              to={feature.to}
              className={`stagger-${Math.min(i + 1, 6)} industrial-card bg-white dark:bg-gray-800 rounded-sm p-7 border border-gray-200 dark:border-gray-700 group block relative overflow-hidden`}
            >
              <span className="corner-mark tl" />
              <span className="corner-mark br" />
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1a252f] to-[#2c3e50] dark:from-gray-700 dark:to-gray-600 rounded-sm flex items-center justify-center text-[#f39c12] group-hover:from-[#f39c12] group-hover:to-[#e67e22] group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                {feature.pro ? (
                  <span className="font-mono-tech text-[10px] bg-[#f39c12] text-[#1a252f] px-2 py-0.5 rounded-sm font-bold tracking-wider">PRO</span>
                ) : (
                  <span className="font-mono-tech text-[10px] text-gray-400 dark:text-gray-500 tracking-wider">FREE</span>
                )}
              </div>
              <span className="font-mono-tech text-[10px] text-[#f39c12] tracking-widest uppercase block mb-1">{feature.category}</span>
              <h3 className="font-display text-lg font-semibold text-[#1a252f] dark:text-white mb-2 uppercase tracking-wide">{feature.title}</h3>
              <p className="text-[#7f8c8d] dark:text-gray-400 text-sm leading-relaxed mb-4">{feature.description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-mono-tech text-[#f39c12] group-hover:gap-2 transition-all">
                Open Tool <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* === PRICING SECTION === */}
      <section id="pricing" className="bg-white dark:bg-gray-800/50 py-20">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="font-mono-tech text-xs text-[#f39c12] tracking-widest uppercase mb-3 block">
              // Pricing
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a252f] dark:text-white uppercase tracking-tight mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-[#7f8c8d] dark:text-gray-400 text-sm">Start free, upgrade when you need more</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-[#f9fafb] dark:bg-gray-800 rounded-sm p-8 border transition-all relative overflow-hidden ${
                  plan.popular
                    ? 'border-2 border-[#f39c12] shadow-[0_8px_40px_rgba(243,156,18,0.12)]'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <>
                    <span className="corner-mark tl" style={{ borderColor: '#f39c12' }} />
                    <span className="corner-mark tr" style={{ borderColor: '#f39c12' }} />
                    <span className="corner-mark bl" style={{ borderColor: '#f39c12' }} />
                    <span className="corner-mark br" style={{ borderColor: '#f39c12' }} />
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-[#f39c12] text-[#1a252f] px-5 py-1 rounded-b-sm font-mono-tech text-[10px] font-bold tracking-widest uppercase">
                      Most Popular
                    </div>
                  </>
                )}
                <h3 className="font-display text-xl font-semibold text-[#1a252f] dark:text-white mb-1 uppercase tracking-wide">{plan.name}</h3>
                <p className="text-[#7f8c8d] dark:text-gray-400 text-xs mb-5">{plan.description}</p>
                <div className="flex items-baseline mb-1">
                  <span className="font-mono-tech text-5xl font-bold text-[#1a252f] dark:text-white">{plan.price}</span>
                  <span className="font-mono-tech text-sm text-[#7f8c8d] dark:text-gray-400 ml-1">{plan.period}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6" />
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className={`flex-shrink-0 w-4 h-4 rounded-sm flex items-center justify-center ${feature.available ? 'bg-[#f39c12] text-[#1a252f]' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span className={feature.available ? 'text-[#555] dark:text-gray-300' : 'text-[#bdc3c7] dark:text-gray-500'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePricingButtonClick(plan.name)}
                  className={`w-full py-3.5 rounded-sm font-display font-semibold text-sm uppercase tracking-wide transition-all ${
                    plan.buttonPrimary
                      ? 'bg-[#f39c12] hover:bg-[#e67e22] text-[#1a252f] shadow-[0_4px_15px_rgba(243,156,18,0.25)]'
                      : 'bg-[#1a252f] hover:bg-[#2c3e50] text-white dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <span className="font-mono-tech text-xs text-[#f39c12] tracking-widest uppercase mb-3 block">
            // User Feedback
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a252f] dark:text-white uppercase tracking-tight">
            Trusted by Engineers Worldwide
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`stagger-${i + 1} industrial-card bg-white dark:bg-gray-800 rounded-sm p-7 border border-gray-200 dark:border-gray-700 relative`}
            >
              <Quote size={28} className="text-[#f39c12]/30 mb-4" />
              <p className="text-[#555] dark:text-gray-300 text-sm mb-6 leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-sm bg-[#1a252f] dark:bg-gray-700 flex items-center justify-center text-[#f39c12] font-mono-tech text-xs font-bold tracking-wider">
                  {t.initials}
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-[#1a252f] dark:text-white uppercase tracking-wide">{t.name}</p>
                  <p className="font-mono-tech text-[10px] text-[#7f8c8d] dark:text-gray-400 tracking-wide">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === WORKFLOW ADVANTAGE === */}
      <section className="relative bg-[#1a252f] dark:bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 blueprint-grid opacity-50" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <span className="font-mono-tech text-xs text-[#f39c12] tracking-widest uppercase mb-3 block">
            // Why Burner-Design-Pro
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 uppercase tracking-tight">
            One Platform. Complete Workflow.
          </h2>
          <p className="text-[#8b9bad] text-sm max-w-xl mx-auto mb-14">
            Stop juggling spreadsheets and reference manuals. Everything from fuel selection to compliance reporting in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'All-in-One Platform', desc: 'No more switching between multiple websites. Fuel calculations, emissions analysis, orifice design, and compliance reports — everything in one place.' },
              { num: '02', title: 'Professional Workflow', desc: 'From fuel selection to combustion calculations to emission compliance — complete your entire engineering workflow seamlessly.' },
              { num: '03', title: 'Standards Compliant', desc: 'All calculations follow international standards: ISO 5167, ISO 12241, EPA, and EU IED. Professional reports for your projects.' }
            ].map((item, i) => (
              <div
                key={i}
                className={`stagger-${i + 1} relative bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm rounded-sm p-7 text-left border border-white/10`}
              >
                <span className="font-mono-tech text-3xl font-bold text-[#f39c12]/30 mb-3 block">{item.num}</span>
                <h3 className="font-display text-lg font-semibold mb-3 uppercase tracking-wide">{item.title}</h3>
                <p className="text-[#8b9bad] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-[#0f1820] text-[#8b9bad] py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Disclaimer */}
          <div className="bg-white/5 rounded-sm p-6 mb-8 border border-white/10">
            <h4 className="text-white font-display font-semibold mb-3 flex items-center gap-2 uppercase tracking-wide text-sm">
              <AlertTriangle className="text-[#f39c12]" size={16} />
              Disclaimer
            </h4>
            <div className="font-mono-tech text-xs text-[#5d7385] space-y-2 leading-relaxed">
              <p>
                The calculators and tools provided on this website are for <strong className="text-white">informational and reference purposes only</strong>.
              </p>
              <p>
                While every effort has been made to ensure accuracy based on recognized engineering standards (ISO 5167, ISO 12241, EPA, EU IED),
                <strong className="text-white"> Burner-Design-Pro makes no warranty or guarantee</strong> regarding the accuracy, reliability, or applicability of the results.
              </p>
              <p className="text-[#f39c12]">
                All results should be reviewed and validated by a qualified professional engineer before application to any real-world project.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-xs uppercase tracking-widest">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm hover:text-[#f39c12] transition-colors">Features</a>
                <a href="#pricing" className="block text-sm hover:text-[#f39c12] transition-colors">Pricing</a>
                <Link to="/changelog" className="block text-sm hover:text-[#f39c12] transition-colors">Changelog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-xs uppercase tracking-widest">Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm hover:text-[#f39c12] transition-colors">About</Link>
                <Link to="/contact" className="block text-sm hover:text-[#f39c12] transition-colors">Contact</Link>
                <Link to="/faq" className="block text-sm hover:text-[#f39c12] transition-colors">FAQ / Help</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-xs uppercase tracking-widest">Legal</h4>
              <div className="space-y-2">
                <Link to="/privacy-policy" className="block text-sm hover:text-[#f39c12] transition-colors">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-sm hover:text-[#f39c12] transition-colors">Terms of Service</Link>
                <Link to="/refund-policy" className="block text-sm hover:text-[#f39c12] transition-colors">Refund Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-xs uppercase tracking-widest">Support</h4>
              <div className="space-y-2">
                <Link to="/faq" className="block text-sm hover:text-[#f39c12] transition-colors">Help Center</Link>
                <Link to="/contact" className="block text-sm hover:text-[#f39c12] transition-colors">Contact Us</Link>
                <a href="mailto:support@burnerdesignpro.com" className="block text-sm hover:text-[#f39c12] transition-colors">
                  support@burnerdesignpro.com
                </a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="font-mono-tech text-xs text-[#5d7385]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
            <p className="font-mono-tech text-[10px] text-[#3d5266] tracking-wider">BUILT WITH ISO · ASTM · EPA STANDARDS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
