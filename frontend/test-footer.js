import { jsPDF } from 'jspdf'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const FOOTER_HEIGHT = 22
const FOOTER_Y = PAGE_HEIGHT - FOOTER_HEIGHT

console.log('=== Constants ===')
console.log('PAGE_HEIGHT:', PAGE_HEIGHT)
console.log('FOOTER_HEIGHT:', FOOTER_HEIGHT)
console.log('FOOTER_Y:', FOOTER_Y)
console.log('CONTENT_WIDTH:', CONTENT_WIDTH)
console.log()

function testFooterLayout(customNote) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  
  const note = customNote || 'For reference only - Professional engineering review required'
  const noteLines = doc.splitTextToSize(note, CONTENT_WIDTH)
  const noteLineHeight = 4
  const noteHeight = noteLines.length * noteLineHeight
  
  console.log('=== Note Info ===')
  console.log('Note text:', note)
  console.log('Note lines:', noteLines.length)
  console.log('Note lines content:', noteLines)
  console.log('noteHeight:', noteHeight)
  console.log()
  
  // Current code calculation (line 482)
  const separatorY_current = PAGE_HEIGHT - 20 - noteHeight - 6
  const noteStartY_current = separatorY_current + 5
  const brandY_current = separatorY_current + 5 + noteHeight + 3
  
  console.log('=== Current Code Layout ===')
  console.log('separatorY:', separatorY_current)
  console.log('noteStartY:', noteStartY_current)
  console.log('noteEndY:', noteStartY_current + noteHeight)
  console.log('brandY:', brandY_current)
  console.log('Distance from bottom (PAGE_HEIGHT - brandY):', PAGE_HEIGHT - brandY_current)
  console.log('brandY > FOOTER_Y?', brandY_current > FOOTER_Y)
  console.log()
  
  // Expected: brandY should be at FOOTER_Y + something, or within FOOTER_HEIGHT
  // Let's calculate what we want:
  // We want brandY to be at PAGE_HEIGHT - 8 (8mm from bottom)
  // Then note should be above brand with some gap
  // Then separator line above note
  
  const desiredBrandY = PAGE_HEIGHT - 8
  const gapBetweenNoteAndBrand = 3
  const gapBetweenSeparatorAndNote = 5
  const separatorPadding = 3 // space above separator
  
  const desiredNoteEndY = desiredBrandY - gapBetweenNoteAndBrand
  const desiredNoteStartY = desiredNoteEndY - noteHeight + noteLineHeight
  const desiredSeparatorY = desiredNoteStartY - gapBetweenSeparatorAndNote
  
  console.log('=== Desired Layout ===')
  console.log('desiredBrandY (8mm from bottom):', desiredBrandY)
  console.log('desiredNoteEndY:', desiredNoteEndY)
  console.log('desiredNoteStartY:', desiredNoteStartY)
  console.log('desiredSeparatorY:', desiredSeparatorY)
  console.log('Total footer height:', PAGE_HEIGHT - desiredSeparatorY + separatorPadding)
  console.log()
  
  // Check if brand overlaps with note
  const noteBottomY = noteStartY_current + noteHeight - noteLineHeight
  console.log('=== Overlap Check (Current Code) ===')
  console.log('Note bottom Y (approx):', noteBottomY)
  console.log('Brand Y:', brandY_current)
  console.log('Gap between note and brand:', brandY_current - noteBottomY)
  console.log('Overlap?', brandY_current < noteBottomY ? 'YES - OVERLAPPING!' : 'No overlap')
  
  return {
    noteLines: noteLines.length,
    noteHeight,
    separatorY: separatorY_current,
    noteStartY: noteStartY_current,
    brandY: brandY_current,
  }
}

console.log('========== Test 1: Default note (1 line) ==========')
testFooterLayout()

console.log()
console.log('========== Test 2: Long note (2 lines) ==========')
testFooterLayout('This is a much longer custom note that should wrap to multiple lines to test the footer layout when there is more text content to display')

console.log()
console.log('========== Test 3: Very long note (3 lines) ==========')
testFooterLayout('This is an extremely long custom note that is specifically designed to wrap to three or more lines in order to thoroughly test the footer layout calculations and ensure that all elements are properly positioned without any overlap whatsoever')
