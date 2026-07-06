import React from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowLeft, CreditCard, Clock, Shield } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'

export default function RefundPolicyPage() {
  useSEO({
    title: 'Refund Policy',
    description: 'Learn about our refund policy for Burner Design Pro subscriptions.',
  })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#f39c12]/20 rounded-full flex items-center justify-center">
              <RefreshCw className="text-[#f39c12]" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-semibold mb-4">Refund Policy</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            Last updated: July 6, 2026
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f39c12] hover:text-[#e67e22] mb-6 transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-4 flex items-center gap-2">
              <Clock className="text-[#f39c12]" size={24} />
              7-Day Money-Back Guarantee
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We're confident that Burner Design Pro will help you work faster and smarter. 
              That's why we offer a <strong>7-day money-back guarantee</strong> on all new subscriptions.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you're not completely satisfied with our service within the first 7 days of your subscription, 
              contact our support team for a full refund. No questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="text-[#f39c12]" size={24} />
              Eligibility for Refunds
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">✓ Refund Eligible</h3>
                <ul className="text-green-700 dark:text-green-400 space-y-1 text-sm">
                  <li>• New subscriptions within 7 days of purchase</li>
                  <li>• First-time subscribers (not applicable to renewals)</li>
                  <li>• Annual and monthly plans</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">✗ Not Eligible</h3>
                <ul className="text-red-700 dark:text-red-400 space-y-1 text-sm">
                  <li>• After the 7-day trial period</li>
                  <li>• Subscription renewals (you can cancel to prevent future charges)</li>
                  <li>• Partial months or days of service</li>
                  <li>• Accounts suspended or terminated for Terms of Service violations</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-4 flex items-center gap-2">
              <Shield className="text-[#f39c12]" size={24} />
              How to Request a Refund
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To request a refund, please follow these steps:
            </p>
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-3 ml-4">
              <li>
                <strong>Contact us</strong> at{' '}
                <a href="mailto:support@burnerdesignpro.com" className="text-[#f39c12] hover:text-[#e67e22]">
                  support@burnerdesignpro.com
                </a>
                {' '}with the subject line "Refund Request"
              </li>
              <li>Include your account email and order number (found in your confirmation email)</li>
              <li>Briefly tell us why you're requesting a refund (feedback helps us improve!)</li>
              <li>We'll process your refund within 3-5 business days</li>
            </ol>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Refunds are processed to the original payment method. Please allow 5-10 business days 
              for the refund to appear on your statement, depending on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-4">
              Cancellation vs. Refund
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">Cancellation</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Canceling your subscription stops future charges. You'll retain access until the 
                  end of your current billing period. No refund is issued for the remaining time.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">Refund</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  A refund returns your payment (in full or partial). Eligible only within the 
                  first 7 days of a new subscription.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-xl font-bold text-[#2c3e50] dark:text-white mb-4">Questions?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about our refund policy, please contact us at{' '}
              <a href="mailto:support@burnerdesignpro.com" className="text-[#f39c12] hover:text-[#e67e22]">
                support@burnerdesignpro.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
