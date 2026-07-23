import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Navbar } from '../components/Navbar'

export default function TermsOfService() {
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
              Legal
            </span>
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: May 30, 2026
          </p>
        </div>

        {/* Important Disclaimer Notice */}
        <div className="bg-red-500/10 dark:bg-red-500/10 border-l-4 border-red-500 rounded-r-2xl rounded-l-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-300 text-lg mb-2">Important Disclaimer</h3>
              <p className="text-red-800 dark:text-red-300/80 text-sm">
                The calculators and tools provided on this website are for <strong>informational and reference purposes only</strong>. 
                All results should be reviewed and validated by a qualified professional engineer before application to any real-world project. 
                <strong> Burner-Design-Pro shall not be liable</strong> for any damages arising from the use of these calculators.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-10 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              By accessing and using Burner-Design-Pro ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Description of Service</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Burner-Design-Pro provides online engineering calculators and tools for:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
              <li>Fuel management and combustion calculations</li>
              <li>Emission analysis (NOx, CO, SO₂)</li>
              <li>Orifice plate calculations</li>
              <li>Unit conversions</li>
              <li>Insulation calculations</li>
              <li>Flame temperature calculations</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
              All calculations are based on recognized engineering standards including but not limited to ISO 5167, ISO 12241, 
              EPA regulations, and EU IED directives.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Disclaimer of Warranties</h2>
            <div className="bg-amber-500/10 dark:bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl mb-4">
              <p className="text-amber-900 dark:text-amber-300 font-semibold mb-2">⚠️ Important Warning</p>
              <p className="text-amber-800 dark:text-amber-300/80 text-sm">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED.
              </p>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Burner-Design-Pro makes no warranty or guarantee regarding the accuracy, reliability, completeness, 
              or timeliness of any calculations or results. The user acknowledges that:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4 mt-4">
              <li>Engineering calculations require professional judgment and validation</li>
              <li>Actual results may differ from calculated values due to real-world conditions</li>
              <li>Standards and regulations may change over time</li>
              <li>Input data must be verified by qualified personnel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Limitation of Liability</h2>
            <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-red-900 dark:text-red-300 font-semibold mb-2">⚠️ Liability Limitation</p>
              <p className="text-red-800 dark:text-red-300/80 text-sm">
                IN NO EVENT SHALL BURNER-DESIGN-PRO, ITS OPERATORS, AFFILIATES, OR CONTRIBUTORS BE LIABLE FOR ANY 
                DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
              </p>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              This includes, but is not limited to, damages for loss of profits, goodwill, use, data, or other 
              intangible losses, even if we have been advised of the possibility of such damages, arising from:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4 mt-4">
              <li>Use or inability to use the Service</li>
              <li>Any errors, mistakes, or inaccuracies in calculations</li>
              <li>Unauthorized access to your data</li>
              <li>Any reliance placed on calculations for engineering decisions</li>
              <li>Any loss of data or business opportunities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. User Responsibilities</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              By using the Service, you agree to:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
              <li>Provide accurate and complete input data</li>
              <li>Verify all calculations with independent sources</li>
              <li>Consult qualified professional engineers before making engineering decisions</li>
              <li>Ensure compliance with applicable local regulations and codes</li>
              <li>Accept full responsibility for any decisions made based on calculation results</li>
              <li>Not use the Service for safety-critical or life-threatening applications without proper professional oversight</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Professional Engineering Judgment</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Engineering calculations require professional judgment, site-specific knowledge, and consideration 
              of multiple factors that may not be fully captured by any calculator. The Service should be used as 
              a tool to assist qualified professionals, not as a replacement for professional engineering services.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
              <strong>Users are strongly advised to:</strong>
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4 mt-2">
              <li>Have all calculations reviewed by a licensed professional engineer</li>
              <li>Verify results against manufacturer specifications</li>
              <li>Consider safety factors appropriate for the application</li>
              <li>Perform field validation and testing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">7. Subscription and Payment</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Subscription fees are charged for access to premium features. Refunds are not provided for partial 
              months of service. Users may cancel their subscription at any time through their account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">8. Changes to Terms</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective 
              immediately upon posting on the website. Continued use of the Service after changes constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">9. Governing Law</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with applicable laws. 
              Any disputes arising from the use of this Service shall be resolved through appropriate legal channels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">10. Contact Information</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              For questions regarding these Terms of Service, billing, or technical support, please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-5">
              <p className="text-slate-700 dark:text-slate-300"><strong>Email:</strong> support@burnerdesignpro.com</p>
              <p className="text-slate-700 dark:text-slate-300 mt-2"><strong>Response time:</strong> We aim to respond within 3-5 business days</p>
            </div>
          </section>

          <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-6 mt-8 border border-slate-200 dark:border-white/5">
            <p className="text-sm text-slate-600 dark:text-slate-400">
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
