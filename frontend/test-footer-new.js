import { jsPDF } from 'jspdf'
import fs from 'fs'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const FOOTER_BOTTOM_MARGIN = 8
const FOOTER_BRAND_LINE_HEIGHT = 5
const FOOTER_NOTE_LINE_HEIGHT = 4
const FOOTER_GAP_BRAND_NOTE = 3
const FOOTER_GAP_NOTE_SEPARATOR = 2
const FOOTER_MIN_HEIGHT = 22

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

// NEW implementation
function drawPageFooterNew(doc, customNote) {
  const pageCount = doc.getNumberOfPages()
  const note = customNote || 'For reference only - Professional engineering review required'
  const cleanNote = sanitizeText(note)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const noteLines = doc.splitTextToSize(cleanNote, CONTENT_WIDTH)
  const noteHeight = noteLines.length * FOOTER_NOTE_LINE_HEIGHT
  
  const totalFooterHeight = FOOTER_BOTTOM_MARGIN + FOOTER_BRAND_LINE_HEIGHT + 
    FOOTER_GAP_BRAND_NOTE + noteHeight + FOOTER_GAP_NOTE_SEPARATOR + 2
  const footerHeight = Math.max(totalFooterHeight, FOOTER_MIN_HEIGHT)
  const footerTopY = PAGE_HEIGHT - footerHeight
  
  console.log('=== Footer Layout Calculations ===')
  console.log('Note lines:', noteLines.length)
  console.log('noteHeight:', noteHeight)
  console.log('totalFooterHeight:', totalFooterHeight)
  console.log('footerHeight (with min):', footerHeight)
  console.log('footerTopY:', footerTopY)
  console.log()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    if (i === 1 && pageCount > 1) {
      const y = PAGE_HEIGHT - FOOTER_BOTTOM_MARGIN
      setTextColor(doc, COLORS.textLight)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('Burner-Design-Pro', MARGIN_LEFT, y)
      doc.text('Page 1 of ' + pageCount, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      continue
    }

    const brandY = PAGE_HEIGHT - FOOTER_BOTTOM_MARGIN
    const noteBaselineY = brandY - FOOTER_GAP_BRAND_NOTE - FOOTER_NOTE_LINE_HEIGHT * (noteLines.length - 1)
    const separatorY = noteBaselineY - FOOTER_GAP_NOTE_SEPARATOR

    console.log(`--- Page ${i} ---`)
    console.log('brandY:', brandY)
    console.log('noteBaselineY (first line):', noteBaselineY)
    console.log('note last line baseline:', noteBaselineY + (noteLines.length - 1) * FOOTER_NOTE_LINE_HEIGHT)
    console.log('separatorY:', separatorY)
    console.log('Gap between note last line and brand:', brandY - (noteBaselineY + (noteLines.length - 1) * FOOTER_NOTE_LINE_HEIGHT))
    console.log()

    setDrawColor(doc, COLORS.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)
    doc.setLineWidth(0.2)

    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(noteLines, MARGIN_LEFT, noteBaselineY)

    doc.setFont('helvetica', 'bold')
    doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)

    doc.setFont('helvetica', 'normal')
    doc.text(sanitizeText(`Page ${i} of ${pageCount}`), PAGE_WIDTH - MARGIN_RIGHT, brandY, { align: 'right' })
  }
  setTextColor(doc, { r: 0, g: 0, b: 0 })
}

// Test with different note lengths
const testNotes = [
  { name: 'Default note (1 line)', note: 'For reference only - Professional engineering review required' },
  { name: 'Fuel Manager note (1 line)', note: 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.' },
  { name: 'Long note (2 lines)', note: 'IMPORTANT DISCLAIMER: This calculation report is for informational and reference purposes only. All results are generated based on input parameters provided by the user.' },
  { name: 'Very long note (3+ lines)', note: 'IMPORTANT DISCLAIMER: This calculation report is for informational and reference purposes only. All results are generated based on input parameters provided by the user. Burner-Design-Pro makes no warranty regarding accuracy, reliability, or applicability. Professional engineering review is required before field application.' },
]

testNotes.forEach(({ name, note }, idx) => {
  console.log('='.repeat(60))
  console.log(`Test ${idx + 1}: ${name}`)
  console.log('='.repeat(60))
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  
  // Add some content pages
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`Test: ${name}`, MARGIN_LEFT, 30)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let y = 45
  for (let i = 1; i <= 35; i++) {
    doc.text(`Line ${i}: Sample content to fill the page.`, MARGIN_LEFT, y)
    y += 6
  }
  
  // Add second page
  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`Page 2 - ${name}`, MARGIN_LEFT, 30)
  y = 45
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (let i = 1; i <= 35; i++) {
    doc.text(`Content line ${i}: More sample text.`, MARGIN_LEFT, y)
    y += 6
  }
  
  drawPageFooterNew(doc, note)
  
  const pdfData = doc.output('arraybuffer')
  const filename = `/workspace/frontend/test-footer-${idx + 1}.pdf`
  fs.writeFileSync(filename, Buffer.from(pdfData))
  console.log(`Saved: ${filename}`)
  console.log()
})

console.log('Done! All test PDFs generated.')
