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

// NEW implementation (copy from pdfUtils.ts)
function drawPageFooter(doc, customNote) {
  const pageCount = doc.getNumberOfPages()
  const note = customNote || 'For reference only - Professional engineering review required'
  const cleanNote = sanitizeText(note)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const noteLines = doc.splitTextToSize(cleanNote, CONTENT_WIDTH)
  const noteLineHeight = 4.5
  const gapAfterSeparator = 3
  const gapBeforeBrand = 5
  const bottomMargin = 10

  const brandY = PAGE_HEIGHT - bottomMargin
  const noteLastLineY = brandY - gapBeforeBrand
  const noteFirstLineY = noteLastLineY - (noteLines.length - 1) * noteLineHeight
  const separatorY = noteFirstLineY - gapAfterSeparator

  console.log('=== Footer Layout ===')
  console.log('Note lines:', noteLines.length)
  console.log('brandY:', brandY)
  console.log('noteLastLineY:', noteLastLineY)
  console.log('noteFirstLineY:', noteFirstLineY)
  console.log('separatorY:', separatorY)
  console.log('Gap between note last line and brand:', brandY - noteLastLineY)
  console.log('Total footer height (from separator):', PAGE_HEIGHT - separatorY)
  console.log()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    if (i === 1 && pageCount > 1) {
      setTextColor(doc, COLORS.textLight)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)
      doc.text('Page 1 of ' + pageCount, PAGE_WIDTH - MARGIN_RIGHT, brandY, { align: 'right' })
      continue
    }

    // Debug lines
    doc.setDrawColor(255, 0, 0)
    doc.setLineWidth(0.1)
    doc.line(MARGIN_LEFT, brandY, PAGE_WIDTH - MARGIN_RIGHT, brandY)
    
    doc.setDrawColor(0, 0, 255)
    doc.line(MARGIN_LEFT, noteLastLineY, PAGE_WIDTH - MARGIN_RIGHT, noteLastLineY)
    
    doc.setDrawColor(0, 128, 0)
    doc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)

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

// Test with different note lengths
const testCases = [
  { name: '1 line note', note: 'For reference only - Professional engineering review required' },
  { name: 'Fuel Manager note', note: 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.' },
  { name: '2 line note', note: 'IMPORTANT DISCLAIMER: This calculation report is for informational and reference purposes only. All results are generated based on input parameters provided by the user.' },
  { name: '3 line note', note: 'IMPORTANT DISCLAIMER: This calculation report is for informational and reference purposes only. All results are generated based on input parameters provided by the user. Burner-Design-Pro makes no warranty regarding accuracy, reliability, or applicability. Professional engineering review is required before field application.' },
]

testCases.forEach((testCase, idx) => {
  console.log('='.repeat(60))
  console.log(`Test ${idx + 1}: ${testCase.name}`)
  console.log('='.repeat(60))
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  
  // Add content
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let y = 30
  for (let i = 1; i <= 35; i++) {
    doc.text(`Line ${i}: Sample content.`, MARGIN_LEFT, y)
    y += 6
  }
  
  // Add second page
  doc.addPage()
  doc.setFontSize(10)
  y = 30
  for (let i = 1; i <= 35; i++) {
    doc.text(`Page 2 line ${i}: More content.`, MARGIN_LEFT, y)
    y += 6
  }
  
  drawPageFooter(doc, testCase.note)
  
  const filename = `/workspace/frontend/test-footer-v2-${idx + 1}.pdf`
  const pdfData = doc.output('arraybuffer')
  fs.writeFileSync(filename, Buffer.from(pdfData))
  console.log(`Saved: ${filename}`)
  console.log()
})

console.log('Done!')
