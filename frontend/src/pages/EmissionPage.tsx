import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Download } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import {
  createPDF,
  addCoverPage,
  drawPageHeader,
  drawSectionTitle,
  drawSubSectionTitle,
  drawInfoTable,
  drawResultCard,
  drawPageFooter,
  addDisclaimerPage,
  checkPageBreak,
  sanitizeText,
  MARGIN_LEFT,
  CONTENT_WIDTH,
} from '../utils/pdfUtils'

const POLLUTANTS = ['NOx', 'CO', 'CO2', 'SOx'];

const MOLECULAR_WEIGHTS = {
  'NOx': 46.01,
  'CO': 28.01,
  'CO2': 44.01,
  'SOx': 64.06
};

const EPA_LIMITS = {
  'natural_gas_low': { 'NOx': 130, 'CO': 100, 'O2': 3.0 },
  'natural_gas_high': { 'NOx': 260, 'CO': 100, 'O2': 3.0 },
  'diesel_low': { 'NOx': 130, 'CO': 100, 'O2': 3.0 },
  'heavy_oil_low': { 'NOx': 390, 'CO': 150, 'O2': 3.0 },
  'coal': { 'NOx': 910, 'CO': 200, 'O2': 3.0 }
};

const EU_LIMITS = {
  'natural_gas': { 'NOx': 200, 'CO': 150, 'O2': 3.0 },
  'heavy_oil': { 'NOx': 450, 'CO': 150, 'O2': 3.0 },
  'solid': { 'NOx': 650, 'CO': 200, 'O2': 6.0 }
};

const CO2_MAX_VALUES = {
  'natural_gas': 12.0,
  'natural_gas_low': 12.0,
  'natural_gas_high': 12.0,
  'diesel': 15.0,
  'diesel_low': 15.0,
  'heavy_oil': 15.0,
  'heavy_oil_low': 15.0,
  'coal': 20.0,
  'solid': 20.0
};

const ppmToMgM3 = (ppm: number, mw: number) => ppm * mw / 22.4;
const mgM3ToPpm = (mg: number, mw: number) => mg * 22.4 / mw;

const o2Correction = (measuredValue: number, o2Measured: number, o2Reference: number) => {
  if (o2Measured >= 20.9) return measuredValue;
  return measuredValue * (20.9 - o2Reference) / (20.9 - o2Measured);
};

const mgM3ToLbMMBtu = (mg: number, o2Ref: number, co2Max: number) => {
  return mg * 1.80e-7 / (co2Max / 100) * (20.9 - o2Ref) / 20.9;
};

const convertToAllUnits = (
  value: number,
  fromUnit: string,
  pollutant: string,
  o2Measured: number,
  o2Reference: number,
  fuelType: string
) => {
  const mw = MOLECULAR_WEIGHTS[pollutant as keyof typeof MOLECULAR_WEIGHTS] || 46.01;
  const co2Max = CO2_MAX_VALUES[fuelType as keyof typeof CO2_MAX_VALUES] || 12.0;
  
  let ppm: number, mgM3: number, lbMMBtu: number;
  
  if (fromUnit === 'ppm') {
    ppm = o2Correction(value, o2Measured, o2Reference);
    mgM3 = ppmToMgM3(ppm, mw);
    lbMMBtu = mgM3ToLbMMBtu(mgM3, o2Reference, co2Max);
  } else if (fromUnit === 'mg_m3') {
    mgM3 = o2Correction(value, o2Measured, o2Reference);
    ppm = mgM3ToPpm(mgM3, mw);
    lbMMBtu = mgM3ToLbMMBtu(mgM3, o2Reference, co2Max);
  } else {
    lbMMBtu = value;
    mgM3 = value / 1.80e-7 * (co2Max / 100) * 20.9 / (20.9 - o2Reference);
    ppm = mgM3ToPpm(mgM3, mw);
  }
  
  return { ppm, mgM3, lbMMBtu };
};

const checkCompliance = (
  noxMgM3: number,
  coMgM3: number,
  _o2Ref: number,
  fuelType: string,
  standard: 'EPA' | 'EU'
) => {
  let limits: any;
  
  if (standard === 'EPA') {
    limits = EPA_LIMITS[fuelType as keyof typeof EPA_LIMITS] || EPA_LIMITS['natural_gas_low'];
  } else {
    limits = EU_LIMITS[fuelType as keyof typeof EU_LIMITS] || EU_LIMITS['natural_gas'];
  }
  
  const noxCompliant = noxMgM3 <= limits.NOx;
  const coCompliant = coMgM3 <= limits.CO;
  
  return {
    standard,
    noxLimit: limits.NOx,
    coLimit: limits.CO,
    noxMeasured: noxMgM3,
    coMeasured: coMgM3,
    noxCompliant,
    coCompliant,
    overallCompliant: noxCompliant && coCompliant
  };
};

