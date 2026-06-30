import { jsPDF } from 'jspdf'
import fs from 'fs'

// Copy all constants and functions we need
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 18
const MARGIN_RIGHT = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const COLORS = {
  primary: { r: 14, g: 116, b: 144 },
  primaryDark: { r: 8, g: 66, b: 82 },
  textDark: { r: 15, g: 23, b: 42 },
  textMedium: { r: 71, g: 85, b: 105 },
  textLight: { r: 127, g: 140, b: 141 },
  border: { r: 220, g: 220, b: 220 },
  background: { r: 248, g: 250, b: 252 },
  success: { r: 5, g: 150, b: 105 },
  warning: { r: 217, g: 119, b: 6 },
  error: { r: 220, g: 38, b: 38 },
  info: { r: 59, g: 130, b: 246 },
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

function setFillColor(doc, color) {
  doc.setFillColor(color.r, color.g, color.b)
}

// drawPageFooter - exact copy
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
  
  return { separatorY, noteFirstLineY, noteLastLineY, brandY }
}

// checkPageBreak
function checkPageBreak(doc, currentY, requiredSpace, headerTitle, headerSection) {
  const footerReserve = 40
  if (currentY + requiredSpace > PAGE_HEIGHT - footerReserve) {
    doc.addPage()
    return drawPageHeader(doc, headerTitle, headerSection)
  }
  return currentY
}

function drawPageHeader(doc, documentTitle, section) {
  setFillColor(doc, COLORS.primaryDark)
  doc.rect(0, 0, PAGE_WIDTH, 18, 'F')
  setFillColor(doc, COLORS.primary)
  doc.rect(0, 18, PAGE_WIDTH, 1.2, 'F')
  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(sanitizeText(documentTitle), MARGIN_LEFT, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sanitizeText(section), PAGE_WIDTH - MARGIN_RIGHT, 11, { align: 'right' })
  setTextColor(doc, COLORS.textDark)
  return 28
}

