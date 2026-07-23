import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MessageSquare, Clock, Users, ArrowRight } from 'lucide-react'
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
              Contact
            </span>
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Get In Touch
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Mail className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Email</h3>
            <a
              href="mailto:support@burnerdesignpro.com"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              support@burnerdesignpro.com
            </a>
          </div>
          
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Response Time</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Within 24 hours<br />
              Mon - Fri, 9am - 5pm EST
            </p>
          </div>
          
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Support</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Technical support<br />
              Billing questions<br />
              Feature requests
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Message Sent!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Thank you for reaching out. We'll get back to you as soon as possible.
            </p>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
            >
              Check out our FAQ
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Send us a message
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white transition-colors"
                  placeholder="How can we help?"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white resize-vertical transition-colors"
                  placeholder="Tell us about your question or feedback..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Mail size={18} />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
              This will open your email client. You can also email us directly at{' '}
              <a href="mailto:support@burnerdesignpro.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                support@burnerdesignpro.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
