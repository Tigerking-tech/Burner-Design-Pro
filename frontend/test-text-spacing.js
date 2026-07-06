import { jsPDF } from 'jspdf'
import fs from 'fs'

const doc = new jsPDF({ unit: 'mm', format: 'a4' })

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

console.log('=== jsPDF Text Height Test ===')
console.log()

// Test with different font sizes
const fontSizes = [7, 8, 9, 10]

fontSizes.forEach(size => {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(size)
  
  const lineHeight = doc.getLineHeight()
  console.log(`Font size ${size}pt:`)
  console.log(`  getLineHeight(): ${lineHeight} units`)
  console.log(`  getLineHeight() in mm: ${lineHeight} mm (since unit is mm)`)
  
  const testText = 'This is a test text to check line height calculation'
  const lines = doc.splitTextToSize(testText, 50)
  console.log(`  splitTextToSize lines: ${lines.length}`)
  console.log()
})

// Now let's test actual rendering to see the spacing
console.log('=== Visual Test: Drawing text with known Y positions ===')

const testDoc = new jsPDF({ unit: 'mm', format: 'a4' })

// Draw 3 lines of text at different positions to visualize spacing
testDoc.setFont('helvetica', 'normal')
testDoc.setFontSize(7)

const startY = 50
const lineHeight = 4 // Our assumed line height

const testLines = [
  'Line 1: First line of text',
  'Line 2: Second line of text', 
  'Line 3: Third line of text'
]

// Method 1: Using text() with array
testDoc.setTextColor(255, 0, 0)
testDoc.text('Method 1: text(array) - baseline at Y=50', MARGIN_LEFT, 45)
testDoc.setTextColor(0, 0, 0)
testDoc.text(testLines, MARGIN_LEFT, startY)

// Draw horizontal lines at each expected baseline
testDoc.setDrawColor(255, 0, 0)
testDoc.setLineWidth(0.1)
for (let i = 0; i < testLines.length; i++) {
  const y = startY + i * lineHeight
  testDoc.line(MARGIN_LEFT, y, MARGIN_LEFT + 80, y)
}

// Method 2: Drawing each line individually with our line height
const startY2 = 80
testDoc.setTextColor(255, 0, 0)
testDoc.text('Method 2: individual lines - 4mm spacing', MARGIN_LEFT, 75)
testDoc.setTextColor(0, 0, 0)

testDoc.setDrawColor(0, 0, 255)
for (let i = 0; i < testLines.length; i++) {
  const y = startY2 + i * lineHeight
  testDoc.text(testLines[i], MARGIN_LEFT, y)
  testDoc.line(MARGIN_LEFT + 90, y, MARGIN_LEFT + 170, y)
}

// Now let's check the actual height of text
testDoc.setTextColor(255, 0, 0)
testDoc.text('Check text bounds:', MARGIN_LEFT, 110)
testDoc.setTextColor(0, 0, 0)

// Draw a box around text to see its actual bounds
const testStr = 'Test String - Hg'
const textY = 120
testDoc.text(testStr, MARGIN_LEFT, textY)

// Draw baseline
testDoc.setDrawColor(255, 0, 0)
testDoc.line(MARGIN_LEFT, textY, MARGIN_LEFT + 60, textY)

// Draw approximate top of text (ascender)
const approxAscent = 2.5 // approximate for 7pt
testDoc.setDrawColor(0, 0, 255)
testDoc.line(MARGIN_LEFT, textY - approxAscent, MARGIN_LEFT + 60, textY - approxAscent)

// Add labels
testDoc.setFontSize(6)
testDoc.setTextColor(255, 0, 0)
testDoc.text('baseline', MARGIN_LEFT + 65, textY)
testDoc.setTextColor(0, 0, 255)
testDoc.text('approx top', MARGIN_LEFT + 65, textY - approxAscent)
testDoc.setTextColor(0, 0, 0)
testDoc.setFontSize(7)

// Now test the footer layout with actual drawing
testDoc.addPage()
testDoc.setFontSize(10)
testDoc.text('Footer Layout Test', MARGIN_LEFT, 30)
testDoc.setFontSize(7)

// Draw footer at the bottom of the page
const FOOTER_BOTTOM_MARGIN = 8
const FOOTER_NOTE_LINE_HEIGHT = 4
const FOOTER_GAP_BRAND_NOTE = 3
const FOOTER_GAP_NOTE_SEPARATOR = 2

const note = 'For reference only - Professional engineering review required'
const noteLines = testDoc.splitTextToSize(note, CONTENT_WIDTH)
console.log('Note lines:', noteLines.length)

const brandY = PAGE_HEIGHT - FOOTER_BOTTOM_MARGIN
const noteBaselineY = brandY - FOOTER_GAP_BRAND_NOTE - FOOTER_NOTE_LINE_HEIGHT * (noteLines.length - 1)
const separatorY = noteBaselineY - FOOTER_GAP_NOTE_SEPARATOR

console.log('brandY:', brandY)
console.log('noteBaselineY (first line):', noteBaselineY)
console.log('separatorY:', separatorY)

// Draw separator
testDoc.setDrawColor(200, 200, 200)
testDoc.setLineWidth(0.2)
testDoc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)

// Draw note
testDoc.setTextColor(127, 140, 141)
testDoc.text(noteLines, MARGIN_LEFT, noteBaselineY)

// Draw brand and page number
testDoc.setFont('helvetica', 'bold')
testDoc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)
testDoc.setFont('helvetica', 'normal')
testDoc.text('Page 1 of 1', PAGE_WIDTH - MARGIN_RIGHT, brandY, { align: 'right' })

// Draw guide lines to verify spacing
testDoc.setDrawColor(255, 0, 0)
testDoc.setLineWidth(0.1)
testDoc.setLineDashPattern([1, 1], 0)

// Brand baseline
testDoc.line(MARGIN_LEFT, brandY, PAGE_WIDTH - MARGIN_RIGHT, brandY)

// Note last line baseline
const noteLastBaseline = noteBaselineY + (noteLines.length - 1) * FOOTER_NOTE_LINE_HEIGHT
testDoc.setDrawColor(0, 0, 255)
testDoc.line(MARGIN_LEFT, noteLastBaseline, PAGE_WIDTH - MARGIN_RIGHT, noteLastBaseline)

// Separator
testDoc.setDrawColor(0, 128, 0)
testDoc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)

testDoc.setLineDashPattern([], 0)
testDoc.setTextColor(0, 0, 0)

// Add labels
testDoc.setFontSize(6)
testDoc.setTextColor(255, 0, 0)
testDoc.text('Brand baseline (red)', MARGIN_LEFT, brandY - 1)
testDoc.setTextColor(0, 0, 255)
testDoc.text('Note last baseline (blue)', MARGIN_LEFT, noteLastBaseline - 1)
testDoc.setTextColor(0, 128, 0)
testDoc.text('Separator line (green)', MARGIN_LEFT, separatorY - 1)

const pdfData = testDoc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/test-text-spacing.pdf', Buffer.from(pdfData))
console.log()
console.log('PDF saved: test-text-spacing.pdf')
