import { jsPDF } from 'jspdf'
import fs from 'fs'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const COLORS = {
  textLight: { r: 127, g: 140, b: 141 },
  border: { r: 220, g: 220, b: 220 },
}

function sanitizeText(text) {
  return String(text).replace(/[^\x00-\x7F]/g, '')
}

function setTextColor(doc, color) {
  doc.setTextColor(color.r, color.g, color.b)
}

function setDrawColor(doc, color) {
  doc.setDrawColor(color.r, color.g, color.b)
}

// Current implementation
function drawPageFooterCurrent(doc, customNote) {
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

  console.log('Current implementation:')
  console.log('  noteLines:', noteLines.length)
  console.log('  separatorY:', separatorY)
  console.log('  noteFirstLineY:', noteFirstLineY)
  console.log('  noteLastLineY:', noteLastLineY)
  console.log('  brandY:', brandY)
  console.log()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

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

const doc = new jsPDF({ unit: 'mm', format: 'a4' })

// Test with a very long note that wraps to 3 lines
const longNote = 'IMPORTANT DISCLAIMER: This calculation report is for informational and reference purposes only. All results are generated based on input parameters provided by the user. Professional engineering review is required before field application.'

// Draw some content
doc.setFont('helvetica', 'normal')
doc.setFontSize(10)
let y = 30
for (let i = 1; i <= 30; i++) {
  doc.text(`Content line ${i}: Sample text to fill the page.`, MARGIN_LEFT, y)
  y += 7
}

// Draw footer
drawPageFooterCurrent(doc, longNote)

// Add debug info on page
doc.setFontSize(8)
doc.setTextColor(255, 0, 0)
const noteLines = doc.splitTextToSize(longNote, CONTENT_WIDTH)
doc.text(`Note lines: ${noteLines.length}`, MARGIN_LEFT, 50)

const pdfData = doc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/test-multiline-note.pdf', Buffer.from(pdfData))
console.log('Saved: test-multiline-note.pdf')
