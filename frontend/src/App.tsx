import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomGasCalculator from './pages/CustomGasCalculator'
import UnitConverterPage from './pages/UnitConverterPage'
import EmissionPage from './pages/EmissionPage'
import ThermodynamicPage from './pages/ThermodynamicPage'
import EfficiencyPage from './pages/EfficiencyPage'
import DatabasePage from './pages/DatabasePage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gas-calculator" element={<CustomGasCalculator />} />
        <Route path="/unit-converter" element={<UnitConverterPage />} />
        <Route path="/emission" element={<EmissionPage />} />
        <Route path="/thermodynamic" element={<ThermodynamicPage />} />
        <Route path="/efficiency" element={<EfficiencyPage />} />
        <Route path="/database" element={<DatabasePage />} />
      </Routes>
    </Router>
  )
}

export default App
