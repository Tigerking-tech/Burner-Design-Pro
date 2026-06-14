import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authAPI } from '../services/api'
import { 
  Flame, 
  Leaf, 
  RefreshCw, 
  Gauge, 
  Thermometer, 
  BrickWall,
  AlertTriangle 
} from 'lucide-react'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  pro?: boolean
  to: string
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
    icon: <Flame size={48} />,
    to: '/fuel-manager'
  },
  {
    id: 'emission',
    title: 'Emission Analysis',
    description: 'NOx, CO, SO₂ emission calculations with EPA and EU IED compliance checking.',
    icon: <Leaf size={48} />,
    to: '/emission'
  },
  {
    id: 'conversion',
    title: 'Unit Conversion',
    description: 'Comprehensive unit converter for flow rate, pressure, temperature, and emissions.',
    icon: <RefreshCw size={48} />,
    to: '/unit-converter'
  },
  {
    id: 'orifice',
    title: 'Orifice Calculator',
    description: 'Design restricting or measuring orifice plates with ISO 5167 standard support.',
    icon: <Gauge size={48} />,
    pro: true,
    to: '/orifice-calculator'
  },
  {
    id: 'flame',
    title: 'Flame Temperature',
    description: 'Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations.',
    icon: <Thermometer size={48} />,
    pro: true,
    to: '/flame-temperature'
  },
  {
    id: 'insulation',
    title: 'Insulation Calculator',
    description: 'Calculate optimal insulation thickness for pipes and flat surfaces with ISO 12241 & ASTM C680 standards.',
    icon: <BrickWall size={48} />,
    pro: true,
    to: '/insulation-calculator'
  }
]

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
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
    period: '/month',
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

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoggedIn(authAPI.isAuthenticated())
    setIsAdmin(authAPI.isAdmin())
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    setIsLoggedIn(false)
    setIsAdmin(false)
    navigate('/')
  }

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-2xl font-semibold tracking-tight">
          <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
        </Link>
        <div className="flex gap-6 items-center">
          <a href="#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
          <a href="#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
          <a href="#about" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">About</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                  Admin
                </Link>
              )}
              <Link to="/account" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Login</Link>
              <Link to="/signup" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-semibold mb-6 leading-tight">
            Professional Thermal Design Tools<br/>for Burner Engineers
          </h1>
          <p className="text-lg text-[#bdc3c7] mb-8 max-w-2xl mx-auto">
            Accurate combustion calculations, emission analysis, and unit conversion for industrial applications.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            {isLoggedIn ? (
              <a
                href="#features"
                onClick={handleStartFreeClick}
                className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-8 py-4 rounded font-semibold text-lg transition-colors shadow-lg"
              >
                Get Started
              </a>
            ) : (
              <Link to="/signup" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-8 py-4 rounded font-semibold text-lg transition-colors shadow-lg">
                Get Started
              </Link>
            )}
            <a href="#pricing" className="border-2 border-[#7f8c8d] hover:border-white hover:bg-white/10 text-white px-8 py-4 rounded font-semibold text-lg transition-all">
              View Pricing
            </a>
          </div>
          <div className="text-[#95a5a6] text-sm">
            <span className="text-[#f39c12]">✓</span> Free plan available &nbsp;|&nbsp; 
            <span className="text-[#f39c12]">✓</span> No credit card required &nbsp;|&nbsp; 
            <span className="text-[#f39c12]">✓</span> Upgrade anytime
          </div>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="max-w-5xl mx-auto px-5 -mt-10 relative z-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-300 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🔥</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Combustion Tools</h3>
            <p className="text-[#7f8c8d] text-sm">Fuel management, flame temperature, orifice design - all in one place</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-300 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Emission Analysis</h3>
            <p className="text-[#7f8c8d] text-sm">NOx, CO, SO₂ calculations with industry-standard compliance checks</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-300 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🧱</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Insulation Design</h3>
            <p className="text-[#7f8c8d] text-sm">Optimal insulation thickness for pipes and flat surfaces per ISO/ASTM</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-semibold text-center text-[#2c3e50] mb-3">Simple, Transparent Pricing</h2>
        <p className="text-center text-[#7f8c8d] mb-12">Start free, upgrade when you need more</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg p-8 border text-center transition-shadow hover:shadow-lg ${
                plan.popular ? 'border-2 border-[#f39c12] relative' : 'border border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f39c12] text-white px-4 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-semibold text-[#2c3e50] mb-2">{plan.name}</h3>
              <div className="text-5xl font-bold text-[#2c3e50] mb-1">{plan.price}<span className="text-sm font-normal text-[#7f8c8d]">{plan.period}</span></div>
              <p className="text-[#7f8c8d] text-sm mb-6">{plan.description}</p>
              <ul className="text-left mb-6">
                {plan.features.map((feature, i) => (
                  <li 
                    key={i} 
                    className={`py-2 text-sm flex items-center gap-2 border-b border-gray-100 ${
                      feature.available ? 'text-[#555]' : 'text-[#bdc3c7]'
                    }`}
                  >
                    <span className={feature.available ? 'text-green-600 font-bold' : 'text-[#bdc3c7]'}>
                      {feature.available ? '✓' : '–'}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePricingButtonClick(plan.name)}
                className={`w-full py-3 rounded font-semibold text-sm transition-all ${
                plan.buttonPrimary 
                  ? 'bg-[#f39c12] hover:bg-[#e67e22] text-white shadow-md' 
                  : 'bg-gray-200 hover:bg-gray-300 text-[#2c3e50] border border-[#bdc3c7]'
              }`}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-semibold text-center text-[#2c3e50] mb-12">Everything You Need for Burner Design</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.to}
              className="bg-white rounded-lg p-6 border border-gray-300 hover:shadow-lg transition-shadow group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#f39c12] to-[#e67e22] rounded-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                {React.cloneElement(feature.icon as React.ReactElement, { className: 'text-white' })}
              </div>
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-2 flex items-center">
                {feature.title}
                {feature.pro && (
                  <span className="ml-2 bg-[#f39c12] text-white px-2 py-0.5 rounded text-xs font-semibold">PRO</span>
                )}
              </h3>
              <p className="text-[#7f8c8d] text-sm leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* One-Stop Workflow Advantage */}
      <section className="bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">Why Choose Burner-Design-Pro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">All-in-One Platform</h3>
              <p className="text-[#bdc3c7] text-sm">
                No more switching between multiple websites. Fuel calculations, emissions analysis, 
                orifice design, and compliance reports - everything in one place.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Professional Workflow</h3>
              <p className="text-[#bdc3c7] text-sm">
                From fuel selection to combustion calculations to emission compliance - 
                complete your entire engineering workflow seamlessly.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-3">Standards Compliant</h3>
              <p className="text-[#bdc3c7] text-sm">
                All calculations follow international standards: ISO 5167, ISO 12241, 
                EPA, and EU IED. Professional reports for your projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-12 px-6 mt-20">
        <div className="max-w-5xl mx-auto">
          {/* Disclaimer Section */}
          <div className="bg-[#34495e] rounded-lg p-6 mb-8 text-left border border-[#4a5d6e]">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" size={18} />
              Disclaimer
            </h4>
            <div className="text-xs text-[#95a5a6] space-y-2 leading-relaxed">
              <p>
                The calculators and tools provided on this website are for <strong className="text-white">informational and reference purposes only</strong>.
              </p>
              <p>
                While every effort has been made to ensure accuracy based on recognized engineering standards (ISO 5167, ISO 12241, EPA, EU IED), 
                <strong className="text-white"> Burner-Design-Pro makes no warranty or guarantee</strong> regarding the accuracy, reliability, or applicability of the results.
              </p>
              <p className="text-yellow-500">
                ⚠️ <strong className="text-yellow-400">All results should be reviewed and validated by a qualified professional engineer</strong> before application to any real-world project.
              </p>
              <p className="text-red-400">
                ⚠️ <strong className="text-red-300">Burner-Design-Pro shall not be liable</strong> for any direct, indirect, incidental, special, or consequential damages arising from the use of these calculators.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex justify-center gap-8 mb-5 flex-wrap">
            <a href="#features" className="text-sm hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-sm hover:text-white transition-colors">About</a>
            <Link to="/privacy-policy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
            <a href="#contact" className="text-sm hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
        </div>
      </footer>
    </div>
  )
}
