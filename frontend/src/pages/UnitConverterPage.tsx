import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import SeoContentSection from '../components/SeoContentSection';
import { useSEO } from '../hooks/useSEO';
import { usePersistentState } from '../hooks/usePersistentState';

const UNITS = {
  "Pressure": {
    "Pa": 1.0,
    "kPa": 1000.0,
    "mm H₂O": 9.80665,
    "mm Hg": 133.322368421,
    "kg/cm²": 98066.5,
    "bar": 100000.0,
    "mbar": 100.0,
    "atm": 101325.0,
    "g/cm²": 98.0665,
    "in. H₂O": 249.08891,
    "in. Hg": 3386.3881578934,
    "psi = lb/in.²": 6894.757293178,
    "oz/in.²": 430.922330823625
  },
  "Angle": {
    "Radian": 1.0,
    "Degree": 0.0174532925199433
  },
  "Area": {
    "mm²": 1.0,
    "cm²": 100.0,
    "m²": 1000000.0,
    "in²": 645.16,
    "ft²": 92903.04
  },
  "Density": {
    "g/cm³": 1.0,
    "kg/m³": 0.001,
    "lb/in³": 27.6799047102031,
    "lb/ft³": 0.0160184633739601,
    "kg/Litre": 1.0,
    "lb/Gal(US)": 0.119826427316897
  },
  "Energy": {
    "cal": 1.0,
    "Kcal": 1000.0,
    "Joule": 0.239005736137667,
    "GigaJoule": 2.390057361377e+08,
    "Btu": 252.164400721797,
    "Million Btu": 2.521644007218e+08,
    "W*h": 860.420650095602,
    "Horsepower*h": 641615.568642447,
    "kg*m": 2.34384560229445,
    "lb*ft": 0.324048266809608,
    "N*m": 0.239005736137667,
    "MJ": 239005.736137667
  },
  "Force": {
    "g force": 1.0,
    "kg force": 1000.0,
    "Poundal": 14.0980818501731,
    "N": 101.971621297793,
    "lb force": 453.59237,
    "Dyne": 0.00101971621297793
  },
  "Heat Content (Volume)": {
    "Cal/cm³": 1.0,
    "Kcal/m³": 0.001,
    "Btu/ft³": 0.00890510177051417,
    "J/m³": 2.390057361377e-07
  },
  "Heat Content (nm³, scf)": {
    "MJ/nm³": 1.0,
    "kcal/nm³": 0.004184,
    "MJ/sm³": 1.054914881933,
    "kcal/sm³": 0.00441376386600769,
    "Btu/scf": 0.0393807968107789,
    "kW-hr/nm³": 3.6
  },
  "Heat Content (Mass)": {
    "Cal/g": 1.0,
    "Kcal/kg": 1.0,
    "Btu/lb": 0.555927342256214,
    "J/kg": 0.000239005736137667,
    "kW*h/kg": 860.420650095602
  },
  "Length": {
    "µm": 1.0,
    "mm": 1000.0,
    "cm": 10000.0,
    "m": 1000000.0,
    "inch": 25400.0,
    "ft": 304800.0,
    "mile": 1609344000.0,
    "km": 1000000000.0
  },
  "Power": {
    "N*m/sec": 1.0,
    "Kcal/hr": 1.16222222222222,
    "kW": 1000.0,
    "W": 1.0,
    "MegaWatt": 1000000.0,
    "Joules/sec": 1.0,
    "GigaJoule/hr": 277777.777777778,
    "Horsepower": 745.699872,
    "Btu/hr": 0.293071070172222,
    "Million Btu/hr": 293071.070172222,
    "MJ/hr": 277.777777777778,
    "ft*lb/sec": 1.3558179483314
  },
  "Heat Flux": {
    "cal/(cm²*sec)": 1.0,
    "Kcal/(m²*h)": 2.777777777780e-05,
    "W/m²": 2.390057361377e-05,
    "kW/m²": 0.0239005736137667,
    "Btu/(ft²*h)": 7.539652832369e-05,
    "Btu/(in²*h)": 0.0108571000786109
  },
  "Heat Transfer Coefficient": {
    "Kcal/(m²*h*°C)": 1.0,
    "W/(m²*K)": 0.860420650095602,
    "Btu/(ft²*h*°F)": 4.88569503537489,
    "Btu/(in²*h*°F)": 703.540085093985
  },
  "Mass": {
    "mg": 1.0,
    "g": 1000.0,
    "kg": 1000000.0,
    "ton (metric)": 1000000000.0,
    "lbs": 453592.37,
    "oz": 28349.523125,
    "ton (imperial)": 1.016046908800e+09,
    "ton (US)": 907184740.0
  },
  "Specific Heat": {
    "cal/(g*°C)": 1.0,
    "kcal/(kg*°C)": 1.0,
    "Joule/(kg*K)": 0.000239005736137667,
    "Btu/(lb*°F)": 1.00066921606119
  },
  "Standard/Normal Volume": {
    "nm³ (0°C, 1013 mbar)": 1.0,
    "sm³ (15 °C, 1013 mbar)": 0.947943779281624,
    "scf (60 °F, 14.696 psi)": 0.0267911250676172
  },
  "Thermal Conductivity": {
    "kcal/(m*h*°C)": 1.0,
    "W/(m*°C)": 0.860420650095602,
    "Btu*ft/(ft²*h*°F)": 1.48915984678227,
    "Btu*in/(ft²*h*°F)": 0.124096653898522
  },
  "Torque": {
    "N*m": 1.0,
    "N*cm": 0.01,
    "N*mm": 0.001,
    "dyn*m": 1.000000000000e-05,
    "dyn*cm": 1.000000000000e-07,
    "dyn*mm": 1.000000000000e-08,
    "kg-force*m": 9.80665,
    "kg-force*cm": 0.0980665,
    "lb-force*ft": 1.3558179483314,
    "lb-force*in.": 0.112984829027616
  },
  "Velocity": {
    "cm/s": 1.0,
    "m/s": 100.0,
    "km/s": 100000.0,
    "km/h": 27.7777777778,
    "in./s": 2.54,
    "ft/s": 30.48,
    "miles/h": 44.704
  },
  "Viscosity Absolute": {
    "Pa*s": 1.0,
    "Poise": 0.1,
    "kg/(m*h)": 0.000277777777777778,
    "centipoise": 0.001,
    "lb/(ft*h)": 0.000413378873213765
  },
  "Viscosity Kinematic": {
    "m²/sec": 1.0,
    "ft²/sec": 0.09290304,
    "ft²/h": 2.580640000000e-05,
    "centistoke": 1.000000000000e-06,
    "stoke": 0.0001
  },
  "Fuel oil kinematic viscosity": {
    "Centistokes": 1.0,
    "SSU (Saybolt Univers.)": 1.0,
    "SSF (Saybolt Furol)": 1.0,
    "SR1 (Redwood Standard)": 1.0,
    "Degrees Engler": 1.0,
    "ft²/sec": 1.0
  },
  "Volume": {
    "cm³": 1.0,
    "m³": 1000000.0,
    "dm³": 1000.0,
    "Liter": 1000.0,
    "US gal": 3785.411784,
    "in.³": 16.387064,
    "ft³": 28316.846592,
    "quart": 946.352946,
    "pint": 473.176473
  },
  "Flow rate": {
    "cm³/s": 1.0,
    "m³/s": 1000000.0,
    "m³/h": 277.777777778,
    "Liter/h": 0.2777777778,
    "ft³/s": 28316.846592,
    "ft³/min": 471.9474432,
    "ft³/h": 7.86579072,
    "m³/min": 16666.6666667,
    "US gal/s": 3785.411784,
    "US gal/min": 63.0901964,
    "US gal/h": 1.05150327
  },
  "Burner capacity": {
    "kW (Hu)": 1.0,
    "10³ BTU/h (Ho), Natural gas NG (Ho/Hu = 1.108)": 0.2644104,
    "10³ BTU/h (Ho), Propane/Butane LPG (Ho/Hu = 1.084)": 0.2700513,
    "10³ BTU/h (Ho), Coke oven gas COG (Ho/Hu = 1.13)": 0.2592689
  },
  "Temperature": {
    "Fahrenheit": 0.0,
    "Celsius": 0.0,
    "Kelvin": 0.0
  }
};

