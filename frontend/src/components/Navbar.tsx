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
    <nav className="sticky top-0 z-50 bg-[#2c3e50] dark:bg-gray-900 text-white px-4 md:px-12 py-3.5 flex justify-between items-center shadow-md border-b border-white/5">
      <Link to="/" className="font-display text-xl md:text-2xl font-bold tracking-wide text-white hover:text-[#f39c12] transition-colors flex-shrink-0 uppercase">
        <span className="text-[#f39c12] mr-1">🔥</span> Burner-Design-Pro
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-8 items-center">
        <Link to="/" className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Home</Link>
        <a href="/#features" className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Features</a>
        <a href="/#pricing" className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Pricing</a>
        <button
          onClick={toggleTheme}
          className="text-[#bdc3c7] hover:text-[#f39c12] transition-colors p-2 rounded-sm hover:bg-white/5"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Admin</Link>
            )}
            <span className="text-[#f39c12] text-sm font-medium max-w-[180px] truncate font-mono-tech">{authAPI.getCurrentUserSync()?.email}</span>
            <Link to="/account" className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Account</Link>
            <button onClick={handleLogout} className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Logout</button>
          </>
        ) : (
          <Link to="/login" className="font-display bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded-sm font-semibold text-sm transition-all shadow-md hover:shadow-[0_4px_15px_rgba(243,156,18,0.3)] tracking-wide uppercase">
            Get Started
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={toggleTheme}
          className="text-[#bdc3c7] hover:text-white transition-colors p-2 rounded-sm"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#2c3e50] dark:bg-gray-900 flex flex-col gap-4 px-4 py-6 shadow-md border-b border-white/5 md:hidden">
          <Link to="/" onClick={closeMobileMenu} className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Home</Link>
          <a href="/#features" onClick={closeMobileMenu} className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Features</a>
          <a href="/#pricing" onClick={closeMobileMenu} className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Pricing</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" onClick={closeMobileMenu} className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Admin</Link>
              )}
              <span className="text-[#f39c12] text-sm font-medium break-all font-mono-tech">{authAPI.getCurrentUserSync()?.email}</span>
              <Link to="/account" onClick={closeMobileMenu} className="font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Account</Link>
              <button onClick={handleLogout} className="text-left font-mono-tech text-[11px] text-[#bdc3c7] hover:text-white transition-colors tracking-wider uppercase">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMobileMenu} className="font-display bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded-sm font-semibold text-sm transition-all shadow-md text-center tracking-wide uppercase">
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