const calculateAnnualEmissions = (
  concentrationMgM3: number,
  flueGasFlow: number,
  annualHours: number,
  loadFactor: number
) => {
  const hourlyKg = concentrationMgM3 * flueGasFlow * 1e-3;
  const annualTons = hourlyKg * annualHours * loadFactor * 1e-3;
  const monthlyTons = annualTons / 12;
  
  return { hourlyKg, annualTons, monthlyTons };
};

const formatNumber = (num: number, decimals: number = 2) => {
  if (isNaN(num) || !isFinite(num)) return '0';
  return num.toFixed(decimals);
};

export default function EmissionPage() {
  const [pollutant, setPollutant] = useLocalStorageState('emission-pollutant', 'NOx')
  const [value, setValue] = useLocalStorageState('emission-value', '100')
  const [fromUnit, setFromUnit] = useLocalStorageState('emission-from-unit', 'ppm')
  const [o2Measured, setO2Measured] = useLocalStorageState('emission-o2-measured', '5')
  const [o2Reference, setO2Reference] = useLocalStorageState('emission-o2-reference', '3')
  const [fuelType, setFuelType] = useLocalStorageState('emission-fuel-type', 'natural_gas_low')
  const [euFuelType, setEuFuelType] = useLocalStorageState('emission-eu-fuel-type', 'natural_gas')
  const [noxValue, setNoxValue] = useLocalStorageState('emission-nox-value', '100')
  const [coValue, setCoValue] = useLocalStorageState('emission-co-value', '80')
  const [flueGasFlow, setFlueGasFlow] = useLocalStorageState('emission-flue-gas-flow', '1000')
  const [annualHours, setAnnualHours] = useLocalStorageState('emission-annual-hours', '8000')
  const _loadFactor = '0.8';
  
  const [results, setResults] = useState({ ppm: 0, mgM3: 0, lbMMBtu: 0 });
  const [epaCompliance, setEpaCompliance] = useState<any>(null);
  const [euCompliance, setEuCompliance] = useState<any>(null);
  const [annualEmissions, setAnnualEmissions] = useState({ hourlyKg: 0, annualTons: 0, monthlyTons: 0 });

  useEffect(() => {
    const numValue = parseFloat(value) || 0;
    const o2M = parseFloat(o2Measured) || 0;
    const o2R = parseFloat(o2Reference) || 0;
    
    const converted = convertToAllUnits(numValue, fromUnit, pollutant, o2M, o2R, fuelType);
    setResults(converted);
    
    const nox = parseFloat(noxValue) || 0;
    const co = parseFloat(coValue) || 0;
    
    setEpaCompliance(checkCompliance(nox, co, o2R, fuelType, 'EPA'));
    setEuCompliance(checkCompliance(nox, co, o2R, euFuelType, 'EU'));
    
    const flow = parseFloat(flueGasFlow) || 0;
    const hours = parseFloat(annualHours) || 0;
    const factor = parseFloat(_loadFactor) || 0;
    const conc = converted.mgM3;
    
    setAnnualEmissions(calculateAnnualEmissions(conc, flow, hours, factor));
  }, [value, fromUnit, pollutant, o2Measured, o2Reference, fuelType, euFuelType, noxValue, coValue, flueGasFlow, annualHours, _loadFactor]);

  const handleValueChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    if (value === '') {
      setter(value);
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setter(value);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportToPDF = () => {
    const doc = createPDF()
    const docTitle = 'Emission Analysis Report'

    addCoverPage(doc, {
      title: 'Emission Analysis',
      subtitle: 'NOx, CO, CO2 and SOx emission unit conversion and compliance review',
      reportType: 'Environmental Engineering',
      standard: 'EPA / EU IED Reference',
      version: 'v1.0',
    })

    let y = drawPageHeader(doc, docTitle, 'Concentration Results')
    y = drawSectionTitle(doc, 'EMISSION CONCENTRATION', y, `${pollutant} emission at reference O2 conditions`)

    const cardWidth = (CONTENT_WIDTH - 16) / 3
    drawResultCard(doc, {
      label: 'ppm',
      value: formatNumber(results.ppm),
      unit: 'parts per million',
      x: MARGIN_LEFT,
      y: y,
      width: cardWidth,
      highlight: true,
    })
    drawResultCard(doc, {
      label: 'mg/m3',
      value: formatNumber(results.mgM3),
      unit: 'milligram per m3',
      x: MARGIN_LEFT + cardWidth + 8,
      y: y,
      width: cardWidth,
      status: 'info',
    })
    drawResultCard(doc, {
      label: 'lb/MMBtu',
      value: formatNumber(results.lbMMBtu, 4),
      unit: 'pound per MMBtu',
      x: MARGIN_LEFT + (cardWidth + 8) * 2,
      y: y,
      width: cardWidth,
      status: 'success',
    })
    y += 42

    y = checkPageBreak(doc, y, 60, docTitle, 'Concentration Results')
    y = drawSubSectionTitle(doc, 'Calculation Basis', y)
    const basisRows: [string, string][] = [
      ['Pollutant', pollutant],
      ['Input Value', `${value} ${fromUnit === 'mg_m3' ? 'mg/m3' : fromUnit === 'lb_MMBtu' ? 'lb/MMBtu' : 'ppm'}`],
      ['Measured O2', `${o2Measured}%`],
      ['Reference O2', `${o2Reference}%`],
    ]
    y = drawInfoTable(doc, basisRows, MARGIN_LEFT, y + 4, CONTENT_WIDTH)

    y = checkPageBreak(doc, y, 100, docTitle, 'Compliance')
    y = drawSectionTitle(doc, 'REGULATORY COMPLIANCE', y, 'EPA and EU IED standard compliance check')

    const epaStatus = epaCompliance?.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'
    const euStatus = euCompliance?.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'
    const epaStatusColor = epaCompliance?.overallCompliant ? 'success' : 'danger'
    const euStatusColor = euCompliance?.overallCompliant ? 'success' : 'danger'

    const halfWidth = (CONTENT_WIDTH - 8) / 2
    const epaRows: [string, string][] = [
      ['NOx Measured', `${formatNumber(epaCompliance?.noxMeasured || 0)} mg/m3`],
      ['NOx Limit', `${epaCompliance?.noxLimit || 0} mg/m3`],
      ['CO Measured', `${formatNumber(epaCompliance?.coMeasured || 0)} mg/m3`],
      ['CO Limit', `${epaCompliance?.coLimit || 0} mg/m3`],
      ['Overall Status', epaStatus],
    ]
    const leftY = drawInfoTable(doc, epaRows, MARGIN_LEFT, y, halfWidth, {
      title: 'EPA Standard',
    })

    const euRows: [string, string][] = [
      ['NOx Measured', `${formatNumber(euCompliance?.noxMeasured || 0)} mg/m3`],
      ['NOx Limit', `${euCompliance?.noxLimit || 0} mg/m3`],
      ['CO Measured', `${formatNumber(euCompliance?.coMeasured || 0)} mg/m3`],
      ['CO Limit', `${euCompliance?.coLimit || 0} mg/m3`],
      ['Overall Status', euStatus],
    ]
    const rightY = drawInfoTable(doc, euRows, MARGIN_LEFT + halfWidth + 8, y, halfWidth, {
      title: 'EU IED Standard',
    })
    y = Math.max(leftY, rightY)

    y = checkPageBreak(doc, y, 120, docTitle, 'Annual Emissions')
    y = drawSectionTitle(doc, 'ANNUAL EMISSION ESTIMATE', y, 'Annualized emission calculation based on operating hours')

    const annualRows: [string, string][] = [
      ['NOx Concentration', `${noxValue} mg/m3`],
      ['CO Concentration', `${coValue} mg/m3`],
      ['Flue Gas Flow', `${flueGasFlow} m3/h`],
      ['Annual Operating Hours', `${annualHours} h/year`],
      ['Load Factor', _loadFactor],
      ['Hourly Emissions (NOx)', `${formatNumber(annualEmissions.hourlyKg)} kg/h`],
      ['Monthly Emissions (NOx)', `${formatNumber(annualEmissions.monthlyTons)} tons/month`],
      ['Annual Emissions (NOx)', `${formatNumber(annualEmissions.annualTons)} tons/year`],
    ]
    y = drawInfoTable(doc, annualRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Annualized Estimate',
    })

    y = checkPageBreak(doc, y, 80, docTitle, 'Input Parameters')
    y = drawSectionTitle(doc, 'INPUT PARAMETERS', y, 'Fuel types and reference standards')

    const inputRows: [string, string][] = [
      ['EPA Fuel Type', FUEL_TYPES.find(f => f.value === fuelType)?.label || fuelType],
      ['EU Fuel Type', EU_FUEL_TYPES.find(f => f.value === euFuelType)?.label || euFuelType],
    ]
    y = drawInfoTable(doc, inputRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Fuel and Reference Standards',
    })

    addDisclaimerPage(doc, {
      title: 'EMISSION REPORT DISCLAIMER',
      sections: [
        {
          heading: 'General Information',
          items: [
            'This emission report is provided for informational and reference purposes only.',
            'All calculations are based on the input parameters provided by the user.',
            'Results should not be used for regulatory compliance reporting without independent verification.'
          ]
        },
        {
          heading: 'Accuracy and Reliability',
          items: [
            'Emission calculations are based on simplified models and standard conversion factors.',
            'Actual emissions may vary due to factors not included in the calculation model.',
            'EPA and EU limit values shown are reference values only. Confirm with current local regulations.'
          ]
        },
        {
          heading: 'Regulatory Compliance',
          items: [
            'Compliance status is based on the selected fuel type and standard reference limits.',
            'Actual compliance must be verified by a qualified environmental engineer.',
            'Local, state, and national regulations may have different requirements.'
          ]
        },
        {
          heading: 'User Responsibilities',
          items: [
            'Verify all input parameters for correctness.',
            'Confirm applicable emission limits with local regulatory authorities.',
            'Obtain professional environmental engineering review before relying on results.',
            'Ensure proper stack testing for regulatory compliance reporting.'
          ]
        }
      ]
    })
    drawPageFooter(doc, 'Emission results for reference only. Confirm with local regulations and qualified environmental engineers.')

    doc.save('emission-analysis-report.pdf')
  }

  const FUEL_TYPES = [
    { value: 'natural_gas_low', label: 'Natural Gas (Low NOx)' },
    { value: 'natural_gas_high', label: 'Natural Gas (High NOx)' },
    { value: 'diesel_low', label: 'Diesel (Low)' },
    { value: 'heavy_oil_low', label: 'Heavy Oil (Low)' },
    { value: 'coal', label: 'Coal' }
  ];

  const EU_FUEL_TYPES = [
    { value: 'natural_gas', label: 'Natural Gas' },
    { value: 'heavy_oil', label: 'Heavy Oil' },
    { value: 'solid', label: 'Solid Fuel' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">Emission Analysis</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            NOx, CO, SO₂ emission calculations with EPA and EU IED compliance checking.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* Inline Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800">⚠️ Professional Engineering Judgment Required</p>
            <p className="text-yellow-700 mt-1">
              Results are for reference only. Ensure compliance with local EPA and EU IED regulations 
              by consulting qualified environmental engineers.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-[#2c3e50] mb-6">Emissions Estimation & Compliance</h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {POLLUTANTS.map((p) => (
              <button
                key={p}
                onClick={() => setPollutant(p)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  pollutant === p
                    ? 'bg-[#f39c12] text-[#2c3e50]'
                    : 'bg-gray-200 text-[#34495e] hover:bg-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">Input Value</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#34495e] mb-2">
                    {pollutant} Value
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleValueChange(setValue, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#34495e] mb-2">Unit</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                  >
                    <option value="ppm">ppm</option>
                    <option value="mg_m3">mg/m³</option>
                    <option value="lb_MMBtu">lb/MMBtu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">O₂ Reference Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#34495e] mb-2">Measured O₂ (%)</label>
                  <input
                    type="text"
                    value={o2Measured}
                    onChange={(e) => handleValueChange(setO2Measured, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#34495e] mb-2">Reference O₂ (%)</label>
                  <input
                    type="text"
                    value={o2Reference}
                    onChange={(e) => handleValueChange(setO2Reference, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setO2Reference('3'); }}
                    className="px-3 py-1 bg-[#f39c12] text-[#2c3e50] rounded hover:bg-[#e67e22] text-sm font-semibold"
                  >
                    EPA 3%
                  </button>
                  <button
                    onClick={() => { setO2Reference('3'); }}
                    className="px-3 py-1 bg-[#f39c12] text-[#2c3e50] rounded hover:bg-[#e67e22] text-sm font-semibold"
                  >
                    EU 3%
                  </button>
                  <button
                    onClick={() => { setO2Reference('6'); }}
                    className="px-3 py-1 bg-[#34495e] text-white rounded hover:bg-[#2c3e50] text-sm font-semibold"
                  >
                    EU 6%
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#2c3e50]">Converted Values</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(`ppm: ${formatNumber(results.ppm)}, mg/m³: ${formatNumber(results.mgM3)}, lb/MMBtu: ${formatNumber(results.lbMMBtu)}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] rounded-lg transition-colors text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2c3e50] hover:bg-[#34495e] text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  <Download size={16} />
                  Export PDF
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-[#7f8c8d] mb-1">ppm</p>
                <p className="text-lg md:text-2xl font-bold text-[#2c3e50]">{formatNumber(results.ppm)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-[#7f8c8d] mb-1">mg/m³</p>
                <p className="text-lg md:text-2xl font-bold text-[#2c3e50]">{formatNumber(results.mgM3)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-[#7f8c8d] mb-1">lb/MMBtu</p>
                <p className="text-lg md:text-2xl font-bold text-[#2c3e50]">{formatNumber(results.lbMMBtu, 4)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">Compliance Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#34495e]">EPA Standards</h4>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                  >
                    {FUEL_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {epaCompliance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded border border-gray-200">
                      <span className="text-[#34495e]">NOx: {formatNumber(epaCompliance.noxMeasured)} / {epaCompliance.noxLimit} mg/m³</span>
                      <span className={epaCompliance.noxCompliant ? 'text-green-600' : 'text-red-600'}>
                        {epaCompliance.noxCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded border border-gray-200">
                      <span className="text-[#34495e]">CO: {formatNumber(epaCompliance.coMeasured)} / {epaCompliance.coLimit} mg/m³</span>
                      <span className={epaCompliance.coCompliant ? 'text-green-600' : 'text-red-600'}>
                        {epaCompliance.coCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className={`p-3 rounded text-center font-semibold ${epaCompliance.overallCompliant ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                      {epaCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#34495e]">EU Standards</h4>
                  <select
                    value={euFuelType}
                    onChange={(e) => setEuFuelType(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                  >
                    {EU_FUEL_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {euCompliance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded border border-gray-200">
                      <span className="text-[#34495e]">NOx: {formatNumber(euCompliance.noxMeasured)} / {euCompliance.noxLimit} mg/m³</span>
                      <span className={euCompliance.noxCompliant ? 'text-green-600' : 'text-red-600'}>
                        {euCompliance.noxCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded border border-gray-200">
                      <span className="text-[#34495e]">CO: {formatNumber(euCompliance.coMeasured)} / {euCompliance.coLimit} mg/m³</span>
                      <span className={euCompliance.coCompliant ? 'text-green-600' : 'text-red-600'}>
                        {euCompliance.coCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className={`p-3 rounded text-center font-semibold ${euCompliance.overallCompliant ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                      {euCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">Annual Emissions Estimation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#34495e] mb-2">NOx (mg/m³)</label>
                <input
                  type="text"
                  value={noxValue}
                  onChange={(e) => handleValueChange(setNoxValue, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#34495e] mb-2">CO (mg/m³)</label>
                <input
                  type="text"
                  value={coValue}
                  onChange={(e) => handleValueChange(setCoValue, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#34495e] mb-2">Flue Gas Flow (m³/h)</label>
                <input
                  type="text"
                  value={flueGasFlow}
                  onChange={(e) => handleValueChange(setFlueGasFlow, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#34495e] mb-2">Annual Hours</label>
                <input
                  type="text"
                  value={annualHours}
                  onChange={(e) => handleValueChange(setAnnualHours, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-[#7f8c8d] mb-1">Hourly (kg)</p>
                <p className="text-lg md:text-2xl font-bold text-[#2c3e50]">{formatNumber(annualEmissions.hourlyKg)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-[#7f8c8d] mb-1">Annual (tons)</p>
                <p className="text-lg md:text-2xl font-bold text-[#2c3e50]">{formatNumber(annualEmissions.annualTons)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-[#7f8c8d] mb-1">Monthly (tons)</p>
                <p className="text-lg md:text-2xl font-bold text-[#2c3e50]">{formatNumber(annualEmissions.monthlyTons)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-10 px-6 mt-16">
        <div className="flex justify-center gap-8 mb-5 flex-wrap">
          <Link to="/" className="text-sm hover:text-white transition-colors">Home</Link>
          <Link to="/unit-converter" className="text-sm hover:text-white transition-colors">Converter</Link>
          <a href="#privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
      </footer>
    </div>
  );
}
