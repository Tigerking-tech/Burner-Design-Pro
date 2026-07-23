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
    <nav className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#2a2a2a] px-4 md:px-12 py-3 flex justify-between items-center">
      <Link to="/" className="text-lg md:text-xl font-black tracking-tight hover:text-[#ff5722] transition-colors flex-shrink-0 text-white uppercase">
        Burner<span className="text-[#ff5722]">Design</span>Pro
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-8 items-center">
        <Link to="/" className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Home</Link>
        <a href="/#features" className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Features</a>
        <a href="/#pricing" className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Pricing</a>
        <button
          onClick={toggleTheme}
          className="text-gray-500 hover:text-[#ff5722] transition-colors p-2 bg-[#1a1a1a] border border-[#333] hover:border-[#ff5722]/40"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Admin</Link>
            )}
            <span className="text-sm font-bold text-[#ff5722] max-w-[180px] truncate">{authAPI.getCurrentUserSync()?.email}</span>
            <Link to="/account" className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Account</Link>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Logout</button>
          </>
        ) : (
          <Link to="/login" className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 py-2 text-sm font-black uppercase tracking-wider transition-all border-b-4 border-[#bf360c] hover:border-[#e64a19] active:border-b-0 active:mt-1">
            Get Started
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={toggleTheme}
          className="text-gray-400 hover:text-[#ff5722] transition-colors p-2 bg-[#1a1a1a] border border-[#333]"
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
        <div className="absolute top-full left-0 right-0 bg-[#0d0d0d] flex flex-col gap-4 px-4 py-6 shadow-lg border-b border-[#2a2a2a] md:hidden">
          <Link to="/" onClick={closeMobileMenu} className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Home</Link>
          <a href="/#features" onClick={closeMobileMenu} className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Features</a>
          <a href="/#pricing" onClick={closeMobileMenu} className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Pricing</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" onClick={closeMobileMenu} className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Admin</Link>
              )}
              <span className="text-sm font-bold text-[#ff5722] break-all">{authAPI.getCurrentUserSync()?.email}</span>
              <Link to="/account" onClick={closeMobileMenu} className="text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Account</Link>
              <button onClick={handleLogout} className="text-left text-sm text-gray-400 hover:text-[#ff5722] transition-colors uppercase tracking-wide font-bold">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMobileMenu} className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 py-2.5 text-sm font-black uppercase tracking-wider transition-all text-center border-b-4 border-[#bf360c]">
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
