import React from 'react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors">
          <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
        </Link>
        <div className="flex gap-8 items-center">
          <Link to="/" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
          <a href="/#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
          <a href="/#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">About Burner-Design-Pro</h1>
          <p className="text-[#bdc3c7] text-lg max-w-2xl mx-auto">
            Professional engineering tools for burner design, combustion analysis, and thermal calculation.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-12">
        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-[#2c3e50] mb-4">Our Mission</h2>
          <p className="text-[#555] leading-relaxed mb-4">
            Burner-Design-Pro was built by engineers, for engineers. We understand the challenges of designing, analyzing, and optimizing combustion systems in the real world.
          </p>
          <p className="text-[#555] leading-relaxed">
            Our mission is to provide professional-grade calculation tools that are <strong className="text-[#2c3e50]">accurate, fast, and easy to use</strong>. Every calculator is built on established engineering standards including ISO 5167, ISO 12241, ASTM C680, EPA regulations, and EU Industrial Emissions Directive (IED).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Accuracy First</h3>
            <p className="text-[#555]">Every formula and calculation is validated against published engineering standards and real-world test data.</p>
          </div>
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Fast & Intuitive</h3>
            <p className="text-[#555]">Get results instantly with our streamlined interface — no more manual spreadsheet calculations.</p>
          </div>
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Standards-Based</h3>
            <p className="text-[#555]">All calculations are documented with references to the underlying engineering standards and equations.</p>
          </div>
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-[#2c3e50] mb-2">Your Privacy Matters</h3>
            <p className="text-[#555]">We respect your data. Your calculation inputs and results are never shared with third parties.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-[#2c3e50] mb-6">Who Uses Burner-Design-Pro</h2>
          <div className="space-y-4 text-[#555]">
            <div className="flex gap-3">
              <span className="text-[#f39c12] font-semibold">🏭</span>
              <div>
                <strong className="text-[#2c3e50]">Process engineers</strong>
                <span className="block text-sm"> Designing and optimizing combustion systems in industrial facilities.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#f39c12] font-semibold">🌡️</span>
              <div>
                <strong className="text-[#2c3e50]">Thermal engineers</strong>
                <span className="block text-sm"> Performing heat transfer analysis and insulation specification.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#f39c12] font-semibold">🏢</span>
              <div>
                <strong className="text-[#2c3e50]">Building professionals</strong>
                <span className="block text-sm"> Estimating HVAC loads and selecting appropriate equipment.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-[#f39c12] font-semibold">🎓</span>
              <div>
                <strong className="text-[#2c3e50]">Students and researchers</strong>
                <span className="block text-sm"> Exploring combustion theory and validating academic projects.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-8">
          <h2 className="text-2xl font-semibold text-[#2c3e50] mb-6">Contact Us</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-[#f39c12] text-2xl">📧</span>
              <div>
                <p className="text-sm text-[#7f8c8d]">Email</p>
                <a href="mailto:Support@burnerdesignpro.com" className="text-[#2c3e50] font-semibold hover:text-[#f39c12] transition-colors">
                  Support@burnerdesignpro.com
                </a>
              </div>
            </div>
            <p className="text-[#555] text-sm pt-4 border-t border-gray-200">
              We typically respond to inquiries within 1-2 business days. Your feedback helps us improve our tools and service.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-[#2c3e50] text-white py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center gap-8 mb-5 flex-wrap">
            <Link to="/" className="text-sm hover:text-white transition-colors">Home</Link>
            <Link to="/#features" className="text-sm hover:text-white transition-colors">Features</Link>
            <Link to="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm hover:text-white transition-colors">About</Link>
            <Link to="/privacy-policy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
            <a href="mailto:Support@burnerdesignpro.com" className="text-sm hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
        </div>
      </footer>
    </div>
  )
}
