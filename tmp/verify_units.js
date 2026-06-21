// Verify reference conversion factors against our expected values
// Reference: faktor[i] = value of unit i when you have 1 of unit 0 (the first/base unit)
// So conversion: result = value * faktor[to] / faktor[from]
// Our formula: result = value * units[from] / units[to]
// => units[i] = 1/faktor[i]

function buildUnits(einheiten, faktoren) {
  const units = {};
  for (let i = 0; i < einheiten.length; i++) {
    units[einheiten[i]] = 1 / faktoren[i];
  }
  return units;
}

function convert(units, value, fromUnit, toUnit) {
  return value * units[fromUnit] / units[toUnit];
}

// Test Pressure
const pressure = buildUnits(
  ["Pa", "kPa", "mm H2O", "mm Hg", "kg/cm2", "bar", "mbar", "atm", "g/cm2", "in. H2O", "in. Hg", "psi", "oz/in.2"],
  [1, 0.001, 0.1020408, 0.007501876, 0.00001019680, 0.00001, 0.01, 9.871668e-06, 0.0101968, 0.004019293, 0.0002953337, 0.0001450326, 0.0023206038081155]
);

console.log("=== Pressure tests ===");
console.log("1 kPa =", convert(pressure, 1, "kPa", "Pa"), "Pa (expect 1000)");
console.log("1 bar =", convert(pressure, 1, "bar", "kPa"), "kPa (expect 100)");
console.log("1 atm =", convert(pressure, 1, "atm", "Pa"), "Pa (expect 101325)");
console.log("1 bar =", convert(pressure, 1, "bar", "psi"), "psi (expect 14.503...)");
console.log("1 kg/cm2 =", convert(pressure, 1, "kg/cm2", "kPa"), "kPa (expect 98.0665)");

// Test Length
const length = buildUnits(
  ["µm", "mm", "cm", "m", "inch", "ft", "mile", "km"],
  [1, 0.001, 0.0001, 1e-06, 3.937008e-05, 3.28084e-06, 6.213712e-10, 1e-09]
);

console.log("\n=== Length tests ===");
console.log("1 m =", convert(length, 1, "m", "ft"), "ft (expect 3.28084)");
console.log("1 km =", convert(length, 1, "km", "mile"), "mile (expect 0.621371)");
console.log("1 inch =", convert(length, 1, "inch", "mm"), "mm (expect 25.4)");

// Test Energy (reference uses cal as first unit)
const energy = buildUnits(
  ["cal", "Kcal", "Joule", "GigaJoule", "Btu", "Million Btu", "W*h", "Horsepower*h", "kg*m", "lb*ft", "N*m", "MJ"],
  [1, 0.001, 4.187, 4.187e-09, 0.003968, 3.968e-09, 0.001163, 1.56e-06, 0.42693, 3.088, 4.187, 4.187e-06]
);

console.log("\n=== Energy tests ===");
console.log("1 Kcal =", convert(energy, 1, "Kcal", "cal"), "cal (expect 1000)");
console.log("1 Kcal =", convert(energy, 1, "Kcal", "Joule"), "Joule (expect 4187)");
console.log("1 Kcal =", convert(energy, 1, "Kcal", "Btu"), "Btu (expect 3.968)");
console.log("1 kWh =", convert(energy, 1, "W*h", "Kcal"), "Kcal (expect 0.8598...) then *1000 for kWh = 859.845)");
console.log("1000 Wh =", convert(energy, 1000, "W*h", "Kcal"), "Kcal (expect 859.845)");

// Test Mass
const mass = buildUnits(
  ["mg", "g", "kg", "ton (metric)", "lbs", "oz", "ton (imperial)", "ton (US)"],
  [1, 0.001, 1e-06, 1e-09, 2.2046244201838e-6, 3.527399072294e-5, 9.8420353329068e-10, 1.1023113109244e-9]
);

console.log("\n=== Mass tests ===");
console.log("1 kg =", convert(mass, 1, "kg", "lbs"), "lbs (expect 2.20462)");
console.log("1 kg =", convert(mass, 1, "kg", "oz"), "oz (expect 35.274)");

