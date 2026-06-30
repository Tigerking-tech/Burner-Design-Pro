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

// EXACT copy of the current drawPageFooter
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

  console.log('=== Layout Calculation ===')
  console.log('noteLines:', noteLines.length)
  console.log('brandY:', brandY)
  console.log('noteLastLineY:', noteLastLineY)
  console.log('noteFirstLineY:', noteFirstLineY)
  console.log('separatorY:', separatorY)
  console.log('Gap note->brand (baseline):', brandY - noteLastLineY, 'mm')
  console.log('Gap separator->note:', noteFirstLineY - separatorY, 'mm')
  console.log('Total footer height:', PAGE_HEIGHT - separatorY, 'mm')
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

// Simulate a real report with multiple pages
function createTestReport(customNote, noteLabel) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  
  // Page 1 content
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Test Report - ' + noteLabel, MARGIN_LEFT, 30)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let y = 50
  for (let i = 1; i <= 40; i++) {
    doc.text(`Line ${i}: This is sample content to fill the page. The quick brown fox jumps over the lazy dog.`, MARGIN_LEFT, y)
    y += 6
  }
  
  // Page 2
  doc.addPage()
  y = 30
  doc.setFontSize(10)
  doc.text('Page 2 Content:', MARGIN_LEFT, y)
  y += 10
  for (let i = 1; i <= 35; i++) {
    doc.text(`More content line ${i}. Pack my box with five dozen liquor jugs.`, MARGIN_LEFT, y)
    y += 6
  }
  
  // Page 3
  doc.addPage()
  y = 30
  doc.text('Page 3 - Final Content:', MARGIN_LEFT, y)
  y += 10
  for (let i = 1; i <= 20; i++) {
    doc.text(`Final section line ${i}.`, MARGIN_LEFT, y)
    y += 6
  }
  
  // Draw footer
  drawPageFooter(doc, customNote)
  
  return doc
}

// Test cases matching actual app usage
const testCases = [
  { label: 'Default note', note: undefined },
  { label: 'Fuel Manager gas note', note: 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.' },
  { label: 'Fuel Manager oil note', note: 'Oil fuel data for reference only. Verify with laboratory analysis and qualified combustion engineers.' },
  { label: 'Emission note', note: 'Emission results for reference only. Confirm with local regulations and qualified environmental engineers.' },
  { label: 'Insulation note', note: 'Insulation results for reference only. Verify with qualified thermal engineers and material suppliers.' },
]

testCases.forEach((tc, idx) => {
  console.log('='.repeat(60))
  console.log(`Test ${idx + 1}: ${tc.label}`)
  console.log('='.repeat(60))
  
  const doc = createTestReport(tc.note, tc.label)
  const filename = `/workspace/frontend/test-final-footer-${idx + 1}.pdf`
  const pdfData = doc.output('arraybuffer')
  fs.writeFileSync(filename, Buffer.from(pdfData))
  console.log(`Saved: ${filename}`)
  console.log()
})

console.log('All tests done!')
