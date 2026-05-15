import { Link } from 'react-router-dom'

interface ModulePageProps {
  title: string
  icon: string
  description: string
  comingSoon?: boolean
}

export default function ModulePage({ title, icon, description, comingSoon = false }: ModulePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors mr-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-4xl mr-6 shadow-lg">
                {icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
                <p className="text-slate-600 mt-1">{description}</p>
              </div>
            </div>

            {comingSoon ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">🚧</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">开发中...</h2>
                <p className="text-slate-600 max-w-lg mx-auto mb-8">
                  此功能模块正在紧张开发中，敬请期待！
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            ) : (
              <div className="p-12 bg-slate-50 rounded-xl text-center">
                <div className="text-6xl mb-6">🔧</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">即将上线</h3>
                <p className="text-slate-600">这个强大的功能模块正在开发中...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
