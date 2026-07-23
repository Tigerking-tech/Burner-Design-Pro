import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ArrowLeft, MessageCircle, Mail, ChevronDown, ChevronUp, CreditCard, User, Settings, Zap, ArrowRight } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'

const faqCategories = [
  {
    icon: User,
    title: 'Account & Billing',
    faqs: [
      {
        question: 'How do I change my password?',
        answer: 'Go to your Account page, find the "Change Password" section, enter your current password and new password, then click "Change Password".'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to your Account page, scroll down to the "Danger Zone" section, click "Delete My Account", and follow the confirmation steps. This action is irreversible.'
      },
      {
        question: 'Can I export my data?',
        answer: 'Yes! Go to your Account page and find the "Export My Data" section. Click the button to download all your personal data in JSON format.'
      },
      {
        question: 'I forgot my password. What do I do?',
        answer: 'Click "Forgot password?" on the login page, enter your email address, and we will send you a password reset link. The link expires in 1 hour.'
      }
    ]
  },
  {
    icon: CreditCard,
    title: 'Subscriptions & Payments',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure payment processor, Creem.'
      },
      {
        question: 'Can I cancel anytime?',
        answer: 'Yes, you can cancel your subscription at any time. You will retain access until the end of your current billing period.'
      },
      {
        question: 'How do I view my invoices?',
        answer: 'Go to your Account page and find the "Order History" section. Click "View" next to any order to see the invoice in the Creem portal.'
      },
      {
        question: 'What is your refund policy?',
        answer: 'We offer a 7-day money-back guarantee on all new subscriptions. If you are not satisfied within the first 7 days, contact us for a full refund. See our Refund Policy for details.'
      },
      {
        question: 'How do I update my payment method?',
        answer: 'Go to your Account page, find the subscription section, and click "Manage in Creem Portal". From there you can update your payment method.'
      }
    ]
  },
  {
    icon: Settings,
    title: 'Features & Tools',
    faqs: [
      {
        question: 'What tools are included in the Pro plan?',
        answer: 'The Pro plan includes all calculators (Flame Temperature, Orifice, Unit Converter, Emissions, Thermodynamic, Efficiency, Insulation), Fuel Manager, and our burner components database with 1000+ components.'
      },
      {
        question: 'Do you offer a free trial?',
        answer: 'Yes! You can sign up for free and use our basic tools without any payment information. Upgrade to Pro anytime for full access.'
      },
      {
        question: 'Can I use Burner Design Pro on multiple devices?',
        answer: 'Absolutely! Your account works on any device with a web browser. Just sign in with your email and password.'
      }
    ]
  },
  {
    icon: Zap,
    title: 'Technical Support',
    faqs: [
      {
        question: 'How do I contact support?',
        answer: 'You can reach our support team by emailing support@burnerdesignpro.com. We typically respond within 24 hours on business days.'
      },
      {
        question: 'What are your support hours?',
        answer: 'Our support team is available Monday through Friday, 9am - 5pm EST. We do our best to respond to all inquiries within 24 hours.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use industry-standard encryption (TLS/SSL) for all data transmission, bcrypt for password hashing, and follow best security practices.'
      }
    ]
  }
]

export default function FAQPage() {
  useSEO({
    title: 'FAQ & Help',
    description: 'Frequently asked questions about Burner Design Pro. Find answers to common questions about accounts, billing, features, and more.',
  })
  
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (categoryTitle: string, questionIndex: number) => {
    const key = `${categoryTitle}-${questionIndex}`
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key)
    } else {
      newOpenItems.add(key)
    }
    setOpenItems(newOpenItems)
  }

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
              FAQ & Help
            </span>
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Help & FAQ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Find answers to common questions. Can't find what you're looking for? Contact us.
          </p>
        </div>

        <div className="space-y-6">
          {faqCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.title}
                className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 md:p-8"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Icon className="text-blue-600 dark:text-blue-400" size={22} />
                  {category.title}
                </h2>
                <div className="space-y-2">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.title}-${index}`
                    const isOpen = openItems.has(key)
                    return (
                      <div
                        key={index}
                        className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(category.title, index)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <span className="font-medium text-slate-900 dark:text-white text-sm">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
          <div className="relative">
            <MessageCircle className="w-10 h-10 mx-auto mb-4 text-blue-300" />
            <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
            <p className="text-blue-100/80 mb-6 max-w-xl mx-auto">
              Our support team is here to help. Send us an email and we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:support@burnerdesignpro.com"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/20 text-sm"
            >
              <Mail size={18} />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
