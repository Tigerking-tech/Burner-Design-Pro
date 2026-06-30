import { jsPDF } from 'jspdf'
import fs from 'fs'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const FOOTER_HEIGHT = 22
const FOOTER_Y = PAGE_HEIGHT - FOOTER_HEIGHT

const COLORS = {
  textLight: { r: 127, g: 140, b: 141 },
  border: { r: 220, g: 220, b: 220 },
}

function setTextColor(doc, color) {
  doc.setTextColor(color.r, color.g, color.b)
}

function setDrawColor(doc, color) {
  doc.setDrawColor(color.r, color.g, color.b)
}

function sanitizeText(text) {
  return String(text).replace(/[^\x00-\x7F]/g, '')
}

// CURRENT implementation (copy from pdfUtils.ts)
function drawPageFooterCurrent(doc, customNote) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    if (i === 1 && pageCount > 1) {
      const y = PAGE_HEIGHT - 8
      setTextColor(doc, COLORS.textLight)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('Burner-Design-Pro', MARGIN_LEFT, y)
      doc.text('Page 1 of ' + pageCount, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      continue
    }

    const note = customNote || 'For reference only - Professional engineering review required'
    const cleanNote = sanitizeText(note)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const noteLines = doc.splitTextToSize(cleanNote, CONTENT_WIDTH)
    const noteLineHeight = 4
    const noteHeight = noteLines.length * noteLineHeight

    const separatorY = PAGE_HEIGHT - 20 - noteHeight - 6

    setDrawColor(doc, COLORS.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)
    doc.setLineWidth(0.2)

    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(noteLines, MARGIN_LEFT, separatorY + 5)

    const brandY = separatorY + 5 + noteHeight + 3
    doc.setFont('helvetica', 'bold')
    doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)

    doc.setFont('helvetica', 'normal')
    doc.text(sanitizeText(`Page ${i} of ${pageCount}`), PAGE_WIDTH - MARGIN_RIGHT, brandY, { align: 'right' })
  }
  setTextColor(doc, { r: 0, g: 0, b: 0 })
}

// Let's also test with the actual Fuel Manager custom note
const fuelManagerNote = 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.'

console.log('=== Testing with Fuel Manager custom note ===')
const doc = new jsPDF({ unit: 'mm', format: 'a4' })
doc.setFont('helvetica', 'normal')
doc.setFontSize(7)
const noteLines = doc.splitTextToSize(fuelManagerNote, CONTENT_WIDTH)
console.log('Note text:', fuelManagerNote)
console.log('Number of lines:', noteLines.length)
console.log('Lines:', noteLines)

const noteLineHeight = 4
const noteHeight = noteLines.length * noteLineHeight
console.log('noteHeight:', noteHeight)

// Current calculation
const separatorY_current = PAGE_HEIGHT - 20 - noteHeight - 6
const noteStartY_current = separatorY_current + 5
const brandY_current = separatorY_current + 5 + noteHeight + 3

console.log()
console.log('=== Current Code Calculations ===')
console.log('separatorY:', separatorY_current)
console.log('noteStartY (first line baseline):', noteStartY_current)
console.log('note last line baseline:', noteStartY_current + (noteLines.length - 1) * noteLineHeight)
console.log('brandY:', brandY_current)
console.log('PAGE_HEIGHT - brandY (distance from bottom):', PAGE_HEIGHT - brandY_current)
console.log('FOOTER_Y:', FOOTER_Y)
console.log('brandY > FOOTER_Y?', brandY_current > FOOTER_Y)

// Let's visualize the positions
console.log()
console.log('=== Position Visualization (from top) ===')
console.log('Page top: 0')
console.log('...')
console.log('FOOTER_Y:', FOOTER_Y, '(top of footer area)')
console.log('separatorY:', separatorY_current)
console.log('note starts:', noteStartY_current)
console.log('note ends (last line baseline):', noteStartY_current + (noteLines.length - 1) * noteLineHeight)
console.log('brandY:', brandY_current)
console.log('Page bottom:', PAGE_HEIGHT)

// Now let's check: is there overlap?
// The text height for 7pt font is about 2.5mm
// The brand text baseline is at brandY
// The note's last line baseline is at noteStartY + (noteLines.length - 1) * noteLineHeight
const noteLastBaseline = noteStartY_current + (noteLines.length - 1) * noteLineHeight
const gapBetweenNoteAndBrand = brandY_current - noteLastBaseline
console.log()
console.log('=== Overlap Analysis ===')
console.log('Note last line baseline:', noteLastBaseline)
console.log('Brand text baseline:', brandY_current)
console.log('Gap between baselines:', gapBetweenNoteAndBrand, 'mm')
console.log('Approx text height (7pt): ~2.5mm')
console.log('Gap after text:', gapBetweenNoteAndBrand - 2.5, 'mm')

// Generate a test PDF to visualize
const testDoc = new jsPDF({ unit: 'mm', format: 'a4' })

// Add some content
testDoc.setFont('helvetica', 'bold')
testDoc.setFontSize(14)
testDoc.text('Test PDF - Footer Overlap Check', MARGIN_LEFT, 30)

testDoc.setFont('helvetica', 'normal')
testDoc.setFontSize(10)
let y = 45
for (let i = 1; i <= 35; i++) {
  testDoc.text(`Line ${i}: Sample content to fill the page.`, MARGIN_LEFT, y)
  y += 6
}

// Add page 2
testDoc.addPage()
testDoc.setFont('helvetica', 'bold')
testDoc.setFontSize(14)
testDoc.text('Page 2 - With Custom Note', MARGIN_LEFT, 30)
y = 45
testDoc.setFont('helvetica', 'normal')
testDoc.setFontSize(10)
for (let i = 1; i <= 35; i++) {
  testDoc.text(`Content line ${i}: More sample text.`, MARGIN_LEFT, y)
  y += 6
}

// Draw footer with current implementation
drawPageFooterCurrent(testDoc, fuelManagerNote)

// Add a 3rd page with even longer note
testDoc.addPage()
testDoc.setFont('helvetica', 'bold')
testDoc.setFontSize(14)
testDoc.text('Page 3 - Very Long Note', MARGIN_LEFT, 30)
y = 45
testDoc.setFont('helvetica', 'normal')
testDoc.setFontSize(10)
for (let i = 1; i <= 30; i++) {
  testDoc.text(`Line ${i}: Testing with a very long footer note.`, MARGIN_LEFT, y)
  y += 6
}

const longNote = 'IMPORTANT DISCLAIMER: This calculation report is for informational and reference purposes only. All results are generated based on input parameters provided by the user. Burner-Design-Pro makes no warranty regarding accuracy, reliability, or applicability. Professional engineering review is required before field application.'
drawPageFooterCurrent(testDoc, longNote)

const pdfData = testDoc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/test-footer-current.pdf', Buffer.from(pdfData))

console.log()
console.log('PDF generated: test-footer-current.pdf')
console.log('Total pages:', testDoc.getNumberOfPages())
