import { jsPDF } from 'jspdf'
import fs from 'fs'

// Copy of the final implementation for testing
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const COLORS = {
  primaryDark: { r: 8, g: 66, b: 82 },
  primary: { r: 14, g: 116, b: 144 },
  textDark: { r: 15, g: 23, b: 42 },
  textMedium: { r: 71, g: 85, b: 105 },
  textLight: { r: 127, g: 140, b: 141 },
  border: { r: 220, g: 220, b: 220 },
  background: { r: 248, g: 250, b: 252 },
  success: { r: 5, g: 150, b: 105 },
  warning: { r: 217, g: 119, b: 6 },
}

function sanitizeText(text) {
  return String(text).replace(/[^\x00-\x7F]/g, '')
}
function setTextColor(doc, c) { doc.setTextColor(c.r, c.g, c.b) }
function setDrawColor(doc, c) { doc.setDrawColor(c.r, c.g, c.b) }
function setFillColor(doc, c) { doc.setFillColor(c.r, c.g, c.b) }

// Final drawPageFooter
function drawPageFooter(doc, customNote) {
  const pageCount = doc.getNumberOfPages()
  const note = customNote || 'For reference only - Professional engineering review required'
  const cleanNote = sanitizeText(note)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const noteLines = doc.splitTextToSize(cleanNote, CONTENT_WIDTH)
  const noteLineHeight = 4
  const gapAfterSeparator = 4
  const gapBeforeBrand = 8
  const bottomMargin = 10

  const brandY = PAGE_HEIGHT - bottomMargin
  const noteLastLineY = brandY - gapBeforeBrand
  const noteFirstLineY = noteLastLineY - (noteLines.length - 1) * noteLineHeight
  const separatorY = noteFirstLineY - gapAfterSeparator

  console.log('Footer layout:')
  console.log('  noteLines:', noteLines.length)
  console.log('  separatorY:', separatorY)
  console.log('  noteFirstLineY:', noteFirstLineY)
  console.log('  noteLastLineY:', noteLastLineY)
  console.log('  brandY:', brandY)
  console.log('  Gap note->brand (baseline):', brandY - noteLastLineY, 'mm')
  console.log('  Gap separator->note:', noteFirstLineY - separatorY, 'mm')
  console.log('  Total footer height:', PAGE_HEIGHT - separatorY, 'mm')

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    if (i === 1 && pageCount > 1) {
      continue
    }

    setDrawColor(doc, COLORS.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)

    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(noteLines, MARGIN_LEFT, noteFirstLineY)

    doc.setFont('helvetica', 'bold')
    doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)

    doc.setFont('helvetica', 'normal')
    doc.text(sanitizeText(`Page ${i} of ${pageCount}`), PAGE_WIDTH - MARGIN_RIGHT, brandY, { align: 'right' })
  }
  setTextColor(doc, { r: 0, g: 0, b: 0 })
}

function drawPageHeader(doc, title, section) {
  setFillColor(doc, COLORS.primaryDark)
  doc.rect(0, 0, PAGE_WIDTH, 18, 'F')
  setFillColor(doc, COLORS.primary)
  doc.rect(0, 18, PAGE_WIDTH, 1.2, 'F')
  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(sanitizeText(title), MARGIN_LEFT, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sanitizeText(section), PAGE_WIDTH - MARGIN_RIGHT, 11, { align: 'right' })
  setTextColor(doc, COLORS.textDark)
  return 28
}

function addCoverPage(doc, options) {
  setFillColor(doc, COLORS.primaryDark)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')
  setFillColor(doc, COLORS.primary)
  doc.rect(0, 105, PAGE_WIDTH, 2, 'F')
  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('BURNER-DESIGN-PRO', MARGIN_LEFT, 35)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Professional Engineering Calculation Tools', MARGIN_LEFT, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(sanitizeText(options?.title || 'Report'), MARGIN_LEFT, 125)
  setTextColor(doc, { r: 180, g: 180, b: 180 })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('Confidential - For internal use and client reference only', MARGIN_LEFT, 270)
  doc.text('(c) ' + new Date().getFullYear() + ' Burner-Design-Pro. All rights reserved.', MARGIN_LEFT, 277)
  setTextColor(doc, COLORS.textDark)
}

// Test 1: Multi-page report (cover + content + disclaimer)
console.log('='.repeat(60))
console.log('Test 1: Multi-page report')
console.log('='.repeat(60))

const doc1 = new jsPDF({ unit: 'mm', format: 'a4' })
addCoverPage(doc1, { title: 'Test Report' })

let y = drawPageHeader(doc1, 'Test Report', 'Results')
y += 20
for (let i = 0; i < 30; i++) {
  doc1.setFontSize(10)
  doc1.text(`Content line ${i + 1}: Sample data.`, MARGIN_LEFT, y + i * 6)
}

doc1.addPage()
y = drawPageHeader(doc1, 'Test Report', 'More Data')
y += 20
for (let i = 0; i < 25; i++) {
  doc1.setFontSize(10)
  doc1.text(`Page 2 line ${i + 1}: More content.`, MARGIN_LEFT, y + i * 6)
}

drawPageFooter(doc1, 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.')
fs.writeFileSync('/workspace/frontend/dist/final-test-multipage.pdf', Buffer.from(doc1.output('arraybuffer')))
console.log('Pages:', doc1.getNumberOfPages())
console.log('Saved: final-test-multipage.pdf')
console.log()

// Test 2: Single page report
console.log('='.repeat(60))
console.log('Test 2: Single page report')
console.log('='.repeat(60))

const doc2 = new jsPDF({ unit: 'mm', format: 'a4' })
y = 30
for (let i = 0; i < 20; i++) {
  doc2.setFontSize(10)
  doc2.text(`Single page line ${i + 1}.`, MARGIN_LEFT, y + i * 7)
}
drawPageFooter(doc2)
fs.writeFileSync('/workspace/frontend/dist/final-test-singlepage.pdf', Buffer.from(doc2.output('arraybuffer')))
console.log('Pages:', doc2.getNumberOfPages())
console.log('Saved: final-test-singlepage.pdf')
console.log()

// Test 3: Long note (2 lines)
console.log('='.repeat(60))
console.log('Test 3: Long note (multi-line)')
console.log('='.repeat(60))

const doc3 = new jsPDF({ unit: 'mm', format: 'a4' })
y = 30
for (let i = 0; i < 30; i++) {
  doc3.setFontSize(10)
  doc3.text(`Line ${i + 1}: Content.`, MARGIN_LEFT, y + i * 6)
}
const longNote = 'IMPORTANT: This report is for reference only. All calculations must be verified by a qualified professional engineer before any field application. Use at your own risk.'
drawPageFooter(doc3, longNote)
fs.writeFileSync('/workspace/frontend/dist/final-test-longnote.pdf', Buffer.from(doc3.output('arraybuffer')))
console.log('Pages:', doc3.getNumberOfPages())
console.log('Saved: final-test-longnote.pdf')

console.log()
console.log('All tests complete!')
