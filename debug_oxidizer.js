// 检查：氧化剂在 298K 的焓

const R = 0.008314;

const nasaCoeffs = {
  'O₂': { Tmid: 1000,
    low: { a: [3.78245636E+0, -2.99673416E-3, 9.84730201E-6, -9.68129509E-9, 3.24372837E-12, -1.06394356E+3, 3.65767573E+0] },
    high: { a: [3.28253784E+0, 1.48308754E-3, -7.57966669E-7, 2.09470555E-10, -2.16717794E-14, -1.08845772E+3, 5.45323129E+0] }},
  'N₂': { Tmid: 1000,
    low: { a: [3.29867700E+0, 1.40824040E-3, -3.96322200E-6, 5.64151500E-9, -2.44485400E-12, -1.02089990E+3, 3.95037200E+0] },
    high: { a: [2.92664000E+0, 1.48797680E-3, -5.68476000E-7, 1.00970380E-10, -6.75335100E-15, -9.22797700E+2, 5.98052800E+0] }},
  'Ar': { Tmid: 6000,
    low: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.37967491E+0] },
    high: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.37967491E+0] }},
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

// 298K 氧化剂焓
console.log('298K 氧化剂焓:');
console.log(`  O2: ${enthalpy('O₂', 298.15).toFixed(4)} kJ/mol`);
console.log(`  N2: ${enthalpy('N₂', 298.15).toFixed(4)} kJ/mol`);
console.log(`  Ar: ${enthalpy('Ar', 298.15).toFixed(4)} kJ/mol`);

// 300K 氧化剂焓
console.log('\n300K 氧化剂焓:');
console.log(`  O2: ${enthalpy('O₂', 300).toFixed(4)} kJ/mol`);
console.log(`  N2: ${enthalpy('N₂', 300).toFixed(4)} kJ/mol`);
console.log(`  Ar: ${enthalpy('Ar', 300).toFixed(4)} kJ/mol`);

// 标准状态下的参考值
console.log('\n参考值 (标准状态):');
console.log('  O2(298): 0 kJ/mol');
console.log('  N2(298): 0 kJ/mol');
console.log('  Ar(298): 0 kJ/mol');
