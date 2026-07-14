// 检查物种生成焓是否符合标准值

const R = 0.008314;

const nasaCoeffs = {
  'CO₂': { Tmid: 1000,
    low: { a: [2.35677352E+0, 8.98459677E-3, -7.12356269E-6, 2.45919022E-9, -1.43699548E-13, -4.83719697E+4, 9.90105222E+0] },
    high: { a: [3.85746029E+0, 4.41437026E-3, -2.21481404E-6, 5.23490188E-10, -4.72084164E-14, -4.87591660E+4, 2.27163806E+0] }},
  'H₂O': { Tmid: 1000,
    low: { a: [4.19864056E+0, -2.03643410E-3, 6.52040211E-6, -5.48797062E-9, 1.77197817E-12, -3.02937267E+4, -8.49032208E-1] },
    high: { a: [3.03399249E+0, 2.17691804E-3, -1.64072518E-7, -9.70419870E-11, 1.68200992E-14, -3.00042971E+4, 4.96677010E+0] }},
  'N₂': { Tmid: 1000,
    low: { a: [3.29867700E+0, 1.40824040E-3, -3.96322200E-6, 5.64151500E-9, -2.44485400E-12, -1.02089990E+3, 3.95037200E+0] },
    high: { a: [2.92664000E+0, 1.48797680E-3, -5.68476000E-7, 1.00970380E-10, -6.75335100E-15, -9.22797700E+2, 5.98052800E+0] }},
  'O₂': { Tmid: 1000,
    low: { a: [3.78245636E+0, -2.99673416E-3, 9.84730201E-6, -9.68129509E-9, 3.24372837E-12, -1.06394356E+3, 3.65767573E+0] },
    high: { a: [3.28253784E+0, 1.48308754E-3, -7.57966669E-7, 2.09470555E-10, -2.16717794E-14, -1.08845772E+3, 5.45323129E+0] }},
  'H₂': { Tmid: 1000,
    low: { a: [2.34433112E+0, 7.98052075E-3, -1.94781510E-5, 2.01572094E-8, -7.37611761E-12, -9.17935173E+2, 6.83010238E-1] },
    high: { a: [3.33727920E+0, -4.94024731E-5, 4.99456778E-7, -1.79566394E-10, 2.00255376E-14, -9.50158922E+2, -3.20502331E+0] }},
  'C₃H₈': { Tmid: 1000,
    low: { a: [9.33553810E-1, 2.64245790E-2, 6.10597270E-6, -2.19774990E-8, 9.51492530E-12, -1.39585200E+4, 1.92016910E+1] },
    high: { a: [7.53413680E+0, 1.88722390E-2, -6.27184910E-6, 9.14756490E-10, -4.78380690E-14, -1.64675160E+4, -1.78923490E+1] }},
  'C₄H₁₀': { Tmid: 1000,
    low: { a: [6.14746806E+0, 1.55947389E-4, 9.67913517E-5, -1.25483910E-7, 4.97816555E-11, -1.75994402E+4, -1.09409879E+0] },
    high: { a: [9.44535834E+0, 2.57858073E-2, -9.23619122E-6, 1.48632755E-9, -8.87897158E-14, -2.01382165E+4, -2.63470076E+1] }},
};

function getCoeffs(species, T) {
  const data = nasaCoeffs[species];
  if (!data) return null;
  return T < data.Tmid ? data.low.a : data.high.a;
}

function enthalpy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) return 0;
  const H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T;
  return R * T * H_RT;
}

// 标准状态 298.15K 的生成焓
const T0 = 298.15;

// 标准生成焓参考值 (kJ/mol)
const stdDeltaHf = {
  'O₂': 0,
  'N₂': 0,
  'H₂': 0,
  'CO₂': -393.52,
  'H₂O': -241.83,
};

console.log('=' .repeat(70));
console.log('标准生成焓验证 (298.15K)');
console.log('=' .repeat(70));

for (const sp of ['O₂', 'N₂', 'H₂', 'CO₂', 'H₂O']) {
  const h = enthalpy(sp, T0);
  const ref = stdDeltaHf[sp];
  console.log(`${sp.padEnd(6)}: H° = ${h.toFixed(2)} kJ/mol, 标准 = ${ref} kJ/mol, 差 = ${(h - ref).toFixed(2)} kJ/mol`);
}

// 燃烧热验证
console.log('\n' + '=' .repeat(70));
console.log('燃烧热验证 (298.15K)');
console.log('=' .repeat(70));

// C3H8 + 5O2 -> 3CO2 + 4H2O
const h_C3H8 = enthalpy('C₃H₈', T0);
const h_O2 = enthalpy('O₂', T0);
const h_CO2 = enthalpy('CO₂', T0);
const h_H2O = enthalpy('H₂O', T0);

const dH_comb_C3H8 = 3 * h_CO2 + 4 * h_H2O - h_C3H8 - 5 * h_O2;
console.log(`丙烷燃烧热: ΔH° = ${dH_comb_C3H8.toFixed(2)} kJ/mol`);
console.log(`参考值: ΔH° ≈ -2220 kJ/mol`);

// C4H10 + 6.5O2 -> 4CO2 + 5H2O
const h_C4H10 = enthalpy('C₄H₁₀', T0);
const dH_comb_C4H10 = 4 * h_CO2 + 5 * h_H2O - h_C4H10 - 6.5 * h_O2;
console.log(`丁烷燃烧热: ΔH° = ${dH_comb_C4H10.toFixed(2)} kJ/mol`);
console.log(`参考值: ΔH° ≈ -2878 kJ/mol`);

// 温度检查
console.log('\n' + '=' .repeat(70));
console.log('高温焓值检查 (2000K)');
console.log('=' .repeat(70));

const T_high = 2000;
for (const sp of ['O₂', 'N₂', 'CO₂', 'H₂O']) {
  const h = enthalpy(sp, T_high);
  console.log(`${sp.padEnd(6)}: H(2000K) = ${h.toFixed(2)} kJ/mol`);
}
