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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">About Burner Design Pro</h1>
          <p className="text-[#bdc3c7] text-lg max-w-2xl mx-auto">
            Professional burner design tools for engineers, by engineers.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[#f39c12] hover:text-[#e67e22] mb-6 transition-colors">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="space-y-8">
          {/* Mission */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#f39c12]/10 rounded-full flex items-center justify-center">
                <Target className="text-[#f39c12]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white">
                Our Mission
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Burner Design Pro was created to solve a simple problem: burner engineers spend 
              too much time on repetitive calculations and not enough time on actual design work.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We believe that engineering tools should be fast, accurate, and accessible. 
              Our platform combines decades of combustion engineering experience with modern 
              software to give you professional-grade calculations at your fingertips.
            </p>
          </div>

          {/* What We Do */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Lightbulb className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white">
                What We Do
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We build comprehensive burner design and thermal engineering tools that help you:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">⚡ Work Faster</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get instant results for flame temperature, orifice sizing, emissions, and more.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">✅ Reduce Errors</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional-grade calculations validated against industry standards.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">📚 Stay Organized</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keep all your fuel data and calculations in one place, accessible anywhere.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2c3e50] dark:text-white mb-2">🔧 Reference Database</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  1000+ burner components at your fingertips with search and filtering.
                </p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Users className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white">
                Our Team
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Burner Design Pro is built by a team of combustion engineers and software developers 
              who have worked in the burner industry for decades. We know first-hand the challenges 
              you face because we have faced them too.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Every tool we build is tested and validated by practicing engineers before it 
              reaches our users. We stand behind the accuracy of our calculations.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Heart className="text-red-500 dark:text-red-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white">
                Our Values
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#2c3e50] dark:text-white">Engineering Excellence</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Accuracy is non-negotiable. Every calculation is thoroughly tested and validated.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#2c3e50] dark:text-white">User-First Design</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  We build tools that actual engineers want to use, not just tools that "work."
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#2c3e50] dark:text-white">Transparency</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No hidden fees, no lock-in contracts, and honest communication about our product.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#2c3e50] to-[#34495e] rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-semibold mb-2">Ready to get started?</h2>
            <p className="text-[#bdc3c7] mb-6 max-w-xl mx-auto">
              Join thousands of burner engineers who trust Burner Design Pro for their calculations.
            </p>
            <Link
              to="/signup"
              className="inline-block bg-[#f39c12] hover:bg-[#e67e22] text-white px-8 py-3 rounded-md font-semibold transition-colors shadow-md"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
