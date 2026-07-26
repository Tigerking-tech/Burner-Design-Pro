import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { Navbar } from '../components/Navbar'
import {
  addCoverPage,
  drawPageHeader,
  drawSectionTitle,
  drawSubSectionTitle,
  drawInfoTable,
  drawResultCard,
  drawTwoColumnTables,
  drawBulletList,
  drawPageFooter,
  addDisclaimerPage,
  checkPageBreak,
  MARGIN_LEFT,
  CONTENT_WIDTH,
  PAGE_HEIGHT,
  COLORS,
  sanitizeText,
  setTextColor,
  setFillColor,
  setDrawColor,
  formatNumber as pdfFormatNumber,
} from '../utils/pdfUtils'

const POLLUTANTS = ['NOx', 'CO', 'CO2', 'SOx'];

const MOLECULAR_WEIGHTS = {
  'NOx': 46.01,
  'CO': 28.01,
  'CO2': 44.01,
  'SOx': 64.06
};

const FD_FACTORS: Record<string, number> = {
  'natural_gas': 8710,
  'natural_gas_low': 8710,
  'natural_gas_high': 8710,
  'diesel': 9190,
  'diesel_low': 9190,
  'heavy_oil': 9190,
  'heavy_oil_low': 9190,
  'coal': 9780,
  'solid': 9780
};

