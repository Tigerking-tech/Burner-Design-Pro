import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authAPI } from '../services/api'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoggedIn(authAPI.isAuthenticated())
    setIsAdmin(authAPI.isAdmin())
  }, [])

  const handleLogout = () => {
    authAPI.logout(); window.location.href = "/"
    setIsLoggedIn(false)
    setIsAdmin(false)
    navigate('/')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Navigation - Desktop */}
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-4 md:px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-xl md:text-2xl font-semibold tracking-tight">
          <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          <a href="/#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
          <a href="/#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                  Admin
                </Link>
              )}
              <span className="text-[#f39c12] text-sm font-medium">
                {authAPI.getCurrentUserSync()?.email}
              </span>
              <Link to="/account" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Login</Link>
              <Link to="/signup" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#2c3e50] text-white flex flex-col">
          <div className="flex justify-between items-center px-4 py-4 border-b border-[#34495e]">
            <span className="text-xl font-semibold"><span className="text-[#f39c12]">🔥</span> Burner-Design-Pro</span>
            <button onClick={closeMobileMenu} className="p-2">
              <X size={28} />
            </button>
          </div>
          <div className="flex flex-col p-6 gap-6 text-lg">
            <a href="/#features" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors">Features</a>
            <a href="/#pricing" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors">Pricing</a>
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors">Admin</Link>
                )}
                <Link to="/account" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors">Account</Link>
                <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="text-left text-[#bdc3c7] hover:text-white transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu} className="text-[#bdc3c7] hover:text-white transition-colors">Login</Link>
                <Link to="/signup" onClick={closeMobileMenu} className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-3 rounded font-semibold text-center transition-colors shadow-md">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
