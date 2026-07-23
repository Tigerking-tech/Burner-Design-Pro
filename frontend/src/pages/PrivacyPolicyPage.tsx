import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Eye, Lock, Database } from 'lucide-react'
import { Navbar } from '../components/Navbar'

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: May 30, 2026
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-10 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="text-blue-600 dark:text-blue-400" size={22} />
              Information We Collect
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, name, and password when you register</li>
              <li><strong>Payment Information:</strong> Billing address and payment details (processed securely through third-party payment providers)</li>
              <li><strong>Calculation Data:</strong> Input values and results from your calculations (stored for your convenience)</li>
              <li><strong>Usage Data:</strong> Information about how you use our Service, including calculation history and feature usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Database className="text-blue-600 dark:text-blue-400" size={22} />
              How We Use Your Information
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Store your calculation history and preferences</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="text-blue-600 dark:text-blue-400" size={22} />
              Data Security
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of 
              transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee 
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Data Retention</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide 
              you services. You may request deletion of your account and associated data at any time by 
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Cookies and Tracking</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our Service</li>
              <li>Authenticate your account and prevent unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Third-Party Services</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We may use third-party services for payment processing, analytics, and cloud infrastructure. 
              These services have their own privacy policies governing their use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Rights</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Children's Privacy</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Our Service is not intended for children under 18 years of age. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Changes to This Policy</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              If you have any questions about this Privacy Policy, our data practices, or wish to exercise your rights,
              please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-5 mt-4">
              <p className="text-slate-700 dark:text-slate-300"><strong>Email:</strong> support@burnerdesignpro.com</p>
              <p className="text-slate-700 dark:text-slate-300 mt-2"><strong>Response time:</strong> We aim to respond within 3-5 business days</p>
            </div>
          </section>

          <div className="bg-blue-500/10 dark:bg-blue-500/10 rounded-xl p-6 mt-8 border border-blue-500/20 dark:border-blue-500/20">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Shield size={20} />
              Our Commitment
            </h3>
            <p className="text-blue-800 dark:text-blue-300/80 text-sm">
              We are committed to protecting your privacy and being transparent about how we collect 
              and use your data. Your trust is important to us.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
