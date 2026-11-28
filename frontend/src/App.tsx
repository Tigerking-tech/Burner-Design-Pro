import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
const UnitConverterPage = lazy(() => import('./pages/UnitConverterPage'))
const EmissionPage = lazy(() => import('./pages/EmissionPage'))
const ThermodynamicPage = lazy(() => import('./pages/ThermodynamicPage'))
const EfficiencyPage = lazy(() => import('./pages/EfficiencyPage'))
const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const FuelManagerPage = lazy(() => import('./pages/FuelManagerPage'))
const FlameTemperaturePage = lazy(() => import('./pages/FlameTemperaturePage'))
const OrificeCalculatorPage = lazy(() => import('./pages/OrificeCalculatorPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const InsulationCalculatorPage = lazy(() => import('./pages/InsulationCalculatorPage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const BlogListPage = lazy(() => import('./pages/BlogListPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
import { wakeUpService } from './services/wakeUpService'
import { ToastProvider, useToast } from './components/Toast'
import { tokenManager } from './services/tokenManager'
import { authAPI } from './services/api'
import CookieConsent from './components/CookieConsent'

function GATracker() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  useEffect(() => {
    // index.html 的 gtag('config') 已经发送了首次加载的 page_view，
    // 跳过首次渲染，避免落地页被重复统计
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const gtag = (window as any).gtag
    if (gtag) {
      gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title
      })
    }
  }, [location.pathname, location.search])
  return null
}

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
  const location = useLocation()

  const isAuthPage = () => {
    const authPaths = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password']
    return authPaths.includes(location.pathname)
  }

  useEffect(() => {
    if (isAuthPage()) {
      return
    }

    const checkLocalExpiry = () => {
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

    const verifySession = async () => {
      if (!tokenManager.isAuthenticated()) return
      if (hasShownToast) return
      try {
        await authAPI.getCurrentUser()
      } catch (err: any) {
        const msg = err?.message || ''
        if (msg.includes('Another device logged in')) {
          tokenManager.clearTokens()
          setHasShownToast(true)
          showToast(msg, 'error')
          setTimeout(() => {
            navigate('/login')
          }, 3000)
        }
      }
    }

    checkLocalExpiry()
    const localInterval = setInterval(checkLocalExpiry, 5000)
    const sessionInterval = setInterval(verifySession, 15000)

    const handleSessionKicked = (e: Event) => {
      const detail = (e as CustomEvent).detail || 'Another device logged into this account.'
      setHasShownToast(true)
      showToast(detail, 'error')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
    window.addEventListener('session-kicked', handleSessionKicked)

    return () => {
      clearInterval(localInterval)
      clearInterval(sessionInterval)
      window.removeEventListener('session-kicked', handleSessionKicked)
    }
  }, [hasShownToast, navigate, showToast, location])

  return null
}

function AppRoutes() {
  useEffect(() => {
    wakeUpService.wakeUp()
  }, [])

  return (
    <>
      <SessionMonitor />
      <GATracker />
      <ScrollToTop />
      <CookieConsent />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
            Loading…
          </div>
        }
      >
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
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
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/help" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
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
