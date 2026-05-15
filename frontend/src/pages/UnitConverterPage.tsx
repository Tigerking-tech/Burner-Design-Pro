import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// 单位配置
const UNITS = {
  "Pressure": {
    "Pa": 1.0,
    "kPa": 1000.0,
    "MPa": 1000000.0,
    "bar": 100000.0,
    "mbar": 100.0,
    "atm": 101325.0,
    "psi": 6894.76,
    "mmHg": 133.322,
    "inHg": 3386.39,
    "mmH2O": 9.80665,
    "inH2O": 249.089,
    "kg/cm2": 98066.5
  },
  "Temperature": {
    "Celsius": 0.0,
    "Fahrenheit": 0.0,
    "Kelvin": 0.0
  },
  "Flow Rate": {
    "m3/s": 1.0,
    "m3/h": 1.0 / 3600.0,
    "L/s": 0.001,
    "L/h": 0.001 / 3600.0,
    "Nm3/h": 1.0 / 3600.0,
    "Sm3/h": 1.0 / 3600.0,
    "cfm": 0.000471947,
    "gpm": 0.0000630902,
    "kg/h": 1.0 / 3600.0
  },
  "Energy": {
    "J": 1.0,
    "kJ": 1000.0,
    "MJ": 1000000.0,
    "kWh": 3600000.0,
    "BTU": 1055.06,
    "kcal": 4184.0
  },
  "Power": {
    "W": 1.0,
    "kW": 1000.0,
    "MW": 1000000.0,
    "BTU/h": 0.293071,
    "kcal/h": 1.163
  },
  "Heat Content": {
    "kJ/Nm3": 1.0,
    "MJ/Nm3": 1000.0,
    "BTU/scf": 37.2589,
    "kJ/kg": 1.0,
    "BTU/lb": 2.326,
    "kcal/kg": 4.184
  },
  "Length": {
    "m": 1.0,
    "cm": 0.01,
    "mm": 0.001,
    "km": 1000.0,
    "in": 0.0254,
    "ft": 0.3048,
    "yd": 0.9144,
    "mi": 1609.34
  },
  "Mass": {
    "kg": 1.0,
    "g": 0.001,
    "mg": 0.000001,
    "lb": 0.453592,
    "oz": 0.0283495,
    "ton": 1000.0
  },
  "Volume": {
    "m3": 1.0,
    "L": 0.001,
    "mL": 0.000001,
    "ft3": 0.0283168,
    "gal": 0.00378541,
    "in3": 0.0000163871
  },
  "Density": {
    "kg/m3": 1.0,
    "g/cm3": 1000.0,
    "lb/ft3": 16.0185
  },
  "Velocity": {
    "m/s": 1.0,
    "km/h": 1.0 / 3.6,
    "ft/s": 0.3048,
    "mph": 0.44704
  },
  "Burner Capacity": {
    "kW": 1.0,
    "MW": 1000.0,
    "kcal/h": 1.0 / 1.163,
    "BTU/h": 1.0 / 3.41214,
    "Nm3/h (gas)": 1.0 / 10.0
  }
};

const CATEGORIES = Object.keys(UNITS);

// 温度转换
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

// 通用转换
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

// 转换所有单位
const convertAll = (value: number, fromUnit: string, category: string) => {
  const units = Object.keys(UNITS[category as keyof typeof UNITS]);
  const results: Record<string, number> = {};
  
  for (const unit of units) {
    results[unit] = convert(value, fromUnit, unit, category);
  }
  
  return results;
};

// 格式化数字
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

  // 初始化
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

  // 更新所有转换
  const updateConversions = (val: number, unit: string, cat: string) => {
    const results = convertAll(val, unit, cat);
    setAllResults(results);
  };

  // 输入变化时
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    
    const numVal = parseFloat(newVal);
    if (!isNaN(numVal)) {
      updateConversions(numVal, fromUnit, category);
    }
  };

  // From单位变化
  const handleFromUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setFromUnit(newUnit);
    
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      updateConversions(numVal, newUnit, category);
    }
  };

  // To单位变化
  const handleToUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToUnit(e.target.value);
  };

  // 交换单位
  const swapUnits = () => {
    const oldFrom = fromUnit;
    setFromUnit(toUnit);
    setToUnit(oldFrom);
    
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      updateConversions(numVal, toUnit, category);
    }
  };

  // 复制结果
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const units = Object.keys(UNITS[category as keyof typeof UNITS]);
  const numValue = parseFloat(value);
  const result = isNaN(numValue) ? 0 : convert(numValue, fromUnit, toUnit, category);

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

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* 侧边栏 - 分类选择 */}
            <div className="w-full lg:w-64 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Categories</h2>
              </div>
              <div className="p-2 overflow-y-auto max-h-64 lg:max-h-[calc(100vh-160px)]">
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
                        ? "bg-blue-600 text-white" 
                        : "text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 主内容区 */}
            <div className="flex-1 p-6">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">{category} Converter</h1>
                <p className="text-slate-600">Convert between units in the {category.toLowerCase()} category</p>
              </div>

              {/* 转换区域 */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* 输入框 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Value</label>
                    <input
                      type="number"
                      value={value}
                      onChange={handleValueChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      placeholder="Enter value"
                    />
                  </div>

                  {/* From单位 */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">From</label>
                    <select
                      value={fromUnit}
                      onChange={handleFromUnitChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  {/* 交换按钮 */}
                  <div className="md:col-span-1 flex items-end justify-center">
                    <button
                      onClick={swapUnits}
                      className="p-3 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                      title="Swap units"
                    >
                      <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* To单位 */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">To</label>
                    <select
                      value={toUnit}
                      onChange={handleToUnitChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 结果显示 */}
                <div className="mt-6 pt-6 border-t border-slate-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Result</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {formatNumber(result)} <span className="text-lg font-normal text-slate-600">{toUnit}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatNumber(result))}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* 完整转换表格 */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">All Conversions</h2>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Unit</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(allResults).map(([unit, val]) => (
                          <tr key={unit} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-700">{unit}</td>
                            <td className="px-4 py-3 text-right text-sm font-mono text-slate-800">
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
    </div>
  );
}
