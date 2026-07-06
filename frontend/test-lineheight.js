import { jsPDF } from 'jspdf'
import fs from 'fs'

const doc = new jsPDF({ unit: 'mm', format: 'a4' })

const MARGIN_LEFT = 18
const CONTENT_WIDTH = 174

doc.setFont('helvetica', 'normal')
doc.setFontSize(7)

// Test 1: Measure text(array) line height
const testLines = [
  'Line 1: The quick brown fox jumps over the lazy dog',
  'Line 2: Pack my box with five dozen liquor jugs',
  'Line 3: How vexingly quick daft zebras jump'
]

const startY = 30

// Draw with text(array)
doc.setTextColor(0, 0, 0)
doc.text(testLines, MARGIN_LEFT, startY)

// Draw reference lines at each baseline assumption
// Try different line heights
const lineHeightsToTest = [3.5, 3.8, 4, 4.025, 4.2, 4.5]

lineHeightsToTest.forEach((lh, idx) => {
  const y = 80 + idx * 20
  doc.setTextColor(0, 0, 255)
  doc.text(`Testing lineHeight = ${lh}mm:`, MARGIN_LEFT, y - 3)
  
  doc.setTextColor(0, 0, 0)
  doc.text(testLines, MARGIN_LEFT, y)
  
  // Draw expected baselines
  doc.setDrawColor(255, 0, 0)
  doc.setLineWidth(0.1)
  for (let i = 0; i < testLines.length; i++) {
    const expectedY = y + i * lh
    doc.line(MARGIN_LEFT, expectedY, MARGIN_LEFT + 100, expectedY)
  }
})

// Test 2: Footer simulation
const PAGE_HEIGHT = 297
const bottomMargin = 10
const gapBeforeBrand = 8
const gapAfterSeparator = 4
const noteLineHeight = 4

const noteText = 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.'
const noteLines = doc.splitTextToSize(noteText, CONTENT_WIDTH)

const brandY = PAGE_HEIGHT - bottomMargin
const noteLastLineY = brandY - gapBeforeBrand
const noteFirstLineY = noteLastLineY - (noteLines.length - 1) * noteLineHeight
const separatorY = noteFirstLineY - gapAfterSeparator

doc.addPage()
doc.setTextColor(0, 0, 255)
doc.setFontSize(10)
doc.text('Footer Layout Test (lineHeight = 4mm):', MARGIN_LEFT, 30)
doc.setFontSize(7)

// Draw separator
doc.setDrawColor(220, 220, 220)
doc.setLineWidth(0.2)
doc.line(MARGIN_LEFT, separatorY, 210 - 18, separatorY)

// Draw note
doc.setTextColor(127, 140, 141)
doc.text(noteLines, MARGIN_LEFT, noteFirstLineY)

// Draw brand + page
doc.setFont('helvetica', 'bold')
doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)
doc.setFont('helvetica', 'normal')
doc.text('Page 1 of 1', 210 - 18, brandY, { align: 'right' })

// Debug baselines
doc.setDrawColor(255, 0, 0)
doc.setLineWidth(0.1)
doc.setLineDashPattern([1, 1], 0)
doc.line(MARGIN_LEFT, separatorY, 210 - 18, separatorY)
doc.line(MARGIN_LEFT, noteFirstLineY, 210 - 18, noteFirstLineY)
doc.line(MARGIN_LEFT, noteLastLineY, 210 - 18, noteLastLineY)
doc.line(MARGIN_LEFT, brandY, 210 - 18, brandY)
doc.setLineDashPattern([], 0)

doc.setTextColor(255, 0, 0)
doc.setFontSize(6)
doc.text(`separatorY: ${separatorY}`, MARGIN_LEFT, separatorY - 1)
doc.text(`noteFirstLineY: ${noteFirstLineY}`, MARGIN_LEFT, noteFirstLineY - 1)
doc.text(`noteLastLineY: ${noteLastLineY}`, MARGIN_LEFT, noteLastLineY - 1)
doc.text(`brandY: ${brandY}`, MARGIN_LEFT, brandY - 1)

const pdfData = doc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/test-lineheight.pdf', Buffer.from(pdfData))
console.log('PDF saved: test-lineheight.pdf')
console.log('noteLines:', noteLines.length)
console.log('separatorY:', separatorY)
console.log('noteFirstLineY:', noteFirstLineY)
console.log('noteLastLineY:', noteLastLineY)
console.log('brandY:', brandY)