const K_FACTORS: Record<string, number> = {
  'NOx': 1.194e-7,
  'SOx': 1.660e-7
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

const mgM3ToLbMMBtu = (mg: number, o2Ref: number, fuelType: string, mw: number, pollutant: string) => {
  const fd = FD_FACTORS[fuelType] || 8710;
  const ppm = mgM3ToPpm(mg, mw);
  const k = K_FACTORS[pollutant] || (mw / (385.3 * 1e6));
  return ppm * k * fd * (20.9 / (20.9 - o2Ref));
};

const lbMMBtuToMgM3 = (lbMMBtu: number, o2Ref: number, fuelType: string, mw: number, pollutant: string) => {
  const fd = FD_FACTORS[fuelType] || 8710;
  const k = K_FACTORS[pollutant] || (mw / (385.3 * 1e6));
  const ppm = lbMMBtu / (k * fd * (20.9 / (20.9 - o2Ref)));
  return ppmToMgM3(ppm, mw);
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
  
  let ppm: number, mgM3: number, lbMMBtu: number;
  
  if (fromUnit === 'ppm') {
    ppm = o2Correction(value, o2Measured, o2Reference);
    mgM3 = ppmToMgM3(ppm, mw);
    lbMMBtu = mgM3ToLbMMBtu(mgM3, o2Reference, fuelType, mw, pollutant);
  } else if (fromUnit === 'mg_m3') {
    mgM3 = o2Correction(value, o2Measured, o2Reference);
    ppm = mgM3ToPpm(mgM3, mw);
    lbMMBtu = mgM3ToLbMMBtu(mgM3, o2Reference, fuelType, mw, pollutant);
  } else {
    lbMMBtu = value;
    mgM3 = lbMMBtuToMgM3(value, o2Reference, fuelType, mw, pollutant);
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
  const hourlyKg = concentrationMgM3 * flueGasFlow * 1e-6;
  const annualTons = hourlyKg * annualHours * loadFactor * 1e-3;
  const monthlyTons = annualTons / 12;
  
  return { hourlyKg, annualTons, monthlyTons };
};

const formatNumber = (num: number, decimals: number = 2) => {
  if (isNaN(num) || !isFinite(num)) return '0';
  return num.toFixed(decimals);
};

export default function EmissionPage() {
  const [pollutant, setPollutant] = useState('NOx')
  const [value, setValue] = useState('100')
  const [fromUnit, setFromUnit] = useState('ppm')
  const [o2Measured, setO2Measured] = useState('5')
  const [o2Reference, setO2Reference] = useState('3')
  const [fuelType, setFuelType] = useState('natural_gas_low')
  const [euFuelType, setEuFuelType] = useState('natural_gas')
  const [noxValue, setNoxValue] = useState('100')
  const [coValue, setCoValue] = useState('80')
  const [co2Value, setCo2Value] = useState('120000')
  const [so2Value, setSo2Value] = useState('30')
  const [flueGasFlow, setFlueGasFlow] = useState('1000')
  const [annualHours, setAnnualHours] = useState('8000')
  const [loadFactor, setLoadFactor] = useState('0.8');
  
  const [results, setResults] = useState({ ppm: 0, mgM3: 0, lbMMBtu: 0 });
  const [epaCompliance, setEpaCompliance] = useState<any>(null);
  const [euCompliance, setEuCompliance] = useState<any>(null);
  const [annualEmissions, setAnnualEmissions] = useState<Record<string, any>>({
    NOx: { hourlyKg: 0, annualTons: 0, monthlyTons: 0 },
    CO: { hourlyKg: 0, annualTons: 0, monthlyTons: 0 },
    CO2: { hourlyKg: 0, annualTons: 0, monthlyTons: 0 },
    SOx: { hourlyKg: 0, annualTons: 0, monthlyTons: 0 },
    totalAnnualTons: 0,
  });

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
    const factor = parseFloat(loadFactor) || 0;
    const co2 = parseFloat(co2Value) || 0;
    const so2 = parseFloat(so2Value) || 0;
    
    const noxResult = calculateAnnualEmissions(nox, flow, hours, factor);
    const coResult = calculateAnnualEmissions(co, flow, hours, factor);
    const co2Result = calculateAnnualEmissions(co2, flow, hours, factor);
    const so2Result = calculateAnnualEmissions(so2, flow, hours, factor);
    const totalAnnual = noxResult.annualTons + coResult.annualTons + co2Result.annualTons + so2Result.annualTons;
    
    setAnnualEmissions({
      NOx: noxResult,
      CO: coResult,
      CO2: co2Result,
      SOx: so2Result,
      totalAnnualTons: totalAnnual,
    });
  }, [value, fromUnit, pollutant, o2Measured, o2Reference, fuelType, euFuelType, noxValue, coValue, co2Value, so2Value, flueGasFlow, annualHours, loadFactor]);

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
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const fuelLabel = FUEL_TYPES.find(f => f.value === fuelType)?.label || fuelType;
    const euFuelLabel = EU_FUEL_TYPES.find(f => f.value === euFuelType)?.label || euFuelType;

    addCoverPage(doc, {
      title: 'Emission Analysis Report',
      subtitle: 'NOx, CO, CO2, SO2 emission calculations per EPA Method 19, IPCC 2006 & EU IED',
      reportType: 'Emission Analysis',
      standard: 'EPA Method 19 · IPCC 2006 · EU IED',
    });

    let y = drawPageHeader(doc, 'Emission Analysis Report', 'Calculation Results');

    y = drawSectionTitle(doc, 'Input Parameters', y, 'User-provided emission data and reference settings');

    y = drawTwoColumnTables(
      doc,
      {
        title: 'Emission Input',
        rows: [
          ['Pollutant', pollutant],
          ['Input Value', `${value} ${fromUnit === 'ppm' ? 'ppm' : fromUnit === 'mg_m3' ? 'mg/m3' : 'lb/MMBtu'}`],
          ['Measured O2', `${o2Measured}%`],
          ['Reference O2', `${o2Reference}%`],
        ]
      },
      {
        title: 'Fuel Types',
        rows: [
          ['EPA Fuel Type', fuelLabel],
          ['EU Fuel Type', euFuelLabel],
          ['NOx (for compliance)', `${noxValue} mg/m3`],
          ['CO (for compliance)', `${coValue} mg/m3`],
        ]
      },
      y
    );

    y = checkPageBreak(doc, y, 60, 'Emission Analysis Report', 'Calculation Results');
    y = drawSectionTitle(doc, 'Converted Values', y, 'All units converted with O2 correction');

    const cardWidth = (CONTENT_WIDTH - 16) / 3;
    drawResultCard(doc, {
      label: 'ppm',
      value: pdfFormatNumber(results.ppm),
      x: MARGIN_LEFT,
      y: y,
      width: cardWidth,
      highlight: true,
    });
    drawResultCard(doc, {
      label: 'mg/m3',
      value: pdfFormatNumber(results.mgM3),
      x: MARGIN_LEFT + cardWidth + 8,
      y: y,
      width: cardWidth,
      highlight: true,
    });
    drawResultCard(doc, {
      label: 'lb/MMBtu',
      value: pdfFormatNumber(results.lbMMBtu, 4),
      x: MARGIN_LEFT + (cardWidth + 8) * 2,
      y: y,
      width: cardWidth,
      highlight: true,
    });
    y += 37;

    y = checkPageBreak(doc, y, 120, 'Emission Analysis Report', 'Compliance Status');
    y = drawSectionTitle(doc, 'Compliance Status', y, 'EPA 40 CFR Part 60 & EU IED 2010/75 compliance check');

    if (epaCompliance && euCompliance) {
      y = drawTwoColumnTables(
        doc,
        {
          title: 'EPA Standards - ' + fuelLabel,
          rows: [
            ['NOx', `${pdfFormatNumber(epaCompliance.noxMeasured)} / ${epaCompliance.noxLimit} mg/m3  ${epaCompliance.noxCompliant ? '[x] PASS' : '[ ] FAIL'}`],
            ['CO', `${pdfFormatNumber(epaCompliance.coMeasured)} / ${epaCompliance.coLimit} mg/m3  ${epaCompliance.coCompliant ? '[x] PASS' : '[ ] FAIL'}`],
            ['Overall Status', epaCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'],
          ]
        },
        {
          title: 'EU Standards - ' + euFuelLabel,
          rows: [
            ['NOx', `${pdfFormatNumber(euCompliance.noxMeasured)} / ${euCompliance.noxLimit} mg/m3  ${euCompliance.noxCompliant ? '[x] PASS' : '[ ] FAIL'}`],
            ['CO', `${pdfFormatNumber(euCompliance.coMeasured)} / ${euCompliance.coLimit} mg/m3  ${euCompliance.coCompliant ? '[x] PASS' : '[ ] FAIL'}`],
            ['Overall Status', euCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'],
          ]
        },
        y
      );
    }

    y = checkPageBreak(doc, y, 100, 'Emission Analysis Report', 'Annual Emissions');
    y = drawSectionTitle(doc, 'Annual Emissions Estimation', y, 'Each pollutant calculated independently per EPA Method 19 / IPCC Guidelines');

    const annualRows: [string, string][] = [];
    const pollutantLabels: Record<string, string> = {
      NOx: 'NOx', CO: 'CO', CO2: 'CO2', SOx: 'SO2'
    };
    for (const key of ['NOx', 'CO', 'CO2', 'SOx'] as const) {
      const d = annualEmissions[key];
      const concVal = key === 'CO2' ? co2Value : key === 'SOx' ? so2Value : key === 'NOx' ? noxValue : coValue;
      annualRows.push([
        `${pollutantLabels[key]} (${pdfFormatNumber(parseFloat(concVal) || 0)} mg/m3)`,
        `Hourly: ${pdfFormatNumber(d.hourlyKg)} kg/h  |  Annual: ${pdfFormatNumber(d.annualTons)} tons  |  Monthly: ${pdfFormatNumber(d.monthlyTons)} tons`
      ]);
    }
    annualRows.push([
      'Total (reference sum)',
      `${pdfFormatNumber(annualEmissions.totalAnnualTons)} tons/year (not used for compliance)`
    ]);
    y = drawInfoTable(doc, annualRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Multi-Pollutant Emission Summary',
      labelWidthRatio: 0.38,
    });
    y += 4;

    y = drawBulletList(doc, [
      'Formula: Emission (kg/h) = Concentration (mg/m3) x Flow (m3/h) x 10^-6',
      'Each pollutant calculated independently. Sum is for reference only.',
    ], MARGIN_LEFT, y, CONTENT_WIDTH);
    y += 6;

    y = checkPageBreak(doc, y, 50, 'Emission Analysis Report', 'Operating Parameters');
    y = drawSubSectionTitle(doc, 'Operating Parameters', y);
    y = drawInfoTable(doc, [
      ['Flue Gas Flow', `${flueGasFlow} m3/h`],
      ['Annual Operating Hours', `${annualHours} h`],
      ['Load Factor', `${Math.round(parseFloat(loadFactor) * 100)}%`],
    ], MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);

    addDisclaimerPage(doc, {
      title: 'EMISSION ANALYSIS DISCLAIMER',
    });

    drawPageFooter(doc);

    doc.save('emission-analysis-report.pdf');
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <section className="bg-slate-900 dark:bg-slate-800 text-white py-12 sm:py-16 px-4 sm:px-6 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Emission Analysis</h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
            NOx, CO, CO₂, SO₂ emission calculations per EPA Method 19, IPCC 2006 & EU IED compliance.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Inline Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3 mb-8">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-400">Professional Engineering Judgment Required</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Results are for reference only. Ensure compliance with local EPA and EU IED regulations 
              by consulting qualified environmental engineers.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 sm:p-8 transition-colors duration-200">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Emissions Estimation & Compliance</h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {POLLUTANTS.map((p) => (
              <button
                key={p}
                onClick={() => setPollutant(p)}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors text-sm ${
                  pollutant === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-5 border border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Input Value</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    {pollutant} Value
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleValueChange(setValue, e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Unit</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
                  >
                    <option value="ppm">ppm</option>
                    <option value="mg_m3">mg/m³</option>
                    <option value="lb_MMBtu">lb/MMBtu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-5 border border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">O₂ Reference Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Measured O₂ (%)</label>
                  <input
                    type="text"
                    value={o2Measured}
                    onChange={(e) => handleValueChange(setO2Measured, e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Reference O₂ (%)</label>
                  <input
                    type="text"
                    value={o2Reference}
                    onChange={(e) => handleValueChange(setO2Reference, e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setO2Reference('3'); }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                  >
                    EPA 3%
                  </button>
                  <button
                    onClick={() => { setO2Reference('3'); }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                  >
                    EU 3%
                  </button>
                  <button
                    onClick={() => { setO2Reference('6'); }}
                    className="px-3 py-1.5 bg-slate-600 dark:bg-white/10 text-white dark:text-slate-300 rounded-lg hover:bg-slate-700 dark:hover:bg-white/20 text-sm font-semibold transition-colors"
                  >
                    EU 6%
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-5 mb-6 border border-blue-100 dark:border-blue-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Converted Values</h3>
              <button
                onClick={() => copyToClipboard(`ppm: ${formatNumber(results.ppm)}, mg/m³: ${formatNumber(results.mgM3)}, lb/MMBtu: ${formatNumber(results.lbMMBtu)}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-semibold w-fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white dark:bg-white/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">ppm</p>
                <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-300">{formatNumber(results.ppm)}</p>
              </div>
              <div className="bg-white dark:bg-white/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">mg/m³</p>
                <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-300">{formatNumber(results.mgM3)}</p>
              </div>
              <div className="bg-white dark:bg-white/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">lb/MMBtu</p>
                <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-300">{formatNumber(results.lbMMBtu, 4)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-5 mb-6 border border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Compliance Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-2">
              <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">EPA Standards</h4>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200 w-full sm:w-auto"
                  >
                    {FUEL_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {epaCompliance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="text-sm text-slate-600 dark:text-slate-300">NOx: {formatNumber(epaCompliance.noxMeasured)} / {epaCompliance.noxLimit} mg/m³</span>
                      <span className={`text-sm font-semibold ${epaCompliance.noxCompliant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {epaCompliance.noxCompliant ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="text-sm text-slate-600 dark:text-slate-300">CO: {formatNumber(epaCompliance.coMeasured)} / {epaCompliance.coLimit} mg/m³</span>
                      <span className={`text-sm font-semibold ${epaCompliance.coCompliant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {epaCompliance.coCompliant ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl text-center font-semibold text-sm ${epaCompliance.overallCompliant ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/30'}`}>
                      {epaCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">EU Standards</h4>
                  <select
                    value={euFuelType}
                    onChange={(e) => setEuFuelType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200 w-full sm:w-auto"
                  >
                    {EU_FUEL_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {euCompliance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="text-sm text-slate-600 dark:text-slate-300">NOx: {formatNumber(euCompliance.noxMeasured)} / {euCompliance.noxLimit} mg/m³</span>
                      <span className={`text-sm font-semibold ${euCompliance.noxCompliant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {euCompliance.noxCompliant ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="text-sm text-slate-600 dark:text-slate-300">CO: {formatNumber(euCompliance.coMeasured)} / {euCompliance.coLimit} mg/m³</span>
                      <span className={`text-sm font-semibold ${euCompliance.coCompliant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {euCompliance.coCompliant ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl text-center font-semibold text-sm ${euCompliance.overallCompliant ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/30'}`}>
                      {euCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-5 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Annual Emissions Estimation</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/10 px-2.5 py-1 rounded-full">EPA Method 19 · IPCC</span>
            </div>
            
            <div className="mb-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Each pollutant is calculated independently following EPA Method 19 and IPCC Guidelines. 
                Concentrations use measured (not O₂-corrected) values for mass emission accounting.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">NOx (mg/m³)</label>
                <input
                  type="text"
                  value={noxValue}
                  onChange={(e) => handleValueChange(setNoxValue, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">CO (mg/m³)</label>
                <input
                  type="text"
                  value={coValue}
                  onChange={(e) => handleValueChange(setCoValue, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">CO₂ (mg/m³)</label>
                <input
                  type="text"
                  value={co2Value}
                  onChange={(e) => handleValueChange(setCo2Value, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">SO₂ (mg/m³)</label>
                <input
                  type="text"
                  value={so2Value}
                  onChange={(e) => handleValueChange(setSo2Value, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Flue Gas Flow (m³/h)</label>
                <input
                  type="text"
                  value={flueGasFlow}
                  onChange={(e) => handleValueChange(setFlueGasFlow, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Annual Operating Hours</label>
                <input
                  type="text"
                  value={annualHours}
                  onChange={(e) => handleValueChange(setAnnualHours, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Load Factor</label>
                <input
                  type="text"
                  value={loadFactor}
                  onChange={(e) => handleValueChange(setLoadFactor, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white text-sm transition-colors"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-white/5">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Pollutant</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Concentration</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Hourly</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Annual</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Monthly</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {[
                      { key: 'NOx', label: 'NOx', conc: noxValue, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                      { key: 'CO', label: 'CO', conc: coValue, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                      { key: 'CO2', label: 'CO₂', conc: co2Value, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                      { key: 'SOx', label: 'SO₂', conc: so2Value, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    ].map((p) => {
                      const data = annualEmissions[p.key];
                      return (
                        <tr key={p.key} className={`${p.bg} transition-colors`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${p.bg.replace('50', '400')}`} style={{ backgroundColor: 'currentColor' }} />
                              <span className={`font-semibold ${p.color}`}>{p.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{formatNumber(parseFloat(p.conc) || 0)} <span className="text-xs text-slate-400">mg/m³</span></td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium tabular-nums">{formatNumber(data.hourlyKg)} <span className="text-xs text-slate-400">kg/h</span></td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-bold tabular-nums">{formatNumber(data.annualTons)} <span className="text-xs text-slate-400">tons</span></td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{formatNumber(data.monthlyTons)} <span className="text-xs text-slate-400">tons</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
                      <td colSpan={3} className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-right italic">
                        Sum of all pollutants (reference only — not used for compliance)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatNumber(annualEmissions.totalAnnualTons)} <span className="text-xs text-slate-400">tons</span>
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Formula:</span> 
                Hourly Emission (kg/h) = Concentration (mg/m³) × Flue Gas Flow (m³/h) × 10⁻⁶<br/>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Annual:</span> 
                Annual Emission (tons) = Hourly × Operating Hours × Load Factor × 10⁻³
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={exportToPDF}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              <Download size={20} />
              Export PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
