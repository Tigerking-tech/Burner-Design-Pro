import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ArrowLeft, MessageCircle, Mail, ChevronDown, ChevronUp, CreditCard, User, Settings, Zap } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#f39c12]/20 rounded-full flex items-center justify-center">
              <HelpCircle className="text-[#f39c12]" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-semibold mb-4">Help & FAQ</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            Find answers to common questions. Can not find what you are looking for? Contact us.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f39c12] hover:text-[#e67e22] mb-6 transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="space-y-8">
          {faqCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.title}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-bold text-[#2c3e50] dark:text-white mb-4 flex items-center gap-2">
                  <Icon className="text-[#f39c12]" size={22} />
                  {category.title}
                </h2>
                <div className="space-y-2">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.title}-${index}`
                    const isOpen = openItems.has(key)
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(category.title, index)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <span className="font-medium text-[#2c3e50] dark:text-white text-sm">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
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
        <div className="mt-10 bg-gradient-to-r from-[#2c3e50] to-[#34495e] rounded-lg p-8 text-center text-white">
          <MessageCircle className="w-10 h-10 mx-auto mb-4 text-[#f39c12]" />
          <h2 className="text-2xl font-semibold mb-2">Still have questions?</h2>
          <p className="text-[#bdc3c7] mb-6 max-w-xl mx-auto">
            Our support team is here to help. Send us an email and we'll get back to you as soon as possible.
          </p>
          <a
            href="mailto:support@burnerdesignpro.com"
            className="inline-flex items-center gap-2 bg-[#f39c12] hover:bg-[#e67e22] text-white px-6 py-3 rounded-md font-semibold transition-colors"
          >
            <Mail size={20} />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
