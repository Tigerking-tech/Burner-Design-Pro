import React from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ArrowLeft, CreditCard, Clock, Shield, ArrowRight } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'

export default function RefundPolicyPage() {
  useSEO({
    title: 'Refund Policy',
    description: 'Learn about our refund policy for Burner Design Pro subscriptions.',
  })

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
            Refund Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: July 6, 2026
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-10 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="text-blue-600 dark:text-blue-400" size={22} />
              7-Day Money-Back Guarantee
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              We're confident that Burner Design Pro will help you work faster and smarter. 
              That's why we offer a <strong>7-day money-back guarantee</strong> on all new subscriptions.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              If you're not completely satisfied with our service within the first 7 days of your subscription, 
              contact our support team for a full refund. No questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="text-blue-600 dark:text-blue-400" size={22} />
              Eligibility for Refunds
            </h2>
            <div className="space-y-4">
              <div className="bg-emerald-500/10 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/20 dark:border-emerald-500/20">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">✓ Refund Eligible</h3>
                <ul className="text-emerald-700 dark:text-emerald-300/80 space-y-1.5 text-sm">
                  <li>• New subscriptions within 7 days of purchase</li>
                  <li>• First-time subscribers (not applicable to renewals)</li>
                  <li>• Annual and monthly plans</li>
                </ul>
              </div>
              <div className="bg-red-500/10 dark:bg-red-500/10 p-5 rounded-xl border border-red-500/20 dark:border-red-500/20">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">✗ Not Eligible</h3>
                <ul className="text-red-700 dark:text-red-300/80 space-y-1.5 text-sm">
                  <li>• After the 7-day trial period</li>
                  <li>• Subscription renewals (you can cancel to prevent future charges)</li>
                  <li>• Partial months or days of service</li>
                  <li>• Accounts suspended or terminated for Terms of Service violations</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="text-blue-600 dark:text-blue-400" size={22} />
              How to Request a Refund
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              To request a refund, please follow these steps:
            </p>
            <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-3 ml-4">
              <li>
                <strong>Contact us</strong> at{' '}
                <a href="mailto:support@burnerdesignpro.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  support@burnerdesignpro.com
                </a>
                {' '}with the subject line "Refund Request"
              </li>
              <li>Include your account email and order number (found in your confirmation email)</li>
              <li>Briefly tell us why you're requesting a refund (feedback helps us improve!)</li>
              <li>We'll process your refund within 3-5 business days</li>
            </ol>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
              Refunds are processed to the original payment method. Please allow 5-10 business days 
              for the refund to appear on your statement, depending on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Cancellation vs. Refund
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cancellation</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Canceling your subscription stops future charges. You'll retain access until the 
                  end of your current billing period. No refund is issued for the remaining time.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Refund</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  A refund returns your payment (in full or partial). Eligible only within the 
                  first 7 days of a new subscription.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 dark:border-white/5 pt-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Questions?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              If you have any questions about our refund policy, please contact us at{' '}
              <a href="mailto:support@burnerdesignpro.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                support@burnerdesignpro.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