const CATEGORIES = Object.keys(UNITS);

const convertTemperature = (value: number, fromUnit: string, toUnit: string): number => {
  let celsius: number;
  
  if (fromUnit === "Celsius") {
    celsius = value;
  } else if (fromUnit === "Fahrenheit") {
    celsius = (value - 32) * 5 / 9;
  } else if (fromUnit === "Kelvin") {
    celsius = value - 273.15;
  } else {
    return value;
  }
  
  if (toUnit === "Celsius") {
    return celsius;
  } else if (toUnit === "Fahrenheit") {
    return celsius * 9 / 5 + 32;
  } else if (toUnit === "Kelvin") {
    return celsius + 273.15;
  }
  return value;
};

const convert = (value: number, fromUnit: string, toUnit: string, category: string): number => {
  if (category === "Temperature") {
    return convertTemperature(value, fromUnit, toUnit);
  }
  
  const units = UNITS[category as keyof typeof UNITS];
  if (!units || !(fromUnit in units) || !(toUnit in units)) {
    return value;
  }
  
  const baseValue = value * units[fromUnit as keyof typeof units];
  return baseValue / units[toUnit as keyof typeof units];
};

const convertAll = (value: number, fromUnit: string, category: string) => {
  const units = Object.keys(UNITS[category as keyof typeof UNITS]);
  const results: Record<string, number> = {};
  
  for (const unit of units) {
    results[unit] = convert(value, fromUnit, unit, category);
  }
  
  return results;
};

