import { Link } from 'react-router-dom'
import { ArrowLeft, Target, Users, Lightbulb, Heart } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useSEO } from '../hooks/useSEO'

export default function AboutPage() {
  useSEO({
    title: 'About Us',
    description: 'Learn about Burner Design Pro - our mission, team, and why we are building the best tools for burner engineers.',
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
              About Us
            </span>
            <span className="w-10 h-px bg-blue-600 dark:bg-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            About Burner Design Pro
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Professional burner design tools for engineers, by engineers.
          </p>
        </div>

        <div className="space-y-6">
          {/* Mission */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Target className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Our Mission
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Burner Design Pro was created to solve a simple problem: burner engineers spend 
              too much time on repetitive calculations and not enough time on actual design work.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We believe that engineering tools should be fast, accurate, and accessible. 
              Our platform combines decades of combustion engineering experience with modern 
              software to give you professional-grade calculations at your fingertips.
            </p>
          </div>

          {/* What We Do */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Lightbulb className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                What We Do
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              We build comprehensive burner design and thermal engineering tools that help you:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">⚡ Work Faster</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get instant results for flame temperature, orifice sizing, emissions, and more.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">✅ Reduce Errors</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Professional-grade calculations validated against industry standards.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📚 Stay Organized</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Keep all your fuel data and calculations in one place, accessible anywhere.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🔧 Reference Database</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  1000+ burner components at your fingertips with search and filtering.
                </p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Our Team
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Burner Design Pro is built by a team of combustion engineers and software developers 
              who have worked in the burner industry for decades. We know first-hand the challenges 
              you face because we have faced them too.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Every tool we build is tested and validated by practicing engineers before it 
              reaches our users. We stand behind the accuracy of our calculations.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Heart className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Our Values
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Engineering Excellence</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Accuracy is non-negotiable. Every calculation is thoroughly tested and validated.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">User-First Design</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  We build tools that actual engineers want to use, not just tools that "work."
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Transparency</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  No hidden fees, no lock-in contracts, and honest communication about our product.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-8 md:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
              <p className="text-blue-100/80 mb-6 max-w-xl mx-auto">
                Join thousands of burner engineers who trust Burner Design Pro for their calculations.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/20 text-sm"
              >
                Start Free Trial
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
