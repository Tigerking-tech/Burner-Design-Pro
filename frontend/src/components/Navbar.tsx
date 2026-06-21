import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { authAPI } from '../services/api'

export function Navbar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-4 md:px-12 py-4 flex justify-between items-center shadow-lg">
      <Link to="/" className="text-xl md:text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors flex-shrink-0">
        <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-8 items-center">
        <Link to="/" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
        <a href="/#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
        <a href="/#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Admin</Link>
            )}
            <span className="text-[#f39c12] text-sm font-medium max-w-[180px] truncate">{authAPI.getCurrentUserSync()?.email}</span>
            <Link to="/account" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Account</Link>
            <button onClick={handleLogout} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Logout</button>
          </>
        ) : (
          <Link to="/login" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md">
            Get Started
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-white p-2"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#2c3e50] flex flex-col gap-4 px-4 py-6 shadow-lg md:hidden">
          <Link to="/" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
          <a href="/#features" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
          <a href="/#pricing" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Admin</Link>
              )}
              <span className="text-[#f39c12] text-sm font-medium break-all">{authAPI.getCurrentUserSync()?.email}</span>
              <Link to="/account" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Account</Link>
              <button onClick={handleLogout} className="text-left text-[#bdc3c7] hover:text-white transition-colors text-sm">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMobileMenu} className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md text-center">
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
