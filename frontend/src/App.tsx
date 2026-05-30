import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomGasCalculator from './pages/CustomGasCalculator'
import UnitConverterPage from './pages/UnitConverterPage'
import EmissionPage from './pages/EmissionPage'
import ThermodynamicPage from './pages/ThermodynamicPage'
import EfficiencyPage from './pages/EfficiencyPage'
import DatabasePage from './pages/DatabasePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import FuelManagerPage from './pages/FuelManagerPage'
import FlameTemperaturePage from './pages/FlameTemperaturePage'
import OrificeCalculatorPage from './pages/OrificeCalculatorPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import InsulationCalculatorPage from './pages/InsulationCalculatorPage'
import SubscriptionPage from './pages/SubscriptionPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'

// Scroll to top on route change
function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/fuel-manager" element={<FuelManagerPage />} />
        <Route path="/flame-temperature" element={<FlameTemperaturePage />} />
        <Route path="/orifice-calculator" element={<OrificeCalculatorPage />} />
        <Route path="/gas-calculator" element={<CustomGasCalculator />} />
        <Route path="/unit-converter" element={<UnitConverterPage />} />
        <Route path="/emission" element={<EmissionPage />} />
        <Route path="/thermodynamic" element={<ThermodynamicPage />} />
        <Route path="/efficiency" element={<EfficiencyPage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/insulation-calculator" element={<InsulationCalculatorPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
