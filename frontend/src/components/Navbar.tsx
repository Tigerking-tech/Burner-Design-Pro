import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { authAPI } from '../services/api'
import { useTheme } from './ThemeProvider'

export function Navbar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setIsLoggedIn(authAPI.isAuthenticated())
    setIsAdmin(authAPI.isAdmin())
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    setIsLoggedIn(false)
    setIsAdmin(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-3 flex justify-between items-center">
      <Link to="/" className="text-lg md:text-xl font-bold tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0 flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <path d="M15 9l3 3-3 3" />
          <path d="M9 15l-3-3 3-3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-slate-900 dark:text-white">Burner<span className="text-blue-600 dark:text-blue-400">Design</span>Pro</span>
      </Link>

      <div className="hidden md:flex gap-8 items-center">
        <Link to="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Home</Link>
        <a href="/#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Features</a>
        <a href="/#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Pricing</a>
        <button
          onClick={toggleTheme}
          className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Admin</Link>
            )}
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 max-w-[180px] truncate">{authAPI.getCurrentUserSync()?.email}</span>
            <Link to="/account" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Account</Link>
            <button onClick={handleLogout} className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Logout</button>
          </>
        ) : (
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
            Get Started
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={toggleTheme}
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-lg"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-900 dark:text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 flex flex-col gap-4 px-4 py-6 shadow-xl border-b border-slate-200 dark:border-slate-700 md:hidden">
          <Link to="/" onClick={closeMobileMenu} className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Home</Link>
          <a href="/#features" onClick={closeMobileMenu} className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Features</a>
          <a href="/#pricing" onClick={closeMobileMenu} className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Pricing</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" onClick={closeMobileMenu} className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Admin</Link>
              )}
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 break-all">{authAPI.getCurrentUserSync()?.email}</span>
              <Link to="/account" onClick={closeMobileMenu} className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Account</Link>
              <button onClick={handleLogout} className="text-left text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMobileMenu} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-center shadow-lg shadow-blue-500/20">
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}