// Test Density
const density = buildUnits(
  ["g/cm3", "kg/m3", "lb/in3", "lb/ft3", "kg/Litre", "lb/Gal(US)"],
  [1, 1000, 0.03613, 62.43, 1, 8.345]
);

console.log("\n=== Density tests ===");
console.log("1 kg/m3 =", convert(density, 1, "kg/m3", "lb/ft3"), "lb/ft3 (expect 0.06243)");

// Test Volume (reference uses cm3 as first unit)
const volume = buildUnits(
  ["cm3", "m3", "dm3", "Liter", "USgal", "in.3", "ft3", "quart", "pint"],
  [1, 1e-06, 0.001, 0.001, 0.0002642, 0.061024, 3.531e-05, 0.001057, 0.002113]
);

console.log("\n=== Volume tests ===");
console.log("1 m3 =", convert(volume, 1, "m3", "ft3"), "ft3 (expect 35.31)");
console.log("1 Liter =", convert(volume, 1, "Liter", "USgal"), "USgal (expect 0.2642)");

// Test Flow rate
const flow = buildUnits(
  ["cm3/s", "m3/s", "m3/h", "Liter/h", "ft3/s", "ft3/min", "ft3/h", "m3/min", "USgal/s", "USgal/min", "USgal/h"],
  [1, 1e-06, 0.0036, 3.6, 3.531e-05, 0.0021186, 0.127116, 6e-05, 0.0002642, 0.015852, 0.95112]
);

console.log("\n=== Flow Rate tests ===");
console.log("1 m3/h =", convert(flow, 1, "m3/h", "Liter/h"), "L/h (expect 1000)");
console.log("1 m3/h =", convert(flow, 1, "m3/h", "ft3/h"), "ft3/h (expect 35.31)");

// Test Power (reference uses N*m/sec as first unit)
const power = buildUnits(
  ["N*m/sec", "Kcal/hr", "kW", "W", "MegaWatt", "Joules/sec", "GigaJoule/hr", "Horsepower", "Btu/hr", "Million Btu/hr", "MJ/hr", "ft*lb/sec"],
  [1, 0.8598452, 0.001, 1, 1e-06, 1, 3.6e-06, 0.001341, 3.411866, 3.411866e-06, 0.0036, 0.7376]
);

console.log("\n=== Power tests ===");
console.log("1 kW =", convert(power, 1, "kW", "Btu/hr"), "Btu/hr (expect 3412.14)");
console.log("1 kW =", convert(power, 1, "kW", "Kcal/hr"), "Kcal/hr (expect 859.845)");
console.log("1 Horsepower =", convert(power, 1, "Horsepower", "kW"), "kW (expect 0.7457)");

// Test Standard/Normal Volume
const stdVol = buildUnits(
  ["nm3 (0°C, 1013 mbar)", "sm3 (15 °C, 1013 mbar)", "scf (60 °F, 14.696 psi)"],
  [1, 1.06, 37.33]
);

console.log("\n=== Standard/Normal Volume tests ===");
console.log("1 nm3 =", convert(stdVol, 1, "nm3 (0°C, 1013 mbar)", "sm3 (15 °C, 1013 mbar)"), "sm3 (expect 1.06)");
console.log("1 nm3 =", convert(stdVol, 1, "nm3 (0°C, 1013 mbar)", "scf (60 °F, 14.696 psi)"), "scf (expect 37.33)");

// Test Burner Capacity
const brennler = buildUnits(
  ["kw (Hu)", "10³ BTU/h (Ho), Natural gas NG (Ho/Hu = 1.108)", "10³ BTU/h (Ho), Propane/Butane LPG (Ho/Hu = 1.084)", "10³ BTU/h (Ho), Coke oven gas COG (Ho/Hu = 1.13)"],
  [1, 3.782, 3.703, 3.857]
);

console.log("\n=== Burner Capacity tests ===");
console.log("1000 kW (Hu) =", convert(brennler, 1000, "kw (Hu)", "10³ BTU/h (Ho), Natural gas NG (Ho/Hu = 1.108)"), "x1000 BTU/h NG (expect 3782)");
console.log("1000 kW (Hu) =", convert(brennler, 1000, "kw (Hu)", "10³ BTU/h (Ho), Propane/Butane LPG (Ho/Hu = 1.084)"), "x1000 BTU/h LPG (expect 3703)");

