const R = 0.008314;

const nasaCoeffs = {
  'CO₂': { high: { a: [3.85746029E+00, 4.41437026E-03, -2.21481404E-06, 5.23490188E-10, -4.72084164E-14, -4.87591660E+04, 2.27168103E+00] } },
  'H₂O': { high: { a: [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00] } },
  'O₂': { high: { a: [3.28253784E+00, 1.48308754E-03, -7.57966669E-07, 2.09470555E-10, -2.16717794E-14, -1.08845772E+03, 5.45323129E+00] } },
  'N₂': { high: { a: [2.92664000E+00, 1.48797680E-03, -5.68476000E-07, 1.00970300E-10, -6.75335100E-15, -9.22797700E+02, 5.98052800E+00] } },
  'CH₄': { high: { a: [7.48514950E-02, 1.33909467E-02, -5.73285809E-06, 1.22292535E-09, -1.01815230E-13, -9.46834459E+03, 1.84373180E+01] } },
  'Ar': { high: { a: [2.50000000E+00, 0, 0, 0, 0, -7.45375000E+02, 4.36600000E+00] } },
};

const enthalpyOfFormation = { 'CH₄': -74.87, 'O₂': 0, 'CO₂': -393.52, 'H₂O': -241.83, 'N₂': 0, 'Ar': 0 };

function enthalpy(sp, T) {
  const a = nasaCoeffs[sp]?.high?.a;
  if (!a) return (enthalpyOfFormation[sp] || 0);
  const H_RT = a[0] + a[1]*T/2 + a[2]*T*T/3 + a[3]*T*T*T/4 + a[4]*T*T*T*T/5 + a[5]/T;
  return R * T * H_RT;
}

// CH4 + Pure O2 (6% excess, 0°C)
// Reactants: 1 CH4 + 2.12 O2 at 273K
const TfuelK = 273.15;
const Hreact = enthalpy('CH₄', TfuelK) + 2.12 * enthalpy('O₂', TfuelK);
console.log(`H_reactants at 273K = ${Hreact.toFixed(2)} kJ`);

// Frozen products: 1 CO2 + 2 H2O + 0.12 O2
function frozenEnthalpy(T) {
  return enthalpy('CO₂', T) + 2 * enthalpy('H₂O', T) + 0.12 * enthalpy('O₂', T);
}

// Binary search
let Tlow = 300, Thigh = 7000;
for (let i = 0; i < 200; i++) {
  const Tmid = (Tlow + Thigh) / 2;
  if (frozenEnthalpy(Tmid) > Hreact) Thigh = Tmid;
  else Tlow = Tmid;
  if (Thigh - Tlow < 0.1) break;
}
const TfrozenK = (Tlow + Thigh) / 2;
console.log(`Frozen T = ${TfrozenK.toFixed(1)} K = ${(TfrozenK - 273.15).toFixed(1)} °C`);
console.log(`Cantera Frozen T = 4755.2 °C`);
console.log(`Page Theoretical = 4446 °C`);
console.log(`Our vs Cantera diff = ${Math.abs(TfrozenK - 273.15 - 4755.2).toFixed(1)} °C`);

// Also check at 298K (25°C)
const Hreact298 = enthalpy('CH₄', 298.15) + 2.12 * enthalpy('O₂', 298.15);
console.log(`\nH_reactants at 298K = ${Hreact298.toFixed(2)} kJ`);
Tlow = 300; Thigh = 7000;
for (let i = 0; i < 200; i++) {
  const Tmid = (Tlow + Thigh) / 2;
  if (frozenEnthalpy(Tmid) > Hreact298) Thigh = Tmid;
  else Tlow = Tmid;
}
const Tfrozen298 = (Tlow + Thigh) / 2;
console.log(`Frozen T (25°C reactants) = ${(Tfrozen298 - 273.15).toFixed(1)} °C`);

// Check enthalpy values
console.log(`\nEnthalpy check at 298K:`);
console.log(`  H_CH4(298) = ${enthalpy('CH₄', 298.15).toFixed(2)} kJ (expected ~-74.9)`);
console.log(`  H_O2(298) = ${enthalpy('O₂', 298.15).toFixed(2)} kJ (expected ~0)`);
console.log(`  H_CO2(298) = ${enthalpy('CO₂', 298.15).toFixed(2)} kJ (expected ~-393.5)`);
console.log(`  H_H2O(298) = ${enthalpy('H₂O', 298.15).toFixed(2)} kJ (expected ~-241.8)`);

console.log(`\nEnthalpy check at 5000K:`);
console.log(`  H_CO2(5000) = ${enthalpy('CO₂', 5000).toFixed(2)} kJ`);
console.log(`  H_H2O(5000) = ${enthalpy('H₂O', 5000).toFixed(2)} kJ`);
console.log(`  H_O2(5000) = ${enthalpy('O₂', 5000).toFixed(2)} kJ`);
console.log(`  Products H = ${frozenEnthalpy(5000).toFixed(2)} kJ`);
