import { Navbar } from '../components/Navbar'

interface ModulePageProps {
  title: string
  icon: React.ReactNode
  description: string
  comingSoon?: boolean
}

export default function ModulePage({ title, icon, description, comingSoon = false }: ModulePageProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-lg text-[#bdc3c7] max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 border border-gray-300 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg flex items-center justify-center mr-6 shadow-lg">
              {typeof icon === 'string' ? <span className="text-4xl">{icon}</span> : icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2c3e50]">{title}</h1>
              <p className="text-[#7f8c8d] mt-1">{description}</p>
            </div>
          </div>

          {comingSoon ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🚧</div>
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">Coming Soon...</h2>
              <p className="text-[#7f8c8d] max-w-lg mx-auto mb-8">
                This feature module is under active development, stay tuned!
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-3 h-3 bg-[#f39c12] rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-[#f39c12] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-[#f39c12] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="mt-8">
                <Link
                  to="/"
                  className="inline-flex items-center bg-[#f39c12] hover:bg-[#e67e22] text-white px-6 py-3 rounded font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-gray-50 rounded-lg text-center border border-gray-200">
              <div className="text-6xl mb-6">🔧</div>
              <h3 className="text-xl font-semibold text-[#2c3e50] mb-4">Coming Soon</h3>
              <p className="text-[#7f8c8d]">This powerful feature module is in development...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-12 px-6 mt-20">
        <div className="flex justify-center gap-8 mb-5 flex-wrap">
          <a href="/#features" className="text-sm hover:text-white transition-colors">Features</a>
          <a href="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</a>
          <a href="#about" className="text-sm hover:text-white transition-colors">About</a>
          <a href="#privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
          <a href="#contact" className="text-sm hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
      </footer>
    </div>
  )
}
