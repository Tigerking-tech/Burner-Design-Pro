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
}

export function sanitizeText(text: string): string {
  let result = text
  for (const [unicode, ascii] of Object.entries(unicodeReplacements)) {
    result = result.split(unicode).join(ascii)
  }
  result = result.replace(/[^\x00-\x7F]/g, '')
  return result
}

export function createPDF(): jsPDF {
  const doc = new jsPDF()
  doc.setFont('helvetica', 'normal')
  return doc
}

export function setBold(doc: jsPDF, bold: boolean = true): void {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
}

export type PdfTableRow = [string, string]

const pageWidth = 210
const margin = 18

export function drawReportHeader(doc: jsPDF, title: string, subtitle: string): number {
  doc.setFillColor(44, 62, 80)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setFillColor(243, 156, 18)
  doc.rect(0, 34, pageWidth, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(sanitizeText(title), margin, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(sanitizeText(subtitle), margin, 24)
  doc.text(sanitizeText(`Generated: ${new Date().toLocaleDateString()}`), 152, 24)

  doc.setTextColor(0, 0, 0)
  return 48
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(243, 156, 18)
  doc.rect(margin, y - 5, 3, 8, 'F')
  doc.setTextColor(44, 62, 80)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(sanitizeText(title), margin + 7, y)
  doc.setTextColor(0, 0, 0)
  return y + 8
}

export function drawInfoTable(
  doc: jsPDF,
  rows: PdfTableRow[],
  x: number,
  y: number,
  width: number,
  options?: { title?: string; highlight?: boolean }
): number {
  let currentY = y
  const rowHeight = 8
  const labelWidth = width * 0.48

  if (options?.title) {
    doc.setFillColor(options.highlight ? 243 : 52, options.highlight ? 156 : 73, options.highlight ? 18 : 94)
    doc.roundedRect(x, currentY, width, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(sanitizeText(options.title), x + 4, currentY + 6.5)
    currentY += 10
  }

  rows.forEach((row, index) => {
    const fill = index % 2 === 0 ? 248 : 255
    doc.setFillColor(fill, fill, fill)
    doc.rect(x, currentY, width, rowHeight, 'F')
    doc.setDrawColor(224, 224, 224)
    doc.rect(x, currentY, width, rowHeight)
    doc.line(x + labelWidth, currentY, x + labelWidth, currentY + rowHeight)

    doc.setFontSize(8.5)
    doc.setTextColor(85, 85, 85)
    doc.setFont('helvetica', 'normal')
    doc.text(sanitizeText(row[0]), x + 3, currentY + 5.4)

    doc.setTextColor(44, 62, 80)
    doc.setFont('helvetica', 'bold')
    const value = sanitizeText(row[1])
    const lines = doc.splitTextToSize(value, width - labelWidth - 6)
    doc.text(lines.slice(0, 1), x + labelWidth + 3, currentY + 5.4)

    currentY += rowHeight
  })

  doc.setTextColor(0, 0, 0)
  doc.setDrawColor(0, 0, 0)
  return currentY + 6
}

export function drawFooter(doc: jsPDF, note = 'Results are for reference only. Verify with qualified engineering judgment.'): void {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, 278, pageWidth - margin, 278)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(128, 128, 128)
    doc.text(sanitizeText(note), margin, 284)
    doc.text(sanitizeText(`Burner-Design-Pro | Page ${i} of ${pageCount}`), 145, 284)
  }
  doc.setTextColor(0, 0, 0)
}

export function addDisclaimerPage(doc: jsPDF, title = 'IMPORTANT DISCLAIMER'): void {
  doc.addPage()
  let y = drawReportHeader(doc, title, 'Professional engineering review is required before field application.')
  y = drawSectionTitle(doc, 'Engineering Use Notice', y)

  const lines = [
    'This report is provided for informational and reference purposes only.',
    'Calculations should be reviewed and validated by a qualified professional engineer before application to any real-world project.',
    'Burner-Design-Pro makes no warranty regarding the accuracy, reliability, or applicability of these results.',
    'The user is responsible for verifying all input parameters, confirming results independently, and ensuring compliance with local codes, standards, and regulations.'
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(44, 62, 80)
  lines.forEach(line => {
    const wrapped = doc.splitTextToSize(sanitizeText(line), 170)
    doc.text(wrapped, margin, y)
    y += wrapped.length * 6 + 5
  })
}
