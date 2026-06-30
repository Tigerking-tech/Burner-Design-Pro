import { jsPDF } from 'jspdf'

const unicodeReplacements: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
  '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
  'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
  'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
  'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
  'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'υ': 'upsilon',
  'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
  'Α': 'Alpha', 'Β': 'Beta', 'Γ': 'Gamma', 'Δ': 'Delta',
  'Ε': 'Epsilon', 'Ζ': 'Zeta', 'Η': 'Eta', 'Θ': 'Theta',
  'Ι': 'Iota', 'Κ': 'Kappa', 'Λ': 'Lambda', 'Μ': 'Mu',
  'Ν': 'Nu', 'Ξ': 'Xi', 'Ο': 'Omicron', 'Π': 'Pi',
  'Ρ': 'Rho', 'Σ': 'Sigma', 'Τ': 'Tau', 'Υ': 'Upsilon',
  'Φ': 'Phi', 'Χ': 'Chi', 'Ψ': 'Psi', 'Ω': 'Omega',
  '°': 'deg ',
  '·': '.',
  '×': 'x',
  '÷': '/',
  '±': '+/-',
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '≈': '~=',
  '∞': 'infinity',
  '√': 'sqrt',
  '∆': 'Delta ',
  '∑': 'Sigma ',
  '∫': 'integral ',
  '‰': 'permil',
  '‱': 'basis point',
  '—': '-',
  '–': '-',
  '―': '-',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '«': '<<',
  '»': '>>',
  '…': '...',
  '•': '*',
  '▪': '-',
  '▫': '-',
  '◆': '*',
  '◇': '*',
  '○': 'o',
  '●': '*',
  '■': '*',
  '□': '[]',
  '▲': '^',
  '▼': 'v',
  '◀': '<',
  '▶': '>',
  '←': '<-',
  '→': '->',
  '↑': '^',
  '↓': 'v',
  '↔': '<->',
  '↕': '^v',
  '⇐': '<=',
  '⇒': '=>',
  '⇑': '^',
  '⇓': 'v',
  '⚠': '[!]',
  '✓': '[x]',
  '✗': '[ ]',
  '✔': '[x]',
  '✘': '[ ]',
  '©': '(c)',
  '®': '(r)',
  '™': '(tm)',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₩': 'KRW',
  '₽': 'RUB',
  '₹': 'INR',
  '₺': 'TRY',
  '₴': 'UAH',
  '₦': 'NGN',
  '₱': 'PHP',
  '₫': 'VND',
  '฿': 'THB',
  '₵': 'GHS',
  '₲': 'PYG',
  '₼': 'AZN',
  '₾': 'GEL',
  '₸': 'KZT',
  '₿': 'BTC',
  'm³': 'm3',
  'kg/m³': 'kg/m3',
  'm³/h': 'm3/h',
  'm³/s': 'm3/s',
  'Δp': 'Delta P',
  'ΔP': 'Delta P',
  'ΔT': 'Delta T',
  'W/m·K': 'W/m-K',
  'W/m²': 'W/m2',
  'W/m²·K': 'W/m2-K',
  'kWh/m³': 'kWh/m3',
}

export const PAGE_WIDTH = 210
export const PAGE_HEIGHT = 297
export const MARGIN_LEFT = 18
export const MARGIN_RIGHT = 18
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
export const HEADER_HEIGHT = 36
export const FOOTER_Y = 282

export const COLORS = {
  primary: { r: 44, g: 62, b: 80 },
  secondary: { r: 52, g: 73, b: 94 },
  accent: { r: 243, g: 156, b: 18 },
  accentDark: { r: 230, g: 126, b: 34 },
  textDark: { r: 44, g: 62, b: 80 },
  textMedium: { r: 85, g: 85, b: 85 },
  textLight: { r: 127, g: 140, b: 141 },
  bgLight: { r: 248, g: 249, b: 250 },
  bgGray: { r: 236, g: 240, b: 241 },
  border: { r: 220, g: 220, b: 220 },
  success: { r: 39, g: 174, b: 96 },
  warning: { r: 243, g: 156, b: 18 },
  danger: { r: 231, g: 76, b: 60 },
  info: { r: 52, g: 152, b: 219 },
}

export type PdfTableRow = [string, string]
export type PdfTableHeader = [string, string]

