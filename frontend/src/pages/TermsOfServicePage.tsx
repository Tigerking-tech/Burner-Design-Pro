import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { authAPI } from '../services/api'

export default function TermsOfService() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    setIsLoggedIn(authAPI.isAuthenticated())
    setIsAdmin(authAPI.isAdmin())
  }, [])
  const handleLogout = () => {
    authAPI.logout()
    navigate('/')
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors">
          <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
        </Link>
        <div className="flex gap-8 items-center">
          {isLoggedIn ? (
            <>
              {isAdmin && <Link to="/admin" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Admin</Link>}
              <Link to="/account" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Account</Link>
              <button onClick={handleLogout} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Logout</button>
            </>
          ) : (
            <Link to="/login" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md">
              Get Started
            </Link>
          )}
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">Terms of Service</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            Last updated: May 30, 2026
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f39c12] hover:text-[#e67e22] mb-6 transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Important Disclaimer Notice */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-800 text-lg mb-2">Important Disclaimer</h3>
              <p className="text-red-700 text-sm">
                The calculators and tools provided on this website are for <strong>informational and reference purposes only</strong>. 
                All results should be reviewed and validated by a qualified professional engineer before application to any real-world project. 
                <strong> Burner-Design-Pro shall not be liable</strong> for any damages arising from the use of these calculators.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Burner-Design-Pro ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Burner-Design-Pro provides online engineering calculators and tools for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fuel management and combustion calculations</li>
              <li>Emission analysis (NOx, CO, SO₂)</li>
              <li>Orifice plate calculations</li>
              <li>Unit conversions</li>
              <li>Insulation calculations</li>
              <li>Flame temperature calculations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              All calculations are based on recognized engineering standards including but not limited to ISO 5167, ISO 12241, 
              EPA regulations, and EU IED directives.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">3. Disclaimer of Warranties</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
              <p className="text-yellow-800 font-semibold mb-2">⚠️ Important Warning</p>
              <p className="text-yellow-700 text-sm">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Burner-Design-Pro makes no warranty or guarantee regarding the accuracy, reliability, completeness, 
              or timeliness of any calculations or results. The user acknowledges that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-4">
              <li>Engineering calculations require professional judgment and validation</li>
              <li>Actual results may differ from calculated values due to real-world conditions</li>
              <li>Standards and regulations may change over time</li>
              <li>Input data must be verified by qualified personnel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">4. Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">⚠️ Liability Limitation</p>
              <p className="text-red-700 text-sm">
                IN NO EVENT SHALL BURNER-DESIGN-PRO, ITS OPERATORS, AFFILIATES, OR CONTRIBUTORS BE LIABLE FOR ANY 
                DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              This includes, but is not limited to, damages for loss of profits, goodwill, use, data, or other 
              intangible losses, even if we have been advised of the possibility of such damages, arising from:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-4">
              <li>Use or inability to use the Service</li>
              <li>Any errors, mistakes, or inaccuracies in calculations</li>
              <li>Unauthorized access to your data</li>
              <li>Any reliance placed on calculations for engineering decisions</li>
              <li>Any loss of data or business opportunities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">5. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By using the Service, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate and complete input data</li>
              <li>Verify all calculations with independent sources</li>
              <li>Consult qualified professional engineers before making engineering decisions</li>
              <li>Ensure compliance with applicable local regulations and codes</li>
              <li>Accept full responsibility for any decisions made based on calculation results</li>
              <li>Not use the Service for safety-critical or life-threatening applications without proper professional oversight</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">6. Professional Engineering Judgment</h2>
            <p className="text-gray-700 leading-relaxed">
              Engineering calculations require professional judgment, site-specific knowledge, and consideration 
              of multiple factors that may not be fully captured by any calculator. The Service should be used as 
              a tool to assist qualified professionals, not as a replacement for professional engineering services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Users are strongly advised to:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
              <li>Have all calculations reviewed by a licensed professional engineer</li>
              <li>Verify results against manufacturer specifications</li>
              <li>Consider safety factors appropriate for the application</li>
              <li>Perform field validation and testing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">7. Subscription and Payment</h2>
            <p className="text-gray-700 leading-relaxed">
              Subscription fees are charged for access to premium features. Refunds are not provided for partial 
              months of service. Users may cancel their subscription at any time through their account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective 
              immediately upon posting on the website. Continued use of the Service after changes constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with applicable laws. 
              Any disputes arising from the use of this Service shall be resolved through appropriate legal channels.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">10. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For questions regarding these Terms of Service, billing, or technical support, please contact us at:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700"><strong>Email:</strong> support@burnerdesignpro.com</p>
              <p className="text-gray-700 mt-2"><strong>Response time:</strong> We aim to respond within 3-5 business days</p>
            </div>
          </section>

          <div className="bg-gray-100 rounded-lg p-6 mt-8">
            <p className="text-sm text-gray-600">
              <strong>Summary:</strong> These calculators are tools to assist professional engineers. 
              <strong> You are solely responsible</strong> for verifying results and consulting qualified 
              professionals before making any engineering decisions. Burner-Design-Pro is not liable for 
              any damages resulting from the use of these calculators.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
