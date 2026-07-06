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

function drawPageFooter(doc, customNote) {
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

// Generate test PDF
const doc = new jsPDF({ unit: 'mm', format: 'a4' })

// Page 1 - content
doc.setFont('helvetica', 'bold')
doc.setFontSize(16)
doc.text('Test PDF - Footer Overlap Check', MARGIN_LEFT, 30)

doc.setFont('helvetica', 'normal')
doc.setFontSize(10)
let y = 45
for (let i = 1; i <= 40; i++) {
  doc.text(`Line ${i}: This is sample content to fill the page and test the footer layout.`, MARGIN_LEFT, y)
  y += 6
}

// Page 2
doc.addPage()
doc.setFont('helvetica', 'bold')
doc.setFontSize(16)
doc.text('Page 2 - Testing Footer', MARGIN_LEFT, 30)

y = 45
doc.setFont('helvetica', 'normal')
doc.setFontSize(10)
for (let i = 1; i <= 35; i++) {
  doc.text(`Content line ${i}: More sample text here.`, MARGIN_LEFT, y)
  y += 6
}

// Add page 3 with long custom note
doc.addPage()
doc.setFont('helvetica', 'bold')
doc.setFontSize(16)
doc.text('Page 3 - Long Note Test', MARGIN_LEFT, 30)

y = 45
doc.setFont('helvetica', 'normal')
doc.setFontSize(10)
for (let i = 1; i <= 30; i++) {
  doc.text(`Line ${i}: Testing with a longer footer note.`, MARGIN_LEFT, y)
  y += 6
}

// Draw footers - page 1 and 2 with default note, page 3 with long note
// First, let's draw footers for all pages with default note
drawPageFooter(doc)

// Now redraw page 3 with long note
const longNote = 'IMPORTANT: This is a very long custom note that should wrap to multiple lines in the footer to test if there is any overlap between the note text, the brand name, and the page number at the bottom of the page'
doc.setPage(3)
// Clear and redraw - actually let's just add another page with long note
doc.addPage()
doc.setFont('helvetica', 'bold')
doc.setFontSize(16)
doc.text('Page 4 - Long Custom Note', MARGIN_LEFT, 30)
y = 45
doc.setFont('helvetica', 'normal')
doc.setFontSize(10)
for (let i = 1; i <= 30; i++) {
  doc.text(`Line ${i}: This page has a long custom footer note.`, MARGIN_LEFT, y)
  y += 6
}

// Save first, then we'll fix the footer for page 4
const pdfData = doc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/test-footer-before.pdf', Buffer.from(pdfData))

console.log('PDF generated: test-footer-before.pdf')
console.log('Total pages:', doc.getNumberOfPages())
