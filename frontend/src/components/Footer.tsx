import { Link } from 'react-router-dom'
import { Flame, Mail, Shield, FileText } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#2c3e50] dark:bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-xl font-semibold mb-4">
              <Flame className="w-6 h-6 text-[#f39c12]" />
              <span>Burner-Design-Pro</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Professional thermal design and engineering calculation software for burner engineers.
              Deterministic, formula-based — not AI.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@burnerdesignpro.com" className="hover:text-white transition-colors">
                support@burnerdesignpro.com
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/fuel-manager" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Fuel Manager
                </Link>
              </li>
              <li>
                <Link to="/emission" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Emission Analysis
                </Link>
              </li>
              <li>
                <Link to="/unit-converter" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Unit Converter
                </Link>
              </li>
              <li>
                <Link to="/orifice-calculator" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Orifice Calculator
                </Link>
              </li>
              <li>
                <Link to="/flame-temperature" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Flame Temperature
                </Link>
              </li>
              <li>
                <Link to="/insulation-calculator" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Insulation Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Changelog
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/subscription" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Burner Design Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-500 text-xs">
            <span>Made with 🔥 for engineers</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
