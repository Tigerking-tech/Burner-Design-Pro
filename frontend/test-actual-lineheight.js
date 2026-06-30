import { jsPDF } from 'jspdf'
import fs from 'fs'

const doc = new jsPDF({ unit: 'mm', format: 'a4' })
const MARGIN_LEFT = 18

doc.setFont('helvetica', 'normal')
doc.setFontSize(7)

console.log('getLineHeight():', doc.getLineHeight(), 'mm')
console.log('Font size: 7pt =', 7 * 0.352778, 'mm')

// Draw 5 lines and measure actual positions
const lines = [
  'Line 1: gypsyjpq (has descenders)',
  'Line 2: THEQUICKBROWN (has ascenders)',
  'Line 3: mixed case text',
  'Line 4: more text here',
  'Line 5: final line',
]

const startY = 30

// Draw actual text
doc.setTextColor(0, 0, 0)
doc.text(lines, MARGIN_LEFT, startY)

// Now let's find the actual line height by drawing a box around each line
// We'll use different line height assumptions
const testHeights = [3.8, 3.9, 4.0, 4.05, 4.1, 4.2, 4.5]

let testY = 60
testHeights.forEach(lh => {
  doc.setTextColor(0, 0, 255)
  doc.setFontSize(8)
  doc.text(`Assumed lineHeight = ${lh}mm:`, MARGIN_LEFT, testY - 3)
  doc.setFontSize(7)
  
  // Draw lines manually with this line height
  doc.setTextColor(0, 128, 0)
  lines.forEach((line, i) => {
    doc.text(line, MARGIN_LEFT + 60, testY + i * lh)
  })
  
  // Draw reference lines at baseline
  doc.setDrawColor(255, 0, 0)
  doc.setLineWidth(0.1)
  for (let i = 0; i < lines.length; i++) {
    doc.line(MARGIN_LEFT + 60, testY + i * lh, MARGIN_LEFT + 140, testY + i * lh)
  }
  
  testY += 40
})

// Now let's test the footer scenario specifically
doc.addPage()

const PAGE_HEIGHT = 297
const CONTENT_WIDTH = 174

const noteText = 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.'
const noteLines = doc.splitTextToSize(noteText, CONTENT_WIDTH)

// Test different gapBeforeBrand values
const gaps = [5, 6, 7, 8, 10]
const bottomMargin = 10

gaps.forEach((gap, idx) => {
  const pageY = 30 + idx * 35
  
  doc.setTextColor(0, 0, 255)
  doc.setFontSize(9)
  doc.text(`gapBeforeBrand = ${gap}mm:`, MARGIN_LEFT, pageY - 5)
  doc.setFontSize(7)
  
  const brandY = pageY + 20 // simulate bottom
  const noteLineHeight = 4 // assumption
  const noteLastLineY = brandY - gap
  const noteFirstLineY = noteLastLineY - (noteLines.length - 1) * noteLineHeight
  const separatorY = noteFirstLineY - 4
  
  // Separator
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_LEFT, separatorY, MARGIN_LEFT + CONTENT_WIDTH, separatorY)
  
  // Note
  doc.setTextColor(127, 140, 141)
  doc.text(noteLines, MARGIN_LEFT, noteFirstLineY)
  
  // Brand
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(127, 140, 141)
  doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)
  doc.setFont('helvetica', 'normal')
  
  // Reference baselines
  doc.setDrawColor(255, 0, 0)
  doc.setLineWidth(0.1)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(MARGIN_LEFT, noteLastLineY, MARGIN_LEFT + CONTENT_WIDTH, noteLastLineY)
  doc.line(MARGIN_LEFT, brandY, MARGIN_LEFT + CONTENT_WIDTH, brandY)
  doc.setLineDashPattern([], 0)
  
  doc.setTextColor(255, 0, 0)
  doc.setFontSize(6)
  doc.text(`note: ${noteLastLineY.toFixed(1)}`, MARGIN_LEFT + CONTENT_WIDTH - 25, noteLastLineY - 1)
  doc.text(`brand: ${brandY.toFixed(1)}`, MARGIN_LEFT + CONTENT_WIDTH - 25, brandY - 1)
})

const pdfData = doc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/dist/test-actual-lineheight.pdf', Buffer.from(pdfData))
console.log('PDF saved')
