import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

interface ModulePageProps {
  title: string
  icon: React.ReactNode
  description: string
  comingSoon?: boolean
}

export default function ModulePage({ title, icon, description, comingSoon = false }: ModulePageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
              {typeof icon === 'string' ? <span className="text-4xl">{icon}</span> : icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
            </div>
          </div>

          {comingSoon ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🚧</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Coming Soon...</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
                This feature module is under active development, stay tuned!
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="mt-8">
                <Link
                  to="/"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-200 dark:border-white/10">
              <div className="text-6xl mb-6">🔧</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Coming Soon</h3>
              <p className="text-slate-600 dark:text-slate-400">This powerful feature module is in development...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
