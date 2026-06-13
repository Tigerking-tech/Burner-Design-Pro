import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Eye, Lock, Database } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors">
          <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
        </Link>
        <div className="flex gap-8 items-center">
          <Link to="/" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
          <Link to="/#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</Link>
          <Link to="/#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</Link>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">Privacy Policy</h1>
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

        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4 flex items-center gap-2">
              <Eye className="text-[#f39c12]" size={24} />
              Information We Collect
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, name, and password when you register</li>
              <li><strong>Payment Information:</strong> Billing address and payment details (processed securely through third-party payment providers)</li>
              <li><strong>Calculation Data:</strong> Input values and results from your calculations (stored for your convenience)</li>
              <li><strong>Usage Data:</strong> Information about how you use our Service, including calculation history and feature usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4 flex items-center gap-2">
              <Database className="text-[#f39c12]" size={24} />
              How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Store your calculation history and preferences</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4 flex items-center gap-2">
              <Lock className="text-[#f39c12]" size={24} />
              Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of 
              transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee 
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide 
              you services. You may request deletion of your account and associated data at any time by 
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our Service</li>
              <li>Authenticate your account and prevent unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              We may use third-party services for payment processing, analytics, and cloud infrastructure. 
              These services have their own privacy policies governing their use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for children under 18 years of age. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, our data practices, or wish to exercise your rights,
              please contact us at:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
              <p className="text-gray-700"><strong>Email:</strong> support@burnerdesignpro.com</p>
              <p className="text-gray-700 mt-2"><strong>Response time:</strong> We aim to respond within 3-5 business days</p>
            </div>
          </section>

          <div className="bg-blue-50 rounded-lg p-6 mt-8">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Shield size={20} />
              Our Commitment
            </h3>
            <p className="text-blue-700 text-sm">
              We are committed to protecting your privacy and being transparent about how we collect 
              and use your data. Your trust is important to us.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