const formatNumber = (num: number): string => {
  if (isNaN(num) || !isFinite(num)) return "0";
  
  if (Math.abs(num) >= 1e10 || (Math.abs(num) < 0.0001 && num !== 0)) {
    return num.toExponential(6);
  }
  
  const rounded = Math.round(num * 1e10) / 1e10;
  const str = rounded.toString();
  
  if (str.indexOf('.') !== -1 && str.length > 12) {
    return num.toPrecision(8);
  }
  
  return str;
};

export default function UnitConverterPage() {
  useSEO({
    title: 'Engineering Unit Converter | Flow, Pressure, Temperature',
    description:
      'Convert flow, pressure, temperature & viscosity units per ISO 80000, ASTM D2161 & ISO 13443. Free, instant, browser-based.',
    canonicalPath: '/unit-converter',
    ogTitle: 'Engineering Unit Converter',
    ogDescription:
      'Convert flow, pressure, temperature units per ISO 80000. Free, instant, browser-based.',
    jsonLd: {
      name: 'Engineering Unit Converter',
      url: 'https://burnerdesignpro.com/unit-converter',
      description:
        'Convert flow, pressure, temperature & viscosity units per ISO 80000, ASTM D2161 & ISO 13443.',
      offers: { price: '0', priceCurrency: 'USD' },
    },
  })

  const [category, setCategory] = usePersistentState<string>("unitconverter_category", "Pressure");
  const [value, setValue] = usePersistentState<string>("unitconverter_value", "1");
  const [fromUnit, setFromUnit] = usePersistentState<string>("unitconverter_fromUnit", "kPa");
  const [toUnit, setToUnit] = usePersistentState<string>("unitconverter_toUnit", "bar");
  const [allResults, setAllResults] = useState<Record<string, number>>({});

  useEffect(() => {
    const units = Object.keys(UNITS[category as keyof typeof UNITS]);
    if (units.length > 0) {
      if (!units.includes(fromUnit)) {
        setFromUnit(units[0]);
      }
      if (!units.includes(toUnit) && units.length > 1) {
        setToUnit(units[1]);
      }
      updateConversions(1, units[0], category);
    }
  }, [category]);

  const updateConversions = (val: number, unit: string, cat: string) => {
    const results = convertAll(val, unit, cat);
    setAllResults(results);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    
    const numVal = parseFloat(newVal);
    if (!isNaN(numVal)) {
      updateConversions(numVal, fromUnit, category);
    }
  };

  const handleFromUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setFromUnit(newUnit);
    
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      updateConversions(numVal, newUnit, category);
    }
  };

  const handleToUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToUnit(e.target.value);
  };

  const swapUnits = () => {
    const oldFrom = fromUnit;
    setFromUnit(toUnit);
    setToUnit(oldFrom);
    
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      updateConversions(numVal, toUnit, category);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const units = Object.keys(UNITS[category as keyof typeof UNITS]);
  const numValue = parseFloat(value);
  const result = isNaN(numValue) ? 0 : convert(numValue, fromUnit, toUnit, category);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <section className="bg-slate-900 dark:bg-slate-800 text-white py-12 px-6 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Unit Converter</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Convert flow, pressure, temperature & viscosity units per ISO 80000, ASTM D2161 & ISO 13443.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* Inline Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-400">Reference Only</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Conversions follow ISO 80000 (quantities &amp; units), ISO 13443 (gas reference conditions), ASTM D2161
              (Saybolt viscosity), and ITS-90 (temperature scale). Always verify critical values with authoritative
              sources before use in professional applications.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-64 bg-slate-50 dark:bg-white/5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10">
              <div className="p-4 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Categories</h2>
              </div>
              <div className="p-2 overflow-y-auto max-h-64 lg:max-h-[calc(100vh-320px)]">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      const newUnits = Object.keys(UNITS[cat as keyof typeof UNITS]);
                      setFromUnit(newUnits[0]);
                      if (newUnits.length > 1) {
                        setToUnit(newUnits[1]);
                      }
                      setValue("1");
                      updateConversions(1, newUnits[0], cat);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors mb-1 ${
                      category === cat 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{category} Converter</h2>
                <p className="text-slate-500 dark:text-slate-400">Convert between units in the {category.toLowerCase()} category</p>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-6 mb-6 border border-slate-200 dark:border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Value</label>
                    <input
                      type="text"
                      value={value}
                      onChange={handleValueChange}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-lg transition-colors duration-200"
                      placeholder="Enter value"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">From</label>
                    <select
                      value={fromUnit}
                      onChange={handleFromUnitChange}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white transition-colors duration-200"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1 flex items-end justify-center">
                    <button
                      onClick={swapUnits}
                      className="p-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 rounded-full transition-colors"
                      title="Swap units"
                    >
                      <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">To</label>
                    <select
                      value={toUnit}
                      onChange={handleToUnitChange}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white transition-colors duration-200"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Result</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatNumber(result)} <span className="text-lg font-normal text-slate-500 dark:text-slate-400">{toUnit}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatNumber(result))}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">All Conversions</h2>
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Unit</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(allResults).map(([unit, val]) => (
                          <tr key={unit} className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{unit}</td>
                            <td className="px-4 py-3 text-right text-sm font-mono text-slate-900 dark:text-white">
                              {formatNumber(val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SeoContentSection
        ariaLabel="About Unit Converter"
        title="Engineering Unit Converter"
        intro="The Unit Converter tool provides instant conversion of engineering units for flow, pressure, temperature, and viscosity according to ISO 80000 (Quantities and units), ASTM D2161 (conversion of kinematic viscosity), and ISO 13443 (natural gas — reference conditions). All conversions run locally in your browser with no server round-trips."
        blocks={[
          {
            type: 'list',
            heading: 'Supported Unit Categories',
            items: [
              'Flow rate: m³/h, m³/s, L/min, SCFM, GPM, and more',
              'Pressure: bar, Pa, kPa, MPa, psi, atm, mmHg',
              'Temperature: °C, °F, K, °R',
              'Viscosity: cSt, mm²/s, Saybolt Universal (per ASTM D2161)',
              'Energy & power: J, kJ, MJ, kWh, BTU, hp',
            ],
          },
        ]}
      />
    </div>
  );
}
