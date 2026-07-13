const R = 0.008314;

const nasaCoeffs = {
  'H₂O': { high: { a: [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00] } }
};

function enthalpy(sp, T) {
  const a = nasaCoeffs[sp]?.high?.a;
  const H_RT = a[0] + a[1]*T/2 + a[2]*T*T/3 + a[3]*T*T*T/4 + a[4]*T*T*T*T/5 + a[5]/T;
  const H = R * T * H_RT;

  console.log(`T=${T}K:`);
  console.log(`  a[0] = ${a[0]}`);
  console.log(`  a[1]*T/2 = ${a[1]}*${T}/2 = ${a[1]*T/2}`);
  console.log(`  a[2]*T²/3 = ${a[2]}*${T*T}/3 = ${a[2]*T*T/3}`);
  console.log(`  a[3]*T³/4 = ${a[3]}*${T*T*T}/4 = ${a[3]*T*T*T/4}`);
  console.log(`  a[4]*T⁴/5 = ${a[4]}*${T*T*T*T}/5 = ${a[4]*T*T*T*T/5}`);
  console.log(`  a[5]/T = ${a[5]}/${T} = ${a[5]/T}`);
  console.log(`  H_RT = ${H_RT}`);
  console.log(`  H = R*T*H_RT = ${R}*${T}*${H_RT} = ${H}`);
  return H;
}

console.log("=== H2O at 5000K ===");
const h1 = enthalpy('H₂O', 5000);

console.log("\n=== H2O at 298K ===");
const h2 = enthalpy('H₂O', 298.15);

console.log("\n=== H2O at 1000K ===");
const h3 = enthalpy('H₂O', 1000);

// Also compare with Python calculation
console.log("\n\nExpected from Python/Cantera:");
console.log("  H2O(298K) ≈ -241.8 kJ/mol");
console.log("  H2O(1000K) ≈ -216.5 kJ/mol");
console.log("  H2O(5000K) ≈ 7.4 kJ/mol");
