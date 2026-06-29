import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import UnitConverterPage from './pages/UnitConverterPage'
import EmissionPage from './pages/EmissionPage'
import ThermodynamicPage from './pages/ThermodynamicPage'
import EfficiencyPage from './pages/EfficiencyPage'
import DatabasePage from './pages/DatabasePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import FuelManagerPage from './pages/FuelManagerPage'
import FlameTemperaturePage from './pages/FlameTemperaturePage'
import OrificeCalculatorPage from './pages/OrificeCalculatorPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import InsulationCalculatorPage from './pages/InsulationCalculatorPage'
import SubscriptionPage from './pages/SubscriptionPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import { wakeUpService } from './services/wakeUpService'
import { ToastProvider, useToast } from './components/Toast'
import { tokenManager } from './services/tokenManager'

function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return null
}

function SessionMonitor() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [hasShownToast, setHasShownToast] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const wasAuthenticated = tokenManager.getAccessToken() !== null
      const stillAuthenticated = tokenManager.isAuthenticated()

      if (wasAuthenticated && !stillAuthenticated && !hasShownToast) {
        setHasShownToast(true)
        showToast('Your session has expired. Please log in again.', 'warning')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else if (!wasAuthenticated && stillAuthenticated) {
        setHasShownToast(false)
      }
    }

    checkAuth()
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [hasShownToast, navigate, showToast])

  return null
}

function AppRoutes() {
  useEffect(() => {
    wakeUpService.wakeUp()
  }, [])

  return (
    <>
      <SessionMonitor />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/fuel-manager" element={<FuelManagerPage />} />
        <Route path="/flame-temperature" element={<FlameTemperaturePage />} />
        <Route path="/orifice-calculator" element={<OrificeCalculatorPage />} />
        <Route path="/unit-converter" element={<UnitConverterPage />} />
        <Route path="/emission" element={<EmissionPage />} />
        <Route path="/thermodynamic" element={<ThermodynamicPage />} />
        <Route path="/efficiency" element={<EfficiencyPage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/insulation-calculator" element={<InsulationCalculatorPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