export function sanitizeText(text: string | number): string {
  let result = String(text)
  for (const [unicode, ascii] of Object.entries(unicodeReplacements)) {
    result = result.split(unicode).join(ascii)
  }
  result = result.replace(/[^\x00-\x7F]/g, '')
  return result
}

export function createPDF(): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'normal')
  return doc
}

export function setTextColor(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setTextColor(color.r, color.g, color.b)
}

export function setFillColor(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setFillColor(color.r, color.g, color.b)
}

export function setDrawColor(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setDrawColor(color.r, color.g, color.b)
}

export function addCoverPage(
  doc: jsPDF,
  options: {
    title: string
    subtitle: string
    reportType: string
    standard?: string
    projectId?: string
    version?: string
  }
): void {
  setFillColor(doc, COLORS.primary)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  setFillColor(doc, COLORS.accent)
  doc.rect(0, 105, PAGE_WIDTH, 2, 'F')
  doc.rect(0, 175, PAGE_WIDTH, 1, 'F')

  setTextColor(doc, COLORS.accent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('BURNER-DESIGN-PRO', MARGIN_LEFT, 35)

  setTextColor(doc, { r: 189, g: 195, b: 199 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Professional Engineering Calculation Tools', MARGIN_LEFT, 42)

  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  const titleLines = doc.splitTextToSize(sanitizeText(options.title), 180)
  doc.text(titleLines, MARGIN_LEFT, 125)

  setTextColor(doc, { r: 189, g: 195, b: 199 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const subtitleLines = doc.splitTextToSize(sanitizeText(options.subtitle), 170)
  doc.text(subtitleLines, MARGIN_LEFT, 155)

  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('REPORT INFORMATION', MARGIN_LEFT, 195)

  setFillColor(doc, COLORS.accent)
  doc.rect(MARGIN_LEFT, 199, 25, 0.8, 'F')

  const infoItems: [string, string][] = [
    ['Report Type', options.reportType],
    ['Date', new Date().toLocaleDateString('en-US')],
  ]
  if (options.standard) infoItems.push(['Standard', options.standard])
  if (options.projectId) infoItems.push(['Project ID', options.projectId])
  if (options.version) infoItems.push(['Version', options.version])

  let y = 215
  infoItems.forEach(([label, value]) => {
    setTextColor(doc, { r: 189, g: 195, b: 199 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(sanitizeText(label), MARGIN_LEFT, y)

    setTextColor(doc, { r: 255, g: 255, b: 255 })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(sanitizeText(value), MARGIN_LEFT + 40, y)
    y += 9
  })

  setTextColor(doc, { r: 127, g: 140, b: 141 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Confidential - For internal use and client reference only', MARGIN_LEFT, 270)
  doc.text('(c) ' + new Date().getFullYear() + ' Burner-Design-Pro. All rights reserved.', MARGIN_LEFT, 277)

  doc.addPage()
}

export function drawPageHeader(
  doc: jsPDF,
  documentTitle: string,
  section: string
): number {
  setFillColor(doc, COLORS.primary)
  doc.rect(0, 0, PAGE_WIDTH, 18, 'F')

  setFillColor(doc, COLORS.accent)
  doc.rect(0, 18, PAGE_WIDTH, 1.2, 'F')

  setTextColor(doc, { r: 255, g: 255, b: 255 })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(sanitizeText(documentTitle), MARGIN_LEFT, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sanitizeText(section), PAGE_WIDTH - MARGIN_RIGHT, 11, { align: 'right' })

  return 26
}

export function drawSectionTitle(
  doc: jsPDF,
  title: string,
  y: number,
  subtitle?: string
): number {
  setFillColor(doc, COLORS.accent)
  doc.rect(MARGIN_LEFT, y - 1, 4, 9, 'F')

  setTextColor(doc, COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(sanitizeText(title), MARGIN_LEFT + 8, y + 5)

  let nextY = y + 10
  if (subtitle) {
    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(sanitizeText(subtitle), MARGIN_LEFT + 8, nextY + 1)
    nextY += 7
  }

  nextY += 4
  return nextY
}

export function drawSubSectionTitle(
  doc: jsPDF,
  title: string,
  y: number
): number {
  setTextColor(doc, COLORS.secondary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(sanitizeText(title), MARGIN_LEFT, y)

  setDrawColor(doc, COLORS.border)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_LEFT, y + 2, PAGE_WIDTH - MARGIN_RIGHT, y + 2)
  doc.setLineWidth(0.2)

  return y + 9
}

export function drawInfoTable(
  doc: jsPDF,
  rows: PdfTableRow[],
  x: number,
  y: number,
  width: number,
  options?: {
    title?: string
    labelWidthRatio?: number
    rowHeight?: number
    fontSize?: number
  }
): number {
  let currentY = y
  const rowHeight = options?.rowHeight || 7.5
  const labelWidth = width * (options?.labelWidthRatio || 0.48)
  const fontSize = options?.fontSize || 8.5

  if (options?.title) {
    setFillColor(doc, COLORS.primary)
    doc.roundedRect(x, currentY, width, 9, 1.5, 1.5, 'F')
    setTextColor(doc, { r: 255, g: 255, b: 255 })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(sanitizeText(options.title), x + 5, currentY + 6)
    currentY += 9
  }

  rows.forEach((row, index) => {
    const fill = index % 2 === 0 ? 252 : 255
    doc.setFillColor(fill, fill, fill)
    setDrawColor(doc, COLORS.border)
    doc.rect(x, currentY, width, rowHeight, 'FD')
    doc.setLineWidth(0.1)
    doc.line(x + labelWidth, currentY, x + labelWidth, currentY + rowHeight)
    doc.setLineWidth(0.2)

    setTextColor(doc, COLORS.textMedium)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    doc.text(sanitizeText(row[0]), x + 3, currentY + rowHeight / 2 + fontSize / 3)

    setTextColor(doc, COLORS.textDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fontSize)
    const value = sanitizeText(row[1])
    const lines = doc.splitTextToSize(value, width - labelWidth - 6)
    if (lines.length > 0) {
      doc.text(lines[0], x + labelWidth + 3, currentY + rowHeight / 2 + fontSize / 3)
    }

    currentY += rowHeight
  })

  setTextColor(doc, { r: 0, g: 0, b: 0 })
  setDrawColor(doc, { r: 0, g: 0, b: 0 })
  return currentY + 6
}

export function drawResultCard(
  doc: jsPDF,
  options: {
    label: string
    value: string
    unit?: string
    x: number
    y: number
    width: number
    highlight?: boolean
    status?: 'success' | 'warning' | 'danger' | 'info'
  }
): number {
  const cardHeight = 32
  const isHighlight = options.highlight || options.status

  if (options.status) {
    const statusColor = options.status === 'success' ? COLORS.success
      : options.status === 'warning' ? COLORS.warning
      : options.status === 'danger' ? COLORS.danger
      : COLORS.info
    setFillColor(doc, statusColor)
    doc.roundedRect(options.x, options.y, options.width, cardHeight, 2, 2, 'F')
    setFillColor(doc, { r: 255, g: 255, b: 255 })
    doc.roundedRect(options.x + 2, options.y + 2, options.width - 4, cardHeight - 4, 1.5, 1.5, 'F')
  } else if (isHighlight) {
    setFillColor(doc, COLORS.accent)
    doc.roundedRect(options.x, options.y, options.width, cardHeight, 2, 2, 'F')
    setFillColor(doc, { r: 255, g: 255, b: 255 })
    doc.roundedRect(options.x + 2, options.y + 2, options.width - 4, cardHeight - 4, 1.5, 1.5, 'F')
  } else {
    setFillColor(doc, COLORS.bgLight)
    setDrawColor(doc, COLORS.border)
    doc.roundedRect(options.x, options.y, options.width, cardHeight, 2, 2, 'FD')
  }

  setTextColor(doc, COLORS.textMedium)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(sanitizeText(options.label), options.x + 8, options.y + 10)

  setTextColor(doc, isHighlight ? COLORS.accent : COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(sanitizeText(options.value), options.x + 8, options.y + 22)

  if (options.unit) {
    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(sanitizeText(options.unit), options.x + 8, options.y + 27.5)
  }

  return options.y + cardHeight + 5
}

export function drawTwoColumnTables(
  doc: jsPDF,
  leftTable: { title?: string; rows: PdfTableRow[] },
  rightTable: { title?: string; rows: PdfTableRow[] },
  y: number
): number {
  const colWidth = (CONTENT_WIDTH - 8) / 2
  const leftY = drawInfoTable(doc, leftTable.rows, MARGIN_LEFT, y, colWidth, { title: leftTable.title })
  const rightY = drawInfoTable(doc, rightTable.rows, MARGIN_LEFT + colWidth + 8, y, colWidth, { title: rightTable.title })
  return Math.max(leftY, rightY)
}

export function drawBulletList(
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  width: number
): number {
  let currentY = y
  items.forEach(item => {
    setFillColor(doc, COLORS.accent)
    doc.circle(x + 1.5, currentY - 1.5, 1, 'F')
    setTextColor(doc, COLORS.textDark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(sanitizeText(item), width - 6)
    doc.text(lines, x + 6, currentY)
    currentY += lines.length * 5 + 3
  })
  return currentY + 2
}

export function drawPageFooter(doc: jsPDF, customNote?: string): void {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    if (i === 1 && doc.getPageCount() > 1) {
      const pageHeight = PAGE_HEIGHT
      const y = pageHeight - 5
      setTextColor(doc, COLORS.textLight)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('Burner-Design-Pro', MARGIN_LEFT, y)
      doc.text('Page 1 of ' + pageCount, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      continue
    }

    setDrawColor(doc, COLORS.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, FOOTER_Y - 6, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y - 6)
    doc.setLineWidth(0.2)

    setTextColor(doc, COLORS.textLight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)

    const note = customNote || 'For reference only - Professional engineering review required'
    doc.text(sanitizeText(note), MARGIN_LEFT, FOOTER_Y)

    doc.setFont('helvetica', 'bold')
    doc.text('Burner-Design-Pro', PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.text(sanitizeText(`Page ${i} of ${pageCount}`), PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y, { align: 'right' })
  }
  setTextColor(doc, { r: 0, g: 0, b: 0 })
}

export function addDisclaimerPage(
  doc: jsPDF,
  options?: {
    title?: string
    sections?: { heading: string; items: string[] }[]
  }
): void {
  doc.addPage()
  let y = drawPageHeader(doc, options?.title || 'IMPORTANT DISCLAIMER', 'Appendix')

  y = drawSectionTitle(doc, 'DISCLAIMER', y, 'Professional engineering review is required before field application')

  const defaultSections = [
    {
      heading: 'General Information',
      items: [
        'This calculation report is provided for informational and reference purposes only.',
        'All results are generated based on the input parameters provided by the user.',
        'Burner-Design-Pro is a calculation tool and does not replace professional engineering judgment.'
      ]
    },
    {
      heading: 'Accuracy and Reliability',
      items: [
        'While every effort has been made to ensure calculation accuracy based on applicable standards, Burner-Design-Pro makes no warranty regarding the accuracy, reliability, or applicability of these results.',
        'Calculations are based on simplified models and may not account for all site-specific conditions.',
        'Actual performance may vary due to factors not included in the calculation model.'
      ]
    },
    {
      heading: 'User Responsibilities',
      items: [
        'Verify all input parameters for correctness and completeness.',
        'Confirm results with independent calculations and engineering judgment.',
        'Ensure compliance with local codes, standards, and regulations.',
        'Obtain review and approval from a licensed professional engineer before application.',
        'Consider all safety factors and operating conditions specific to the project.'
      ]
    },
    {
      heading: 'Limitation of Liability',
      items: [
        'In no event shall Burner-Design-Pro or its developers be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of these calculations.',
        'Use of this tool and its results is at the sole risk of the user.'
      ]
    }
  ]

  const sections = options?.sections || defaultSections

  sections.forEach(section => {
    y = drawSubSectionTitle(doc, section.heading, y)
    y = drawBulletList(doc, section.items, MARGIN_LEFT + 3, y + 3, CONTENT_WIDTH - 3)
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

export function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  requiredSpace: number,
  headerTitle: string,
  headerSection: string
): number {
  if (currentY + requiredSpace > FOOTER_Y - 15) {
    doc.addPage()
    return drawPageHeader(doc, headerTitle, headerSection)
  }
  return currentY
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num) || !isFinite(num)) return '0'
  return num.toFixed(decimals)
}

export function setBold(doc: jsPDF, bold: boolean = true): void {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
}
