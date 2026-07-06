import { jsPDF } from 'jspdf'
import fs from 'fs'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const doc = new jsPDF({ unit: 'mm', format: 'a4' })

// Test text visual bounds
doc.setFont('helvetica', 'normal')
doc.setFontSize(7)

const testY = 50
const testText = 'Test Text - Gypsyjpq'

// Draw baseline
doc.setDrawColor(255, 0, 0)
doc.setLineWidth(0.1)
doc.line(MARGIN_LEFT, testY, MARGIN_LEFT + 80, testY)

// Draw text
doc.setTextColor(0, 0, 0)
doc.text(testText, MARGIN_LEFT, testY)

// Measure text dimensions
const textWidth = doc.getTextWidth(testText)
const lineHeight = doc.getLineHeight()

console.log('=== Text Dimensions (7pt helvetica normal) ===')
console.log('textWidth:', textWidth, 'mm')
console.log('getLineHeight():', lineHeight, 'mm')
console.log('Font size: 7pt =', 7 * 0.352778, 'mm')
console.log()

// Now let's test with bold
doc.setFont('helvetica', 'bold')
const lineHeightBold = doc.getLineHeight()
console.log('Bold getLineHeight():', lineHeightBold, 'mm')
console.log()

// Draw box around text to visualize bounds
// We'll use rectangles to estimate ascender/descender
doc.setFont('helvetica', 'normal')

// Draw multiple lines to see line spacing
const startY = 80
const lines = [
  'Line 1: The quick brown fox',
  'Line 2: jumps over the lazy dog.',
  'Line 3: Pack my box with five dozen liquor jugs.'
]

// Method: using text() with array
doc.setTextColor(0, 0, 255)
doc.text('Method: text(array) - default line spacing', MARGIN_LEFT, startY - 5)
doc.setTextColor(0, 0, 0)
doc.text(lines, MARGIN_LEFT, startY)

// Draw baseline for each line
doc.setDrawColor(255, 0, 0)
for (let i = 0; i < lines.length; i++) {
  const y = startY + i * (lineHeight / 2) // assuming half of getLineHeight()
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 100, y)
}

// Now let's test with different line heights
const testStartY = 130
doc.setTextColor(0, 0, 255)
doc.text('Testing visual line spacing:', MARGIN_LEFT, testStartY - 5)
doc.setTextColor(0, 0, 0)

const lineGaps = [3, 4, 4.5, 5, 6]
lineGaps.forEach((gap, idx) => {
  const y = testStartY + idx * 25
  doc.setTextColor(128, 128, 128)
  doc.text(`${gap}mm gap between baselines:`, MARGIN_LEFT, y - 3)
  doc.setTextColor(0, 0, 0)
  
  doc.text('Note text line with descenders: gypsyjpq', MARGIN_LEFT, y)
  doc.text('Brand text line with ascenders: THEQUICKBROWN', MARGIN_LEFT, y + gap)
  
  // Draw baselines
  doc.setDrawColor(255, 0, 0)
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 120, y)
  doc.line(MARGIN_LEFT, y + gap, MARGIN_LEFT + 120, y + gap)
})

// Add to second page: footer test
doc.addPage()

const note = 'For reference only - Professional engineering review required'
const noteLines = doc.splitTextToSize(note, CONTENT_WIDTH)

const bottomMargin = 10
const gapBeforeBrand = 5
const noteLineHeight = 4.5
const gapAfterSeparator = 3

const brandY = PAGE_HEIGHT - bottomMargin
const noteLastLineY = brandY - gapBeforeBrand
const noteFirstLineY = noteLastLineY - (noteLines.length - 1) * noteLineHeight
const separatorY = noteFirstLineY - gapAfterSeparator

doc.setTextColor(0, 0, 255)
doc.setFontSize(10)
doc.text('Footer Layout Test (5mm baseline gap)', MARGIN_LEFT, 30)

doc.setFontSize(7)
doc.setTextColor(127, 140, 141)

// Separator
doc.setDrawColor(220, 220, 220)
doc.setLineWidth(0.2)
doc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)

// Note
doc.text(noteLines, MARGIN_LEFT, noteFirstLineY)

// Brand + page
doc.setFont('helvetica', 'bold')
doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY)
doc.setFont('helvetica', 'normal')
doc.text('Page 1 of 1', PAGE_WIDTH - MARGIN_RIGHT, brandY, { align: 'right' })

// Debug lines
doc.setDrawColor(255, 0, 0)
doc.setLineWidth(0.1)
doc.setLineDashPattern([1, 1], 0)
doc.line(MARGIN_LEFT, brandY, PAGE_WIDTH - MARGIN_RIGHT, brandY)
doc.line(MARGIN_LEFT, noteLastLineY, PAGE_WIDTH - MARGIN_RIGHT, noteLastLineY)
doc.line(MARGIN_LEFT, separatorY, PAGE_WIDTH - MARGIN_RIGHT, separatorY)
doc.setLineDashPattern([], 0)

// Labels
doc.setTextColor(255, 0, 0)
doc.setFontSize(6)
doc.text('Brand baseline (red)', MARGIN_LEFT, brandY - 1)
doc.text('Note last baseline (red)', MARGIN_LEFT, noteLastLineY - 1)
doc.text('Separator (green)', MARGIN_LEFT, separatorY - 1)

// Second test with bigger gap
doc.addPage()

const gapBeforeBrand2 = 8
const brandY2 = PAGE_HEIGHT - bottomMargin
const noteLastLineY2 = brandY2 - gapBeforeBrand2
const noteFirstLineY2 = noteLastLineY2 - (noteLines.length - 1) * noteLineHeight
const separatorY2 = noteFirstLineY2 - gapAfterSeparator

doc.setTextColor(0, 0, 255)
doc.setFontSize(10)
doc.text('Footer Layout Test (8mm baseline gap)', MARGIN_LEFT, 30)

doc.setFontSize(7)
doc.setTextColor(127, 140, 141)

doc.setDrawColor(220, 220, 220)
doc.setLineWidth(0.2)
doc.line(MARGIN_LEFT, separatorY2, PAGE_WIDTH - MARGIN_RIGHT, separatorY2)

doc.text(noteLines, MARGIN_LEFT, noteFirstLineY2)

doc.setFont('helvetica', 'bold')
doc.text('Burner-Design-Pro', MARGIN_LEFT, brandY2)
doc.setFont('helvetica', 'normal')
doc.text('Page 1 of 1', PAGE_WIDTH - MARGIN_RIGHT, brandY2, { align: 'right' })

doc.setDrawColor(255, 0, 0)
doc.setLineWidth(0.1)
doc.setLineDashPattern([1, 1], 0)
doc.line(MARGIN_LEFT, brandY2, PAGE_WIDTH - MARGIN_RIGHT, brandY2)
doc.line(MARGIN_LEFT, noteLastLineY2, PAGE_WIDTH - MARGIN_RIGHT, noteLastLineY2)
doc.line(MARGIN_LEFT, separatorY2, PAGE_WIDTH - MARGIN_RIGHT, separatorY2)
doc.setLineDashPattern([], 0)

doc.setTextColor(255, 0, 0)
doc.setFontSize(6)
doc.text('Brand baseline (red)', MARGIN_LEFT, brandY2 - 1)
doc.text('Note last baseline (red)', MARGIN_LEFT, noteLastLineY2 - 1)
doc.text('Separator (green)', MARGIN_LEFT, separatorY2 - 1)

const pdfData = doc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/test-text-bounds.pdf', Buffer.from(pdfData))
console.log('PDF saved: test-text-bounds.pdf')
