import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'recharts';

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

const ppmToMgM3 = (ppm: number, mw: number) => ppm * mw / 22.4;
const mgM3ToPpm = (mg: number, mw: number) => mg * 22.4 / mw;

const o2Correction = (value: number, o2Measured: number, o2Reference: number) => {
  if (o2Measured >= 20.9) return value;
  return value * (20.9 - o2Reference) / (20.9 - o2Measured);
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
  o2Ref: number,
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
  const [pollutant, setPollutant] = useState('NOx');
  const [value, setValue] = useState('100');
  const [fromUnit, setFromUnit] = useState('ppm');
  const [o2Measured, setO2Measured] = useState('5');
  const [o2Reference, setO2Reference] = useState('3');
  const [fuelType, setFuelType] = useState('natural_gas_low');
  const [euFuelType, setEuFuelType] = useState('natural_gas');
  const [noxValue, setNoxValue] = useState('100');
  const [coValue, setCoValue] = useState('80');
  const [flueGasFlow, setFlueGasFlow] = useState('1000');
  const [annualHours, setAnnualHours] = useState('8000');
  const [loadFactor, setLoadFactor] = useState('0.8');
  
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
    const factor = parseFloat(loadFactor) || 0;
    const conc = converted.mgM3;
    
    setAnnualEmissions(calculateAnnualEmissions(conc, flow, hours, factor));
  }, [value, fromUnit, pollutant, o2Measured, o2Reference, fuelType, euFuelType, noxValue, coValue, flueGasFlow, annualHours, loadFactor]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const chartData = [
    { name: 'NOx', measured: results.ppm, epaLimit: epaCompliance?.noxLimit || 0, euLimit: euCompliance?.noxLimit || 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors mr-6">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Emissions Estimation & Compliance</h1>

          {/* Pollutant Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {POLLUTANTS.map((p) => (
              <button
                key={p}
                onClick={() => setPollutant(p)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  pollutant === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Value Input */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Input Value</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {pollutant} Value
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ppm">ppm</option>
                    <option value="mg_m3">mg/m³</option>
                    <option value="lb_MMBtu">lb/MMBtu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* O2 Settings */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">O₂ Reference Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Measured O₂ (%)</label>
                  <input
                    type="number"
                    value={o2Measured}
                    onChange={(e) => setO2Measured(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reference O₂ (%)</label>
                  <input
                    type="number"
                    value={o2Reference}
                    onChange={(e) => setO2Reference(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setO2Reference('3'); }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  >
                    EPA 3%
                  </button>
                  <button
                    onClick={() => { setO2Reference('3'); }}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                  >
                    EU 3%
                  </button>
                  <button
                    onClick={() => { setO2Reference('6'); }}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                  >
                    EU 6%
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Converted Values</h3>
              <button
                onClick={() => copyToClipboard(`ppm: ${formatNumber(results.ppm)}, mg/m³: ${formatNumber(results.mgM3)}, lb/MMBtu: ${formatNumber(results.lbMMBtu)}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">ppm</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(results.ppm)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">mg/m³</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(results.mgM3)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">lb/MMBtu</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(results.lbMMBtu, 4)}</p>
              </div>
            </div>
          </div>

          {/* Compliance Section */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Compliance Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* EPA */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-700">EPA Standards</h4>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FUEL_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {epaCompliance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-700">NOx: {formatNumber(epaCompliance.noxMeasured)} / {epaCompliance.noxLimit} mg/m³</span>
                      <span className={epaCompliance.noxCompliant ? 'text-green-600' : 'text-red-600'}>
                        {epaCompliance.noxCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-700">CO: {formatNumber(epaCompliance.coMeasured)} / {epaCompliance.coLimit} mg/m³</span>
                      <span className={epaCompliance.coCompliant ? 'text-green-600' : 'text-red-600'}>
                        {epaCompliance.coCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className={`p-3 rounded text-center font-semibold ${epaCompliance.overallCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {epaCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </div>
                  </div>
                )}
              </div>

              {/* EU */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-700">EU Standards</h4>
                  <select
                    value={euFuelType}
                    onChange={(e) => setEuFuelType(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EU_FUEL_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {euCompliance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-700">NOx: {formatNumber(euCompliance.noxMeasured)} / {euCompliance.noxLimit} mg/m³</span>
                      <span className={euCompliance.noxCompliant ? 'text-green-600' : 'text-red-600'}>
                        {euCompliance.noxCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-700">CO: {formatNumber(euCompliance.coMeasured)} / {euCompliance.coLimit} mg/m³</span>
                      <span className={euCompliance.coCompliant ? 'text-green-600' : 'text-red-600'}>
                        {euCompliance.coCompliant ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className={`p-3 rounded text-center font-semibold ${euCompliance.overallCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {euCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Annual Estimation */}
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Annual Emissions Estimation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOx (mg/m³)</label>
                <input
                  type="number"
                  value={noxValue}
                  onChange={(e) => setNoxValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CO (mg/m³)</label>
                <input
                  type="number"
                  value={coValue}
                  onChange={(e) => setCoValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Flue Gas Flow (m³/h)</label>
                <input
                  type="number"
                  value={flueGasFlow}
                  onChange={(e) => setFlueGasFlow(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Annual Hours</label>
                <input
                  type="number"
                  value={annualHours}
                  onChange={(e) => setAnnualHours(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Hourly (kg)</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(annualEmissions.hourlyKg)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Annual (tons)</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(annualEmissions.annualTons)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Monthly (tons)</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(annualEmissions.monthlyTons)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
