import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MessageSquare, Clock, Users } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'

export default function ContactPage() {
  useSEO({
    title: 'Contact Us',
    description: 'Get in touch with the Burner Design Pro team. We are here to help with any questions or feedback.',
  })
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name || !email || !subject || !message) {
      setError('Please fill in all fields')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const mailtoLink = `mailto:support@burnerdesignpro.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`
      window.location.href = mailtoLink
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#f39c12]/20 rounded-full flex items-center justify-center">
              <Mail className="text-[#f39c12]" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-semibold mb-4">Contact Us</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            Have a question, feedback, or just want to say hi? We would love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f39c12] hover:text-[#e67e22] mb-6 transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-1">Email</h3>
            <a
              href="mailto:support@burnerdesignpro.com"
              className="text-sm text-[#f39c12] hover:text-[#e67e22]"
            >
              support@burnerdesignpro.com
            </a>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-1">Response Time</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Within 24 hours<br />
              Mon - Fri, 9am - 5pm EST
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-1">Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Technical support<br />
              Billing questions<br />
              Feature requests
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-[#2c3e50] dark:text-white mb-2">
              Message Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for reaching out. We will get back to you as soon as possible.
            </p>
            <Link
              to="/faq"
              className="text-[#f39c12] hover:text-[#e67e22] font-medium"
            >
              Check out our FAQ →
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-semibold text-[#2c3e50] dark:text-white mb-6">
              Send us a message
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="How can we help?"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-vertical"
                  placeholder="Tell us about your question or feedback..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded-md font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              This will open your email client. You can also email us directly at{' '}
              <a href="mailto:support@burnerdesignpro.com" className="text-[#f39c12] hover:text-[#e67e22]">
                support@burnerdesignpro.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