// Test Temperature - special conversion
function convertTemperature(value, fromUnit, toUnit) {
  let celsius;
  if (fromUnit === "Fahrenheit") celsius = (value - 32) * 5 / 9;
  else if (fromUnit === "Celsius") celsius = value;
  else if (fromUnit === "Kelvin") celsius = value - 273.15;
  else return value;

  if (toUnit === "Fahrenheit") return celsius * 9 / 5 + 32;
  if (toUnit === "Celsius") return celsius;
  if (toUnit === "Kelvin") return celsius + 273.15;
  return value;
}

console.log("\n=== Temperature tests ===");
console.log("0°C =", convertTemperature(0, "Celsius", "Fahrenheit"), "°F (expect 32)");
console.log("100°C =", convertTemperature(100, "Celsius", "Fahrenheit"), "°F (expect 212)");
console.log("0 K =", convertTemperature(0, "Kelvin", "Celsius"), "°C (expect -273.15)");
console.log("32°F =", convertTemperature(32, "Fahrenheit", "Celsius"), "°C (expect 0)");

// Test some new categories
console.log("\n=== Angle tests ===");
const angle = buildUnits(["Radian", "Degree"], [1, 57.29]);
console.log("1 Radian =", convert(angle, 1, "Radian", "Degree"), "Degree (expect 57.29)");
console.log("π Radian =", convert(angle, Math.PI, "Radian", "Degree"), "Degree (expect 180)");

console.log("\n=== Force tests ===");
const force = buildUnits(
  ["g force", "kg force", "Poundal", "N", "lb force", "Dyne"],
  [1, 0.001, 0.0709316, 0.009807, 0.0022047, 980.665]
);
console.log("1 N =", convert(force, 1, "N", "kg force"), "kg force (expect 0.10197)");
console.log("1 kg force =", convert(force, 1, "kg force", "N"), "N (expect 9.807)");

console.log("\n=== Torque tests ===");
const torque = buildUnits(
  ["N*m", "N*cm", "N*mm", "dyn*m", "dyn*cm", "dyn*mm", "kg-force*m", "kg-force*cm", "lb-force*ft", "lb-force*in."],
  [1, 100, 1000, 100000, 1e+07, 1e+08, 0.10197, 10.197, 0.73756, 8.850745]
);
console.log("1 N*m =", convert(torque, 1, "N*m", "lb-force*ft"), "lb-force*ft (expect 0.73756)");

// Verify Heat Content categories
console.log("\n=== Heat Content (Mass) tests ===");
const hcMass = buildUnits(
  ["Cal/g", "Kcal/kg", "Btu/lb", "J/kg", "kW*h/kg"],
  [1, 1, 1.8, 4187, 0.001169823]
);
console.log("1 Kcal/kg =", convert(hcMass, 1, "Kcal/kg", "Btu/lb"), "Btu/lb (expect 1.8)");

console.log("\n=== Heat Content (nm3, scf) tests ===");
const hcNm3 = buildUnits(
  ["MJ/nm3", "kcal/nm3", "MJ/sm3", "kcal/sm3", "Btu/scf", "kW-hr/nm3"],
  [1, 238.8345, 0.9460738, 225.955, 25.39207, 0.2777778]
);
console.log("1 MJ/nm3 =", convert(hcNm3, 1, "MJ/nm3", "kcal/nm3"), "kcal/nm3 (expect 238.8345)");
console.log("1 MJ/nm3 =", convert(hcNm3, 1, "MJ/nm3", "Btu/scf"), "Btu/scf (expect 25.39207)");

console.log("\n=== Thermal Conductivity tests ===");
const tc = buildUnits(
  ["kcal/(m*h*C)", "W/(m*C)", "Btu*ft/(ft2*h*F)", "Btu*in/(ft2*h*F)"],
  [1, 1.163, 0.672, 8.064516]
);
console.log("1 kcal/(m*h*C) =", convert(tc, 1, "kcal/(m*h*C)", "W/(m*C)"), "W/(m*C) (expect 1.163)");
