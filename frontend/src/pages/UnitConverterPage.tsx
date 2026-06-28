import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Navbar } from '../components/Navbar';

const UNITS = {
  "Pressure": {
    "Pa": 1.0,
    "kPa": 1000.0,
    "mm H₂O": 9.800003265,
    "mm Hg": 133.300137438,
    "kg/cm²": 98066.528098,
    "bar": 100000.0,
    "mbar": 100.0,
    "atm": 101300.032011,
    "g/cm²": 98.066528098,
    "in. H₂O": 248.799157947,
    "in. Hg": 3385.945719598,
    "psi": 6894.744825385,
    "oz/in.²": 430.918339727
  },
  "Angle": {
    "Radian": 1.0,
    "Degree": 0.017455139
  },
  "Area": {
    "mm²": 1.0,
    "cm²": 100.0,
    "m²": 1000000.0,
    "in²": 645.159930393,
    "ft²": 92903.10762158
  },
  "Density": {
    "g/cm³": 1.0,
    "kg/m³": 0.001,
    "lb/in³": 27.680599395,
    "lb/ft³": 0.016018422,
    "kg/Litre": 1.0,
    "lb/Gal(US)": 0.119811739
  },
  "Energy": {
    "cal": 1.0,
    "Kcal": 1000.0,
    "Joule": 0.238845856,
    "GigaJoule": 238845856.447,
    "Btu": 251.9436285,
    "Million Btu": 251943628.543,
    "W*h": 860.275150473,
    "Horsepower*h": 641025.641026,
    "kg*m": 2.34233315604,
    "lb*ft": 0.323844594,
    "N*m": 0.238845856,
    "MJ": 238845.856447
  },
  "Force": {
    "g force": 1.0,
    "kg force": 1000.0,
    "Poundal": 14.097770788,
    "N": 101.96767411,
    "lb force": 453.58767097,
    "Dyne": 0.001019716
  },
  "Heat Content (Volume)": {
    "Cal/cm³": 1.0,
    "Kcal/m³": 0.001,
    "Btu/ft³": 0.0089,
    "J/m³": 2.388458565e-4
  },
  "Heat Content (nm³, scf)": {
    "MJ/nm³": 1.0,
    "kcal/nm³": 0.0041868,
    "MJ/sm³": 1.05700083392,
    "kcal/sm³": 0.004425993,
    "Btu/scf": 0.039382708,
    "kW-hr/nm³": 3.59999712
  },
  "Heat Content (Mass)": {
    "Cal/g": 1.0,
    "Kcal/kg": 1.0,
    "Btu/lb": 0.555555556,
    "J/kg": 0.000238845856,
    "kW*h/kg": 854.855967906
  },
  "Length": {
    "µm": 1.0,
    "mm": 1000.0,
    "cm": 10000.0,
    "m": 1000000.0,
    "inch": 25400.0508001,
    "ft": 304799.918464,
    "mile": 1609343245.415,
    "km": 1000000000.0
  },
  "Power": {
    "N*m/sec": 1.0,
    "Kcal/hr": 1.16300038486,
    "kW": 1000.0,
    "W": 1.0,
    "MegaWatt": 1000000.0,
    "Joules/sec": 1.0,
    "GigaJoule/hr": 277777.777778,
    "Horsepower": 745.712155108,
    "Btu/hr": 0.29307107,
    "Million Btu/hr": 293071.070117,
    "MJ/hr": 277.777777778,
    "ft*lb/sec": 1.355817948
  },
  "Heat Flux": {
    "cal/(cm²*sec)": 1.0,
    "Kcal/(m²*h)": 0.0002777778,
    "W/m²": 0.00002388458565,
    "kW/m²": 0.02388458565,
    "Btu/(ft²*h)": 0.00007817358301,
    "Btu/(in²*h)": 0.011257492
  },
  "Heat Transfer Coefficient": {
    "Kcal/(m²*h*°C)": 1.0,
    "W/(m²*K)": 0.85984522786,
    "Btu/(ft²*h*°F)": 4.88242762713,
    "Btu/(in²*h*°F)": 703.0744201
  },
  "Mass": {
    "mg": 1.0,
    "g": 1000.0,
    "kg": 1000000.0,
    "ton (metric)": 1000000000.0,
    "lbs": 453592.370755,
    "oz": 28349.5231722,
    "ton (imperial)": 1016046908.8,
    "ton (US)": 907184740.0
  },
  "Specific Heat": {
    "cal/(g*°C)": 1.0,
    "kcal/(kg*°C)": 1.0,
    "Joule/(kg*K)": 0.000238845856,
    "Btu/(lb*°F)": 1.0
  },
  "Standard/Normal Volume": {
    "nm³ (0°C, 1013 mbar)": 1.0,
    "sm³ (15 °C, 1013 mbar)": 0.943396226,
    "scf (60 °F, 14.696 psi)": 0.0267911603
  },
  "Thermal Conductivity": {
    "kcal/(m*h*°C)": 1.0,
    "W/(m*°C)": 0.85984522786,
    "Btu*ft/(ft²*h*°F)": 1.4880952381,
    "Btu*in/(ft²*h*°F)": 0.124004934
  },
  "Torque": {
    "N*m": 1.0,
    "N*cm": 0.01,
    "N*mm": 0.001,
    "dyn*m": 0.00001,
    "dyn*cm": 0.0000001,
    "dyn*mm": 0.00000001,
    "kg-force*m": 9.80673059191188,
    "kg-force*cm": 0.09806730592,
    "lb-force*ft": 1.35581794833,
    "lb-force*in.": 0.112984829027
  },
  "Velocity": {
    "cm/s": 1.0,
    "m/s": 100.0,
    "km/s": 100000.0,
    "km/h": 27.7777777778,
    "in./s": 2.54,
    "ft/s": 30.48,
    "miles/h": 44.703988827
  },
  "Viscosity Absolute": {
    "Pa*s": 1.0,
    "Poise": 0.1,
    "kg/(m*h)": 0.0002777778,
    "centipoise": 0.001,
    "lb/(ft*h)": 0.00041333781
  },
  "Viscosity Kinematic": {
    "m²/sec": 1.0,
    "ft²/sec": 0.09290304,
    "ft²/h": 0.0000258064,
    "centistoke": 0.000001,
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
    "US gal/h": 1.051503273
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
  const [category, setCategory] = useState<string>("Pressure");
  const [value, setValue] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("kPa");
  const [toUnit, setToUnit] = useState<string>("bar");
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4">Unit Converter</h1>
          <p className="text-[#bdc3c7] max-w-2xl mx-auto">
            Comprehensive unit converter for flow rate, pressure, temperature, and emissions.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* Inline Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800">⚠️ Reference Only</p>
            <p className="text-yellow-700 mt-1">
              Unit conversions are provided for convenience. Always verify critical values with authoritative sources
              and engineering standards before use in professional applications.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-64 bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-300">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#2c3e50]">Categories</h2>
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
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-1 ${
                      category === cat 
                        ? "bg-[#f39c12] text-[#2c3e50] font-semibold" 
                        : "text-[#34495e] hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#2c3e50] mb-1">{category} Converter</h2>
                <p className="text-[#7f8c8d]">Convert between units in the {category.toLowerCase()} category</p>
              </div>

              <div className="bg-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#34495e] mb-2">Value</label>
                    <input
                      type="text"
                      value={value}
                      onChange={handleValueChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50] text-lg"
                      placeholder="Enter value"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-[#34495e] mb-2">From</label>
                    <select
                      value={fromUnit}
                      onChange={handleFromUnitChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1 flex items-end justify-center">
                    <button
                      onClick={swapUnits}
                      className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                      title="Swap units"
                    >
                      <svg className="w-6 h-6 text-[#2c3e50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-[#34495e] mb-2">To</label>
                    <select
                      value={toUnit}
                      onChange={handleToUnitChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f39c12] bg-white text-[#2c3e50]"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#7f8c8d] mb-1">Result</p>
                      <p className="text-3xl font-bold text-[#2c3e50]">
                        {formatNumber(result)} <span className="text-lg font-normal text-[#7f8c8d]">{toUnit}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatNumber(result))}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] rounded-lg transition-colors font-semibold"
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
                <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">All Conversions</h2>
                <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-200 border-b border-gray-300">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2c3e50]">Unit</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2c3e50]">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(allResults).map(([unit, val]) => (
                          <tr key={unit} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-[#34495e]">{unit}</td>
                            <td className="px-4 py-3 text-right text-sm font-mono text-[#2c3e50]">
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

      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-10 px-6 mt-16">
        <div className="flex justify-center gap-8 mb-5 flex-wrap">
          <Link to="/" className="text-sm hover:text-white transition-colors">Home</Link>
          <Link to="/emission" className="text-sm hover:text-white transition-colors">Emissions</Link>
          <a href="#privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
      </footer>
    </div>
  );
}
