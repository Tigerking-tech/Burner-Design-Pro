import { Link } from 'react-router-dom'
import { Flame, Mail, Shield, FileText, Users } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Burner<span className="text-blue-600 dark:text-blue-400">Design</span>Pro</span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 max-w-sm leading-relaxed">
              Professional thermal design and engineering calculation software for burner engineers.
              Deterministic, formula-based — not AI.
            </p>
            <div className="flex items-center gap-2 mt-4 text-slate-600 dark:text-slate-400">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@burnerdesignpro.com" className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                support@burnerdesignpro.com
              </a>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Users className="text-slate-400" size={16} />
              <span className="text-xs text-slate-500 dark:text-slate-500">Trusted by engineers worldwide</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/fuel-manager" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Fuel Manager
                </Link>
              </li>
              <li>
                <Link to="/emission" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Emission Analysis
                </Link>
              </li>
              <li>
                <Link to="/unit-converter" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Unit Converter
                </Link>
              </li>
              <li>
                <Link to="/orifice-calculator" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Orifice Calculator
                </Link>
              </li>
              <li>
                <Link to="/flame-temperature" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Flame Temperature
                </Link>
              </li>
              <li>
                <Link to="/insulation-calculator" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Insulation Calculator
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Changelog
                </Link>
              </li>
              <li>
                <Link to="/about" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/subscription" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              © {currentYear} Burner-Design-Pro. Professional tools for burner engineers.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-slate-400 dark:text-slate-500">ISO 5167 · ASTM C680 · EPA Standards</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