function drawSectionTitle(doc, title, y, subtitle) {
  setTextColor(doc, COLORS.primaryDark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(sanitizeText(title), MARGIN_LEFT, y)
  setDrawColor(doc, COLORS.primary)
  doc.setLineWidth(0.8)
  doc.line(MARGIN_LEFT, y + 2, PAGE_WIDTH - MARGIN_RIGHT, y + 2)
  doc.setLineWidth(0.2)
  let nextY = y + 8
  if (subtitle) {
    setTextColor(doc, COLORS.textMedium)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.text(sanitizeText(subtitle), MARGIN_LEFT + 8, nextY + 1)
    nextY += 8
  }
  setTextColor(doc, COLORS.textDark)
  return nextY
}

function drawInfoTable(doc, rows, x, y, width, options) {
  const fontSize = 9
  const rowHeight = 8
  const labelWidth = width * 0.45
  let currentY = y
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  if (options?.title) {
    setFillColor(doc, COLORS.background)
    setDrawColor(doc, COLORS.border)
    doc.rect(x, currentY, width, rowHeight, 'FD')
    setTextColor(doc, COLORS.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.text(sanitizeText(options.title), x + 5, currentY + 6)
    currentY += rowHeight
    doc.setFont('helvetica', 'normal')
  }
  rows.forEach(row => {
    setFillColor(doc, { r: 255, g: 255, b: 255 })
    setDrawColor(doc, COLORS.border)
    doc.rect(x, currentY, width, rowHeight, 'FD')
    doc.setLineWidth(0.1)
    doc.line(x + labelWidth, currentY, x + labelWidth, currentY + rowHeight)
    doc.setLineWidth(0.2)
    setTextColor(doc, COLORS.textMedium)
    doc.setFont('helvetica', 'normal')
    doc.text(sanitizeText(row[0]), x + 3, currentY + rowHeight / 2 + fontSize / 3)
    setTextColor(doc, COLORS.textDark)
    doc.setFont('helvetica', 'bold')
    const valLines = doc.splitTextToSize(String(row[1]), width - labelWidth - 6)
    if (valLines.length > 1) {
      doc.text(valLines[0], x + labelWidth + 3, currentY + rowHeight / 2 + fontSize / 3)
    } else {
      doc.text(sanitizeText(String(row[1])), x + labelWidth + 3, currentY + rowHeight / 2 + fontSize / 3)
    }
    doc.setFont('helvetica', 'normal')
    currentY += rowHeight
  })
  return currentY + 2
}

function drawResultCard(doc, options) {
  const { x, y, width, label, value, unit, highlight, status } = options
  let bgColor = { r: 255, g: 255, b: 255 }
  let borderColor = COLORS.border
  let valueColor = COLORS.primary
  if (highlight) {
    bgColor = { r: 240, g: 253, b: 250 }
    borderColor = COLORS.success
    valueColor = COLORS.success
  } else if (status === 'warning') {
    bgColor = { r: 255, g: 251, b: 235 }
    borderColor = COLORS.warning
    valueColor = COLORS.warning
  } else if (status === 'info') {
    bgColor = { r: 239, g: 246, b: 255 }
    borderColor = COLORS.info
    valueColor = COLORS.info
  } else if (status === 'success') {
    bgColor = { r: 240, g: 253, b: 250 }
    borderColor = COLORS.success
    valueColor = COLORS.success
  }
  setFillColor(doc, bgColor)
  setDrawColor(doc, borderColor)
  doc.setLineWidth(0.5)
  doc.roundedRect(x, y, width, 36, 3, 3, 'FD')
  doc.setLineWidth(0.2)
  setTextColor(doc, COLORS.textMedium)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sanitizeText(label), x + 8, y + 10)
  setTextColor(doc, valueColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(sanitizeText(value), x + 8, y + 22)
  if (unit) {
    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(sanitizeText(unit), x + 8, y + 27.5)
  }
  setTextColor(doc, COLORS.textDark)
}

function addCoverPage(doc, options) {
  setFillColor(doc, COLORS.primaryDark)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')
  setFillColor(doc, COLORS.primary)
  doc.rect(0, 105, PAGE_WIDTH, 2, 'F')
  setFillColor(doc, { r: 255, g: 255, b: 255, alpha: 0.1 })
  doc.rect(0, 175, PAGE_WIDTH, 1, 'F')
  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('BURNER-DESIGN-PRO', MARGIN_LEFT, 35)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Professional Engineering Calculation Tools', MARGIN_LEFT, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  const titleLines = doc.splitTextToSize(sanitizeText(options?.title || 'Calculation Report'), CONTENT_WIDTH)
  doc.text(titleLines, MARGIN_LEFT, 125)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const subtitleLines = doc.splitTextToSize(sanitizeText(options?.subtitle || ''), CONTENT_WIDTH)
  doc.text(subtitleLines, MARGIN_LEFT, 155)
  setTextColor(doc, { r: 200, g: 200, b: 200 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('REPORT INFORMATION', MARGIN_LEFT, 195)
  setDrawColor(doc, { r: 255, g: 255, b: 255, alpha: 0.3 })
  doc.setLineWidth(0.8)
  doc.rect(MARGIN_LEFT, 199, 25, 0.8, 'F')
  doc.setLineWidth(0.2)
  const infoItems = [
    ['Report Type', options?.reportType || 'Engineering Calculation'],
    ['Standard', options?.standard || 'Industry Standard Reference'],
    ['Version', options?.version || 'v1.0'],
    ['Date', new Date().toLocaleDateString('en-US')],
  ]
  let y = 212
  infoItems.forEach(([label, value]) => {
    setTextColor(doc, { r: 180, g: 180, b: 180 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(sanitizeText(label), MARGIN_LEFT, y)
    setTextColor(doc, { r: 255, g: 255, b: 255 })
    doc.setFont('helvetica', 'bold')
    doc.text(sanitizeText(value), MARGIN_LEFT + 40, y)
    y += 9
  })
  setTextColor(doc, { r: 180, g: 180, b: 180 })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('Confidential - For internal use and client reference only', MARGIN_LEFT, 270)
  doc.text('(c) ' + new Date().getFullYear() + ' Burner-Design-Pro. All rights reserved.', MARGIN_LEFT, 277)
  setTextColor(doc, COLORS.textDark)
}

function addDisclaimerPage(doc, options) {
  doc.addPage()
  let y = drawPageHeader(doc, options?.title || 'IMPORTANT DISCLAIMER', 'Appendix')
  y = drawSectionTitle(doc, 'DISCLAIMER', y, 'Professional engineering review is required before field application')
  
  const sections = options?.sections || [
    {
      heading: 'General Information',
      items: [
        'This calculation report is provided for informational and reference purposes only.',
        'All results are generated based on the input parameters provided by the user.',
      ]
    },
    {
      heading: 'Accuracy and Reliability',
      items: [
        'While every effort has been made to ensure calculation accuracy, no warranty is made.',
        'Calculations are based on simplified models.',
      ]
    },
    {
      heading: 'Limitation of Liability',
      items: [
        'In no event shall Burner-Design-Pro be liable for damages arising from use of these calculations.',
        'Use of this tool and its results is at the sole risk of the user.'
      ]
    }
  ]
  
  sections.forEach(section => {
    y += 2
    setTextColor(doc, COLORS.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(sanitizeText(section.heading), MARGIN_LEFT, y)
    y += 5
    setTextColor(doc, COLORS.textMedium)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    section.items.forEach(item => {
      const lines = doc.splitTextToSize(sanitizeText(item), CONTENT_WIDTH - 6)
      doc.text(lines, MARGIN_LEFT + 6, y)
      y += lines.length * 4.5 + 1
    })
    y += 4
  })
  
  y += 6
  setFillColor(doc, { r: 254, g: 249, b: 235 })
  setDrawColor(doc, COLORS.warning)
  doc.setLineWidth(0.8)
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 16, 2, 2, 'FD')
  doc.setLineWidth(0.2)
  setTextColor(doc, COLORS.warning)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('[!] PROFESSIONAL ENGINEERING REVIEW REQUIRED', MARGIN_LEFT + 8, y + 6)
  setTextColor(doc, COLORS.textMedium)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('All results must be reviewed and validated by a qualified professional engineer before application.', MARGIN_LEFT + 8, y + 11)
}

// Now create a test report simulating Fuel Manager
function createTestReport() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  
  addCoverPage(doc, {
    title: 'Fuel Gas Analysis',
    subtitle: 'Gas key data and mixture calculation report',
    reportType: 'Fuel Engineering',
  })
  
  let y = drawPageHeader(doc, 'Fuel Gas Report', 'Key Results')
  y = drawSectionTitle(doc, 'GAS MIXTURE KEY DATA', y, 'Calculated fuel properties')
  
  const cardWidth = (CONTENT_WIDTH - 16) / 3
  drawResultCard(doc, { label: 'Lower Heating Value', value: '10.87', unit: 'kWh/Nm³', x: MARGIN_LEFT, y, width: cardWidth, highlight: true })
  drawResultCard(doc, { label: 'Higher Heating Value', value: '11.89', unit: 'kWh/Nm³', x: MARGIN_LEFT + cardWidth + 8, y, width: cardWidth, status: 'info' })
  drawResultCard(doc, { label: 'Density', value: '0.714', unit: 'kg/Nm³', x: MARGIN_LEFT + (cardWidth + 8) * 2, y, width: cardWidth, status: 'success' })
  y += 42
  
  y = checkPageBreak(doc, y, 100, 'Fuel Gas Report', 'Mixture Data')
  y = drawSectionTitle(doc, 'MIXTURE PROPERTIES', y, 'Complete calculated properties')
  
  const propRows = [
    ['Lower Heating Value (Hi)', '10.87 kWh/Nm³'],
    ['Higher Heating Value (Hs)', '11.89 kWh/Nm³'],
    ['Density', '0.714 kg/Nm³'],
    ['Relative Density', '0.552'],
    ['Wobbe Index (Hi)', '14.62 kWh/Nm³'],
    ['Wobbe Index (Hs)', '15.99 kWh/Nm³'],
    ['Methane Number', '74.3'],
    ['Combustion Air Ratio', '9.52 Nm³/Nm³'],
    ['Flue Gas Volume (dry)', '8.91 Nm³/Nm³'],
    ['Flue Gas Volume (wet)', '9.51 Nm³/Nm³'],
    ['CO2 Volume (dry)', '1.91 Nm³/Nm³'],
  ]
  y = drawInfoTable(doc, propRows, MARGIN_LEFT, y, CONTENT_WIDTH, { title: 'Mixture Properties' })
  
  // Add many more tables to push content down
  for (let page = 0; page < 5; page++) {
    y = checkPageBreak(doc, y, 80, 'Fuel Gas Report', `Section ${page + 2}`)
    y = drawSectionTitle(doc, `SECTION ${page + 2} DATA`, y, `Additional data section ${page + 2}`)
    
    const rows = []
    for (let i = 0; i < 12; i++) {
      rows.push([`Parameter ${i + 1}`, `Value ${i + 1}.${page + 1}`])
    }
    y = drawInfoTable(doc, rows, MARGIN_LEFT, y, CONTENT_WIDTH, { title: `Data Table ${page + 2}` })
  }
  
  addDisclaimerPage(doc)
  
  const footerInfo = drawPageFooter(doc, 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.')
  
  console.log('=== Report Summary ===')
  console.log('Total pages:', doc.getNumberOfPages())
  console.log('Footer separatorY:', footerInfo.separatorY)
  console.log('Footer brandY:', footerInfo.brandY)
  console.log('Footer reserve in checkPageBreak: 40mm')
  console.log('Content cutoff Y (PAGE_HEIGHT - 40):', PAGE_HEIGHT - 40)
  console.log('Footer starts at separatorY:', footerInfo.separatorY)
  console.log('Gap between content cutoff and footer:', (PAGE_HEIGHT - 40) - footerInfo.separatorY, 'mm')
  
  return doc
}

const doc = createTestReport()
const pdfData = doc.output('arraybuffer')
fs.writeFileSync('/workspace/frontend/dist/test-full-report.pdf', Buffer.from(pdfData))
console.log('Saved: test-full-report.pdf')
