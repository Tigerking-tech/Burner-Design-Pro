import { jsPDF } from 'jspdf'
import {
  addCoverPage,
  drawPageHeader,
  drawSectionTitle,
  drawSubSectionTitle,
  drawInfoTable,
  drawResultCard,
  drawTwoColumnTables,
  drawPageFooter,
  addDisclaimerPage,
  checkPageBreak,
  MARGIN_LEFT,
  CONTENT_WIDTH,
  formatNumber as pdfFormatNumber,
} from './src/utils/pdfUtils.ts'

const doc = new jsPDF({ unit: 'mm', format: 'a4' });

const pollutant = 'NOx';
const value = '100';
const fromUnit = 'ppm';
const o2Measured = '5';
const o2Reference = '3';
const fuelType = 'natural_gas_low';
const euFuelType = 'natural_gas';
const noxValue = '100';
const coValue = '80';
const flueGasFlow = '1000';
const annualHours = '8000';
const fuelLabel = 'Natural Gas (Low NOx)';
const euFuelLabel = 'Natural Gas';

const results = { ppm: 112.58, mgM3: 231.24, lbMMBtu: 0.0003 };
const epaCompliance = {
  noxLimit: 130,
  coLimit: 100,
  noxMeasured: 100,
  coMeasured: 80,
  noxCompliant: true,
  coCompliant: true,
  overallCompliant: true,
};
const euCompliance = {
  noxLimit: 200,
  coLimit: 150,
  noxMeasured: 100,
  coMeasured: 80,
  noxCompliant: true,
  coCompliant: true,
  overallCompliant: true,
};
const annualEmissions = { hourlyKg: 231.24, annualTons: 1479.93, monthlyTons: 123.33 };

addCoverPage(doc, {
  title: 'Emission Analysis Report',
  subtitle: 'NOx, CO, SO2 emission calculations with EPA and EU IED compliance checking',
  reportType: 'Emission Analysis',
  standard: 'EPA & EU IED',
});

let y = drawPageHeader(doc, 'Emission Analysis Report', 'Calculation Results');

y = drawSectionTitle(doc, 'Input Parameters', y, 'User-provided emission data and reference settings');

y = drawTwoColumnTables(
  doc,
  {
    title: 'Emission Input',
    rows: [
      ['Pollutant', pollutant],
      ['Input Value', `${value} ${fromUnit === 'ppm' ? 'ppm' : fromUnit === 'mg_m3' ? 'mg/m3' : 'lb/MMBtu'}`],
      ['Measured O2', `${o2Measured}%`],
      ['Reference O2', `${o2Reference}%`],
    ]
  },
  {
    title: 'Fuel Types',
    rows: [
      ['EPA Fuel Type', fuelLabel],
      ['EU Fuel Type', euFuelLabel],
      ['NOx (for compliance)', `${noxValue} mg/m3`],
      ['CO (for compliance)', `${coValue} mg/m3`],
    ]
  },
  y
);

y = checkPageBreak(doc, y, 60, 'Emission Analysis Report', 'Calculation Results');
y = drawSectionTitle(doc, 'Converted Values', y, 'All units converted with O2 correction');

const cardWidth = (CONTENT_WIDTH - 16) / 3;
drawResultCard(doc, {
  label: 'ppm',
  value: pdfFormatNumber(results.ppm),
  x: MARGIN_LEFT,
  y: y,
  width: cardWidth,
  highlight: true,
});
drawResultCard(doc, {
  label: 'mg/m3',
  value: pdfFormatNumber(results.mgM3),
  x: MARGIN_LEFT + cardWidth + 8,
  y: y,
  width: cardWidth,
  highlight: true,
});
drawResultCard(doc, {
  label: 'lb/MMBtu',
  value: pdfFormatNumber(results.lbMMBtu, 4),
  x: MARGIN_LEFT + (cardWidth + 8) * 2,
  y: y,
  width: cardWidth,
  highlight: true,
});
y += 37;

y = checkPageBreak(doc, y, 120, 'Emission Analysis Report', 'Compliance Status');
y = drawSectionTitle(doc, 'Compliance Status', y, 'EPA and EU IED standard compliance check');

if (epaCompliance && euCompliance) {
  y = drawTwoColumnTables(
    doc,
    {
      title: 'EPA Standards - ' + fuelLabel,
      rows: [
        ['NOx', `${pdfFormatNumber(epaCompliance.noxMeasured)} / ${epaCompliance.noxLimit} mg/m3  ${epaCompliance.noxCompliant ? '[x] PASS' : '[ ] FAIL'}`],
        ['CO', `${pdfFormatNumber(epaCompliance.coMeasured)} / ${epaCompliance.coLimit} mg/m3  ${epaCompliance.coCompliant ? '[x] PASS' : '[ ] FAIL'}`],
        ['Overall Status', epaCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'],
      ]
    },
    {
      title: 'EU Standards - ' + euFuelLabel,
      rows: [
        ['NOx', `${pdfFormatNumber(euCompliance.noxMeasured)} / ${euCompliance.noxLimit} mg/m3  ${euCompliance.noxCompliant ? '[x] PASS' : '[ ] FAIL'}`],
        ['CO', `${pdfFormatNumber(euCompliance.coMeasured)} / ${euCompliance.coLimit} mg/m3  ${euCompliance.coCompliant ? '[x] PASS' : '[ ] FAIL'}`],
        ['Overall Status', euCompliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'],
      ]
    },
    y
  );
}

y = checkPageBreak(doc, y, 100, 'Emission Analysis Report', 'Annual Emissions');
y = drawSectionTitle(doc, 'Annual Emissions Estimation', y, 'Based on flue gas flow and operating hours');

const flowCardWidth = (CONTENT_WIDTH - 16) / 3;
drawResultCard(doc, {
  label: 'Hourly (kg)',
  value: pdfFormatNumber(annualEmissions.hourlyKg),
  x: MARGIN_LEFT,
  y: y,
  width: flowCardWidth,
  status: 'info',
});
drawResultCard(doc, {
  label: 'Annual (tons)',
  value: pdfFormatNumber(annualEmissions.annualTons),
  x: MARGIN_LEFT + flowCardWidth + 8,
  y: y,
  width: flowCardWidth,
  status: 'info',
});
drawResultCard(doc, {
  label: 'Monthly (tons)',
  value: pdfFormatNumber(annualEmissions.monthlyTons),
  x: MARGIN_LEFT + (flowCardWidth + 8) * 2,
  y: y,
  width: flowCardWidth,
  status: 'info',
});
y += 37;

y = checkPageBreak(doc, y, 50, 'Emission Analysis Report', 'Operating Parameters');
y = drawSubSectionTitle(doc, 'Operating Parameters', y);
y = drawInfoTable(doc, [
  ['Flue Gas Flow', `${flueGasFlow} m3/h`],
  ['Annual Operating Hours', `${annualHours} h`],
  ['Load Factor', '80%'],
], MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);

addDisclaimerPage(doc, {
  title: 'EMISSION ANALYSIS DISCLAIMER',
});

drawPageFooter(doc);

doc.save('emission-test-report.pdf');
console.log('PDF generated successfully: emission-test-report.pdf');
console.log('Page count:', doc.getNumberOfPages());
