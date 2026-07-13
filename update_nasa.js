const fs = require('fs');

const canteraNASA = JSON.parse(fs.readFileSync('/workspace/cantera_nasa.json', 'utf8'));

// Read the current page
let content = fs.readFileSync('/workspace/frontend/src/pages/FlameTemperaturePage.tsx', 'utf8');

// We need to replace the nasaCoeffs object. We'll find it by its start and end.
const startMarker = 'const nasaCoeffs: Record<string, NasaCoeffs> = {';
const endMarker = "}\n\nconst enthalpyOfFormation";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find nasaCoeffs block');
  process.exit(1);
}

// Build new nasaCoeffs block
let newBlock = 'const nasaCoeffs: Record<string, NasaCoeffs> = {\n';

for (const [species, data] of Object.entries(canteraNASA)) {
  const low = data.low.a.map(v => {
    if (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e4) return v.toExponential(7).toUpperCase().replace('E', 'E');
    return v.toFixed(7);
  });
  const high = data.high.a.map(v => {
    if (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e4) return v.toExponential(7).toUpperCase().replace('E', 'E');
    return v.toFixed(7);
  });
  newBlock += `  '${species}': {\n`;
  newBlock += `    low: { a: [${low.join(', ')}] },\n`;
  newBlock += `    high: { a: [${high.join(', ')}] }\n`;
  newBlock += `  },\n`;
}

// Add back C4H10 from original since it's not in GRI-Mech
newBlock += `  'C₄H₁₀': {\n`;
newBlock += `    low: { a: [1.33955402E-01, 8.39408501E-02, -4.51009455E-05, 1.18846864E-08, -1.20565410E-12, -1.65443107E+04, 2.50664018E+01] },\n`;
newBlock += `    high: { a: [1.61309592E+01, 2.30272879E-02, -7.58774190E-06, 1.18186093E-09, -6.94827490E-14, -2.04427373E+04, -5.36822040E+01] }\n`;
newBlock += `  }\n`;
newBlock += '}';

const newContent = content.slice(0, startIdx) + newBlock + content.slice(endIdx + 1);

fs.writeFileSync('/workspace/frontend/src/pages/FlameTemperaturePage.tsx', newContent);
console.log('Updated nasaCoeffs in FlameTemperaturePage.tsx');
