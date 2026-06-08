/**
 * frontend/src/lib/adapters/pdf.ts
 *
 * PDF Report Export — programmatic multi-page jsPDF.
 * Generates a complete data report covering ALL tickers and ALL sections:
 *   Page 1     — Cover page
 *   Pages 2-5  — Concentration & Holder Registry (NVDA / GOOG / META / AMZN)
 *   Pages 6-9  — Voting vs Economic split + Share Classes (per ticker)
 *   Page 10    — Entity Comparison table
 *   Page 11    — Control Alerts + HHI scores
 *   Page 12    — Data Sources, Synthetic Note, Export Metadata
 *
 * No html2canvas — all content is programmatic text/table/lines.
 * Install: npm install jspdf
 */

export interface PdfSnapshotOptions {
  title?: string
  subtitle?: string
  filename?: string
}

// ── Colour palette (RGB tuples) ───────────────────────────────────────────────
const C = {
  bg:      [3,   7,  18] as [number,number,number],
  surface: [11,  17,  23] as [number,number,number],
  border:  [31,  41,  55] as [number,number,number],
  cyan:    [56, 189, 248] as [number,number,number],
  indigo:  [129,140, 248] as [number,number,number],
  warning: [251,191,  36] as [number,number,number],
  danger:  [248,113, 113] as [number,number,number],
  success: [ 52,211, 153] as [number,number,number],
  muted:   [ 71, 85, 105] as [number,number,number],
  sec:     [148,163, 184] as [number,number,number],
  white:   [241,245, 249] as [number,number,number],
}

// ── All data inline (mirrors mock_data.json — no fetch needed at export time) ─

const ALL_TICKERS = ['NVDA','GOOG','META','AMZN'] as const
type Ticker = typeof ALL_TICKERS[number]

const TICKER_NAMES: Record<Ticker,string> = {
  NVDA:'NVIDIA Corporation', GOOG:'Alphabet Inc', META:'Meta Platforms Inc', AMZN:'Amazon.com Inc',
}

const HOLDERS: Record<Ticker, {rank:number;name:string;type:string;economicPct:number;votingPct:number;shares:number;changeQoQ:string;filingDate:string}[]> = {
  NVDA:[
    {rank:1,name:'Vanguard Group Inc',  type:'institutional',economicPct:28.4,votingPct:22.1,shares:6920000000,changeQoQ:'+1.2%',filingDate:'2024-09-30'},
    {rank:2,name:'BlackRock Inc',       type:'institutional',economicPct:19.1,votingPct:15.2,shares:4650000000,changeQoQ:'+0.8%',filingDate:'2024-09-30'},
    {rank:3,name:'State Street Corp',   type:'institutional',economicPct:9.3, votingPct:7.4, shares:2265000000,changeQoQ:'-0.3%',filingDate:'2024-09-30'},
    {rank:4,name:'FMR LLC (Fidelity)',  type:'institutional',economicPct:8.2, votingPct:6.5, shares:1997000000,changeQoQ:'+0.5%',filingDate:'2024-09-30'},
    {rank:5,name:'Jensen Huang (CEO)',  type:'insider',      economicPct:7.8, votingPct:18.9,shares:1899000000,changeQoQ:'0.0%', filingDate:'2024-10-01'},
    {rank:6,name:'Capital Group',       type:'institutional',economicPct:6.1, votingPct:4.8, shares:1485000000,changeQoQ:'+0.2%',filingDate:'2024-09-30'},
    {rank:7,name:'T. Rowe Price',       type:'institutional',economicPct:4.2, votingPct:3.3, shares:1022000000,changeQoQ:'-0.1%',filingDate:'2024-09-30'},
    {rank:8,name:'Norges Bank',         type:'institutional',economicPct:3.1, votingPct:2.5, shares:755000000, changeQoQ:'+0.1%',filingDate:'2024-09-30'},
    {rank:9,name:'Geode Capital Mgmt',  type:'institutional',economicPct:2.8, votingPct:2.2, shares:681000000, changeQoQ:'0.0%', filingDate:'2024-09-30'},
    {rank:10,name:'Other / Public Float',type:'retail',      economicPct:11.0,votingPct:17.1,shares:2678000000,changeQoQ:'N/A',  filingDate:'N/A'},
  ],
  GOOG:[
    {rank:1,name:'Larry Page (Co-Founder)', type:'insider',      economicPct:25.4,votingPct:31.2,shares:3040000000,changeQoQ:'0.0%', filingDate:'2024-10-01'},
    {rank:2,name:'Sergey Brin (Co-Founder)',type:'insider',      economicPct:18.3,votingPct:22.5,shares:2190000000,changeQoQ:'0.0%', filingDate:'2024-10-01'},
    {rank:3,name:'Vanguard Group Inc',      type:'institutional',economicPct:14.1,votingPct:10.9,shares:1688000000,changeQoQ:'+0.6%',filingDate:'2024-09-30'},
    {rank:4,name:'BlackRock Inc',           type:'institutional',economicPct:8.7, votingPct:6.7, shares:1041000000,changeQoQ:'+0.3%',filingDate:'2024-09-30'},
    {rank:5,name:'T. Rowe Price',           type:'institutional',economicPct:5.2, votingPct:4.0, shares:622000000, changeQoQ:'-0.2%',filingDate:'2024-09-30'},
    {rank:6,name:'State Street Corp',       type:'institutional',economicPct:4.8, votingPct:3.7, shares:574000000, changeQoQ:'0.0%', filingDate:'2024-09-30'},
    {rank:7,name:'Fidelity Investments',    type:'institutional',economicPct:3.9, votingPct:3.0, shares:467000000, changeQoQ:'+0.4%',filingDate:'2024-09-30'},
    {rank:8,name:'Capital Group',           type:'institutional',economicPct:3.1, votingPct:2.4, shares:371000000, changeQoQ:'-0.1%',filingDate:'2024-09-30'},
    {rank:9,name:'Wellington Mgmt',         type:'institutional',economicPct:2.8, votingPct:2.2, shares:335000000, changeQoQ:'0.0%', filingDate:'2024-09-30'},
    {rank:10,name:'Other / Public Float',   type:'retail',      economicPct:13.7,votingPct:13.4,shares:1640000000,changeQoQ:'N/A',  filingDate:'N/A'},
  ],
  META:[
    {rank:1,name:'Mark Zuckerberg (CEO)',type:'insider',      economicPct:13.6,votingPct:56.9,shares:394000000, changeQoQ:'-0.4%',filingDate:'2024-10-01'},
    {rank:2,name:'Vanguard Group Inc',   type:'institutional',economicPct:17.8,votingPct:8.2, shares:515000000, changeQoQ:'+0.7%',filingDate:'2024-09-30'},
    {rank:3,name:'BlackRock Inc',        type:'institutional',economicPct:12.4,votingPct:5.7, shares:359000000, changeQoQ:'+0.3%',filingDate:'2024-09-30'},
    {rank:4,name:'State Street Corp',    type:'institutional',economicPct:6.7, votingPct:3.1, shares:194000000, changeQoQ:'-0.1%',filingDate:'2024-09-30'},
    {rank:5,name:'FMR LLC (Fidelity)',   type:'institutional',economicPct:5.9, votingPct:2.7, shares:171000000, changeQoQ:'+0.2%',filingDate:'2024-09-30'},
    {rank:6,name:'Capital Group',        type:'institutional',economicPct:4.1, votingPct:1.9, shares:119000000, changeQoQ:'0.0%', filingDate:'2024-09-30'},
    {rank:7,name:'T. Rowe Price',        type:'institutional',economicPct:3.8, votingPct:1.8, shares:110000000, changeQoQ:'-0.3%',filingDate:'2024-09-30'},
    {rank:8,name:'Primecap Mgmt',        type:'institutional',economicPct:2.9, votingPct:1.3, shares:84000000,  changeQoQ:'+0.1%',filingDate:'2024-09-30'},
    {rank:9,name:'Wellington Mgmt',      type:'institutional',economicPct:2.4, votingPct:1.1, shares:69000000,  changeQoQ:'0.0%', filingDate:'2024-09-30'},
    {rank:10,name:'Other / Public Float',type:'retail',      economicPct:30.4,votingPct:17.3,shares:880000000, changeQoQ:'N/A',  filingDate:'N/A'},
  ],
  AMZN:[
    {rank:1,name:'Jeff Bezos (Founder)', type:'insider',      economicPct:9.4, votingPct:9.4, shares:984000000, changeQoQ:'-0.6%',filingDate:'2024-10-01'},
    {rank:2,name:'Vanguard Group Inc',   type:'institutional',economicPct:18.1,votingPct:18.1,shares:1895000000,changeQoQ:'+0.5%',filingDate:'2024-09-30'},
    {rank:3,name:'BlackRock Inc',        type:'institutional',economicPct:11.3,votingPct:11.3,shares:1183000000,changeQoQ:'+0.4%',filingDate:'2024-09-30'},
    {rank:4,name:'State Street Corp',    type:'institutional',economicPct:5.8, votingPct:5.8, shares:607000000, changeQoQ:'-0.2%',filingDate:'2024-09-30'},
    {rank:5,name:'Andy Jassy (CEO)',     type:'insider',      economicPct:2.1, votingPct:2.1, shares:220000000, changeQoQ:'0.0%', filingDate:'2024-10-01'},
    {rank:6,name:'FMR LLC (Fidelity)',   type:'institutional',economicPct:5.4, votingPct:5.4, shares:565000000, changeQoQ:'+0.3%',filingDate:'2024-09-30'},
    {rank:7,name:'Capital Group',        type:'institutional',economicPct:4.2, votingPct:4.2, shares:440000000, changeQoQ:'0.0%', filingDate:'2024-09-30'},
    {rank:8,name:'Geode Capital Mgmt',   type:'institutional',economicPct:3.3, votingPct:3.3, shares:345000000, changeQoQ:'+0.1%',filingDate:'2024-09-30'},
    {rank:9,name:'T. Rowe Price',        type:'institutional',economicPct:2.9, votingPct:2.9, shares:304000000, changeQoQ:'-0.1%',filingDate:'2024-09-30'},
    {rank:10,name:'Other / Public Float',type:'retail',      economicPct:37.5,votingPct:37.5,shares:3928000000,changeQoQ:'N/A',  filingDate:'N/A'},
  ],
}

const METRICS: Record<Ticker,{hhi:number;alertLevel:string;shareClasses:number;insiderEconomicPct:number;insiderVotingPct:number;voteEquityRatio:number;top3Combined:number;marketCapB:number}> = {
  NVDA:{hhi:2841,alertLevel:'MEDIUM',  shareClasses:3,insiderEconomicPct:19.2,insiderVotingPct:34.1,voteEquityRatio:1.42,top3Combined:67.4,marketCapB:3200},
  GOOG:{hhi:3104,alertLevel:'HIGH',    shareClasses:3,insiderEconomicPct:43.7,insiderVotingPct:53.7,voteEquityRatio:1.73,top3Combined:64.6,marketCapB:2100},
  META:{hhi:3512,alertLevel:'CRITICAL',shareClasses:2,insiderEconomicPct:13.6,insiderVotingPct:56.9,voteEquityRatio:4.18,top3Combined:43.8,marketCapB:1580},
  AMZN:{hhi:1843,alertLevel:'LOW',     shareClasses:1,insiderEconomicPct:11.5,insiderVotingPct:11.5,voteEquityRatio:1.00,top3Combined:38.8,marketCapB:2050},
}

const SHARE_CLASSES: Record<Ticker,{class:string;votesPerShare:number;description:string;pct:number;synthetic:boolean}[]> = {
  NVDA:[{class:'A',votesPerShare:1,description:'Public market float',pct:61,synthetic:false},{class:'B',votesPerShare:10,description:'Founder / insider controlled',pct:21,synthetic:true},{class:'C',votesPerShare:0,description:'Non-voting economic interest',pct:18,synthetic:true}],
  GOOG:[{class:'A',votesPerShare:1,description:'Public (GOOGL ticker)',pct:47,synthetic:false},{class:'B',votesPerShare:10,description:'Founders / early insiders, not publicly traded',pct:17,synthetic:true},{class:'C',votesPerShare:0,description:'Non-voting (GOOG ticker)',pct:36,synthetic:false}],
  META:[{class:'A',votesPerShare:1,description:'Public market float',pct:86,synthetic:false},{class:'B',votesPerShare:10,description:'Zuckerberg 10 votes/share',pct:14,synthetic:true}],
  AMZN:[{class:'Common',votesPerShare:1,description:'Single class, all shareholders equal',pct:100,synthetic:false}],
}

const ALERTS = [
  {ticker:'META',level:'CRITICAL',title:'Founder Super-Voting Control',message:'Zuckerberg controls 56.9% of voting power via Class B shares while holding only 13.6% economic equity. Vote/equity: 4.18x. Board override risk EXTREME.',source:'SEC DEF 14A + Synthetic'},
  {ticker:'GOOG',level:'HIGH',    title:'Dual-Class Founder Concentration',message:'Page + Brin hold 53.7% combined voting. Class C (GOOG) = zero votes. Vote/equity premium: 1.73x.',source:'SEC DEF 14A + OpenCorporates'},
  {ticker:'NVDA',level:'MEDIUM',  title:'Institutional Concentration Above Threshold',message:'HHI 2,841 — 13.6% above SEC threshold 2,500. Top 3 holders (Vanguard, BlackRock, State Street) = 56.8% combined.',source:'SEC 13F + Computed HHI'},
  {ticker:'AMZN',level:'LOW',     title:'Single-Class, Within Normal Range',message:"HHI 1,843, below 2,500. Single share class. No super-voting structure. Bezos stake declined from ~16% at IPO. No blocking coalition.",source:'SEC 13F'},
]

// ── jsPDF helper types ────────────────────────────────────────────────────────
type Doc = import('jspdf').jsPDF

// ── Drawing primitives ────────────────────────────────────────────────────────

const PW = 297   // A4 landscape width mm
const PH = 210   // A4 landscape height mm
const ML = 14    // margin left
const MR = 14    // margin right
const CW = PW - ML - MR  // content width

function rgb(doc: Doc, [r,g,b]: [number,number,number]) {
  doc.setTextColor(r, g, b)
}

function fill(doc: Doc, [r,g,b]: [number,number,number]) {
  doc.setFillColor(r, g, b)
}

function drawPageHeader(doc: Doc, pageNum: number, totalPages: number, sectionTitle: string) {
  // Top bar
  fill(doc, C.surface)
  doc.rect(0, 0, PW, 10, 'F')
  // Logo mark
  fill(doc, C.bg)
  doc.rect(ML, 2, 8, 6, 'F')
  doc.setDrawColor(...C.cyan)
  doc.setLineWidth(0.3)
  doc.rect(ML, 2, 8, 6, 'S')
  doc.setFont('helvetica','bold')
  doc.setFontSize(5)
  rgb(doc, C.cyan)
  doc.text('RR', ML + 1.5, 6.2)
  // Title
  doc.setFontSize(7)
  doc.setFont('helvetica','bold')
  rgb(doc, C.cyan)
  doc.text('REAL RAILS INTELLIGENCE LIBRARY', ML + 11, 5)
  doc.setFont('helvetica','normal')
  rgb(doc, C.muted)
  doc.setFontSize(5.5)
  doc.text('CAPITAL FORMATION RAIL  ·  POC-07  ·  OWNERSHIP CONCENTRATION DASHBOARD', ML + 11, 8.5)
  // Section title (right side)
  doc.setFont('helvetica','bold')
  doc.setFontSize(6)
  rgb(doc, C.sec)
  doc.text(sectionTitle.toUpperCase(), PW - MR, 5, { align: 'right' })
  // Page number
  rgb(doc, C.muted)
  doc.setFontSize(5.5)
  doc.setFont('helvetica','normal')
  doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, 8.5, { align: 'right' })
  // Bottom border line
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(0, 10, PW, 10)
}

function drawSectionTitle(doc: Doc, y: number, text: string, color: [number,number,number] = C.cyan): number {
  doc.setFont('helvetica','bold')
  doc.setFontSize(9)
  rgb(doc, color)
  doc.text(text, ML, y)
  doc.setDrawColor(...color)
  doc.setLineWidth(0.25)
  doc.line(ML, y + 1, PW - MR, y + 1)
  return y + 6
}

function drawKV(doc: Doc, x: number, y: number, key: string, val: string, valColor: [number,number,number] = C.white): number {
  doc.setFont('helvetica','normal')
  doc.setFontSize(7)
  rgb(doc, C.muted)
  doc.text(key, x, y)
  rgb(doc, valColor)
  doc.text(val, x + 38, y)
  return y + 4.5
}

function drawAlertLevel(doc: Doc, level: string): [number,number,number] {
  if (level === 'CRITICAL') return C.danger
  if (level === 'HIGH')     return C.warning
  if (level === 'MEDIUM')   return C.indigo
  return C.success
}

// ── Table drawing ─────────────────────────────────────────────────────────────

interface ColDef { header: string; width: number; align?: 'left'|'right'|'center' }

function drawTable(
  doc: Doc,
  y: number,
  cols: ColDef[],
  rows: string[][],
  rowColors?: ([number,number,number] | null)[],
): number {
  const ROW_H = 5.5
  const HEADER_H = 6.5
  let x = ML

  // Header background
  fill(doc, C.surface)
  doc.rect(ML, y, CW, HEADER_H, 'F')

  // Header text
  doc.setFont('helvetica','bold')
  doc.setFontSize(6.5)
  rgb(doc, C.sec)
  let cx = ML
  for (const col of cols) {
    doc.text(col.header, col.align === 'right' ? cx + col.width - 1 : cx + 1, y + 4.3, { align: col.align ?? 'left' })
    cx += col.width
  }

  // Header bottom border
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(ML, y + HEADER_H, ML + CW, y + HEADER_H)
  y += HEADER_H

  // Rows
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]
    const bg: [number,number,number] = ri % 2 === 0 ? [11,17,23] : [15,25,35]
    fill(doc, bg)
    doc.rect(ML, y, CW, ROW_H, 'F')

    cx = ML
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci]
      const cellColor: [number,number,number] = rowColors?.[ci] ?? C.white
      doc.setFont('helvetica','normal')
      doc.setFontSize(6.5)
      rgb(doc, cellColor)
      doc.text(row[ci] ?? '', col.align === 'right' ? cx + col.width - 1 : cx + 1, y + 3.7, { align: col.align ?? 'left' })
      cx += col.width
    }

    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.1)
    doc.line(ML, y + ROW_H, ML + CW, y + ROW_H)
    y += ROW_H
  }

  return y + 3
}

// ── Horizontal bar (for visualising %) ───────────────────────────────────────
function drawBar(doc: Doc, x: number, y: number, value: number, maxValue: number, barW: number, color: [number,number,number]) {
  const filled = (value / maxValue) * barW
  fill(doc, C.border)
  doc.rect(x, y, barW, 2.5, 'F')
  fill(doc, color)
  doc.rect(x, y, Math.max(filled, 0.5), 2.5, 'F')
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportPdfSnapshot(options: PdfSnapshotOptions = {}): Promise<void> {
  const {
    filename = 'real-rails-ownership-full-report',
    title    = 'Ownership Concentration Dashboard',
    subtitle = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
  } = options

  let jsPDFCtor: typeof import('jspdf').jsPDF
  try {
    const mod = await import('jspdf')
    jsPDFCtor = mod.jsPDF
  } catch {
    exportViaPrint(options)
    return
  }

  const doc = new jsPDFCtor({ orientation:'landscape', unit:'mm', format:'a4' })

  // Total pages: 1 cover + 4 concentration + 4 voting + 1 compare + 1 alerts + 1 meta = 12
  const TOTAL = 12
  let page = 0

  // ── Page 1: Cover ────────────────────────────────────────────────────────────
  page++
  fill(doc, C.bg)
  doc.rect(0, 0, PW, PH, 'F')

  // Logo box
  fill(doc, C.surface)
  doc.rect(ML, 28, 20, 14, 'F')
  doc.setDrawColor(...C.cyan)
  doc.setLineWidth(0.5)
  doc.rect(ML, 28, 20, 14, 'S')
  doc.setFont('helvetica','bold')
  doc.setFontSize(12)
  rgb(doc, C.cyan)
  doc.text('RR', ML + 6, 37)

  // Main title
  doc.setFontSize(22)
  doc.setFont('helvetica','bold')
  rgb(doc, C.white)
  doc.text(title, ML + 26, 37)

  doc.setFontSize(10)
  doc.setFont('helvetica','normal')
  rgb(doc, C.sec)
  doc.text('Real Rails Intelligence Library  ·  Capital Formation Rail  ·  POC-07', ML + 26, 44)

  doc.setFontSize(8)
  rgb(doc, C.muted)
  doc.text(`Generated: ${subtitle}`, ML + 26, 50)

  // Divider
  doc.setDrawColor(...C.cyan)
  doc.setLineWidth(0.4)
  doc.line(ML, 56, PW - MR, 56)

  // Report scope table
  const scopeY = 62
  doc.setFont('helvetica','bold')
  doc.setFontSize(8)
  rgb(doc, C.cyan)
  doc.text('REPORT SCOPE', ML, scopeY)

  const scopeItems = [
    ['Entities Tracked',  'NVDA (NVIDIA)  ·  GOOG (Alphabet)  ·  META (Meta Platforms)  ·  AMZN (Amazon)'],
    ['Data Sources',      'SEC EDGAR 13F  ·  SEC DEF 14A  ·  OpenCorporates  ·  Synthetic (voting rights)'],
    ['Filing Period',     'Q3 2024 (September 30, 2024)  /  Insider filings October 1, 2024'],
    ['Metrics Included',  'Economic Ownership %  ·  Voting Power %  ·  HHI Index  ·  Share Classes  ·  Vote/Equity Ratio'],
    ['Sections',          'Concentration · Voting vs Economic · Share Classes · Compare Entities · Control Alerts'],
    ['Synthetic Note',    'Voting rights and share class multipliers are synthetic where SEC DEF 14A is incomplete'],
  ]
  let sy = scopeY + 6
  for (const [k, v] of scopeItems) {
    doc.setFont('helvetica','bold')
    doc.setFontSize(7)
    rgb(doc, C.muted)
    doc.text(k + ':', ML, sy)
    doc.setFont('helvetica','normal')
    rgb(doc, C.sec)
    doc.text(v, ML + 42, sy)
    sy += 5.5
  }

  // Page map
  sy += 4
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(ML, sy, PW - MR, sy)
  sy += 5
  doc.setFont('helvetica','bold')
  doc.setFontSize(7.5)
  rgb(doc, C.cyan)
  doc.text('PAGE INDEX', ML, sy)
  sy += 5
  const pageIndex = [
    ['Pages 2–5',  'Holder Concentration & Registry — one page per ticker (NVDA / GOOG / META / AMZN)'],
    ['Pages 6–9',  'Voting vs Economic Split & Share Classes — one page per ticker'],
    ['Page 10',    'Entity Comparison — all 4 tickers side by side'],
    ['Page 11',    'Control Alerts & HHI Concentration Scores'],
    ['Page 12',    'Data Sources, Synthetic Data Notes & Export Metadata'],
  ]
  for (const [pg, desc] of pageIndex) {
    doc.setFont('helvetica','bold')
    doc.setFontSize(7)
    rgb(doc, C.indigo)
    doc.text(pg, ML, sy)
    doc.setFont('helvetica','normal')
    rgb(doc, C.sec)
    doc.text(desc, ML + 28, sy)
    sy += 4.8
  }

  // Footer
  fill(doc, C.surface)
  doc.rect(0, PH - 10, PW, 10, 'F')
  doc.setFont('helvetica','normal')
  doc.setFontSize(6)
  rgb(doc, C.muted)
  doc.text('CONFIDENTIAL — FOR INTERNAL USE ONLY  ·  Real Rails Intelligence Library  ·  Capital Formation Rail  ·  POC-07', ML, PH - 4)
  doc.text(`Page ${page} of ${TOTAL}`, PW - MR, PH - 4, { align:'right' })

  // ── Pages 2–5: Concentration per ticker ──────────────────────────────────────
  for (const ticker of ALL_TICKERS) {
    page++
    doc.addPage()
    fill(doc, C.bg)
    doc.rect(0, 0, PW, PH, 'F')
    drawPageHeader(doc, page, TOTAL, `Concentration — ${ticker}`)

    let y = 15
    const m = METRICS[ticker]
    const holders = HOLDERS[ticker]
    const alertColor = drawAlertLevel(doc, m.alertLevel)

    // Alert banner
    fill(doc, alertColor)
    doc.rect(ML, y, 3, 8, 'F')
    fill(doc, [alertColor[0]/6, alertColor[1]/6, alertColor[2]/6])
    doc.rect(ML + 3, y, CW - 3, 8, 'F')
    doc.setFont('helvetica','bold')
    doc.setFontSize(7.5)
    rgb(doc, alertColor)
    doc.text(`CONTROL ALERT (${m.alertLevel}):`, ML + 5, y + 3.5)
    doc.setFont('helvetica','normal')
    rgb(doc, C.sec)
    doc.text(
      `Top 3 holders: ${m.top3Combined}%  ·  HHI: ${m.hhi.toLocaleString()}  ·  Threshold: 2,500  ·  Share Classes: ${m.shareClasses}  ·  Insider Economic: ${m.insiderEconomicPct}%`,
      ML + 55, y + 3.5
    )
    y += 11

    // Company header
    doc.setFont('helvetica','bold')
    doc.setFontSize(13)
    rgb(doc, C.white)
    doc.text(`${ticker}  —  ${TICKER_NAMES[ticker]}`, ML, y + 6)
    doc.setFont('helvetica','normal')
    doc.setFontSize(7)
    rgb(doc, C.muted)
    doc.text('Source: SEC EDGAR 13F filings  ·  Q3 2024', ML, y + 10.5)
    y += 14

    // Key metrics row (4 boxes)
    const metricBoxes = [
      {label:'TOP 1 HOLDER (ECON)',  val:`${holders[0].economicPct}%`,       sub:holders[0].name,                        col:C.cyan},
      {label:'HHI INDEX',            val:m.hhi.toLocaleString(),              sub:m.hhi>2500?`+${m.hhi-2500} vs threshold`:'Below threshold', col:m.hhi>2500?C.danger:C.success},
      {label:'INSIDER ECONOMIC %',   val:`${m.insiderEconomicPct}%`,          sub:'Founders + Management',                col:C.warning},
      {label:'VOTE / EQUITY RATIO',  val:`${m.voteEquityRatio.toFixed(2)}x`,  sub:'Super-voting premium',                 col:C.indigo},
    ]
    const boxW = CW / 4 - 2
    for (let i = 0; i < metricBoxes.length; i++) {
      const bx = ML + i * (boxW + 2.7)
      fill(doc, C.surface)
      doc.rect(bx, y, boxW, 14, 'F')
      doc.setDrawColor(...metricBoxes[i].col)
      doc.setLineWidth(0.2)
      doc.line(bx, y, bx + boxW, y)
      doc.setFont('helvetica','bold')
      doc.setFontSize(5.5)
      rgb(doc, C.muted)
      doc.text(metricBoxes[i].label, bx + 2, y + 4)
      doc.setFontSize(11)
      rgb(doc, metricBoxes[i].col)
      doc.text(metricBoxes[i].val, bx + 2, y + 9.5)
      doc.setFont('helvetica','normal')
      doc.setFontSize(5.5)
      rgb(doc, C.muted)
      doc.text(metricBoxes[i].sub, bx + 2, y + 12.8)
    }
    y += 18

    // Concentration bar chart (horizontal bars)
    y = drawSectionTitle(doc, y, 'Shareholder Concentration — Economic Ownership %')
    const maxPct = Math.max(...holders.map(h => h.economicPct))
    const BAR_SECTION_W = 90
    for (const h of holders) {
      const typeColor: [number,number,number] = h.type==='insider' ? C.warning : h.rank===1 ? C.cyan : h.rank<4 ? C.indigo : C.muted
      doc.setFont('helvetica','normal')
      doc.setFontSize(6)
      rgb(doc, typeColor)
      const label = h.name.length > 22 ? h.name.slice(0,21)+'…' : h.name
      doc.text(label, ML, y + 2)
      drawBar(doc, ML + 58, y - 0.5, h.economicPct, maxPct, BAR_SECTION_W, typeColor)
      rgb(doc, typeColor)
      doc.setFont('helvetica','bold')
      doc.text(`${h.economicPct.toFixed(1)}%`, ML + 58 + BAR_SECTION_W + 2, y + 2)
      doc.setFont('helvetica','normal')
      rgb(doc, C.muted)
      doc.text(`Vote: ${h.votingPct.toFixed(1)}%`, ML + 58 + BAR_SECTION_W + 18, y + 2)
      y += 4.8
    }
    y += 2

    // Holder registry table
    y = drawSectionTitle(doc, y, 'Full Holder Registry')
    y = drawTable(doc, y,
      [
        {header:'RANK', width:10,  align:'center'},
        {header:'HOLDER NAME', width:62},
        {header:'TYPE', width:24},
        {header:'ECONOMIC %', width:24, align:'right'},
        {header:'VOTING %', width:22, align:'right'},
        {header:'SHARES (B)', width:24, align:'right'},
        {header:'QoQ Δ', width:20, align:'right'},
        {header:'FILING DATE', width:CW-186},
      ],
      holders.map(h => [
        String(h.rank),
        h.name,
        h.type.toUpperCase(),
        `${h.economicPct.toFixed(1)}%`,
        `${h.votingPct.toFixed(1)}%`,
        `${(h.shares/1e9).toFixed(2)}B`,
        h.changeQoQ,
        h.filingDate,
      ])
    )
  }

  // ── Pages 6–9: Voting vs Economic + Share Classes per ticker ─────────────────
  for (const ticker of ALL_TICKERS) {
    page++
    doc.addPage()
    fill(doc, C.bg)
    doc.rect(0, 0, PW, PH, 'F')
    drawPageHeader(doc, page, TOTAL, `Voting vs Economic — ${ticker}`)

    const m = METRICS[ticker]
    const holders = HOLDERS[ticker]
    const sc = SHARE_CLASSES[ticker]
    let y = 15

    // Title
    doc.setFont('helvetica','bold')
    doc.setFontSize(12)
    rgb(doc, C.white)
    doc.text(`${ticker}  —  Voting Power vs Economic Ownership Analysis`, ML, y + 5)
    rgb(doc, C.muted)
    doc.setFont('helvetica','normal')
    doc.setFontSize(7)
    doc.text(`Vote/Equity Ratio: ${m.voteEquityRatio.toFixed(2)}x  ·  Insider Voting: ${m.insiderVotingPct}%  ·  Insider Economic: ${m.insiderEconomicPct}%  ·  Share Classes: ${m.shareClasses}`, ML, y + 10)
    y += 16

    // Left column: Vote Premium table
    const LEFT_W = 155

    y = drawSectionTitle(doc, y, 'Voting Power vs Economic Ownership — Top 9 Holders (Vote Premium = Voting% − Economic%)')

    const top9 = holders.slice(0, 9)
    y = drawTable(doc, y,
      [
        {header:'HOLDER',        width:62},
        {header:'TYPE',          width:22},
        {header:'ECONOMIC %',    width:26, align:'right'},
        {header:'VOTING %',      width:22, align:'right'},
        {header:'VOTE PREMIUM',  width:27, align:'right'},
      ],
      top9.map(h => {
        const premium = +(h.votingPct - h.economicPct).toFixed(1)
        return [
          h.name.length > 28 ? h.name.slice(0,27)+'…' : h.name,
          h.type.toUpperCase(),
          `${h.economicPct.toFixed(1)}%`,
          `${h.votingPct.toFixed(1)}%`,
          `${premium > 0 ? '+' : ''}${premium.toFixed(1)}%`,
        ]
      })
    )

    // Vote premium bars
    y = drawSectionTitle(doc, y, 'Vote Premium Visualisation — Positive = Super-Voter, Negative = Diluted')
    for (const h of top9) {
      const premium = +(h.votingPct - h.economicPct).toFixed(1)
      const barColor: [number,number,number] = premium > 5 ? C.warning : premium > 0 ? C.success : C.danger
      const name = h.name.split(' ')[0]
      doc.setFont('helvetica','normal')
      doc.setFontSize(6)
      rgb(doc, C.sec)
      doc.text(name, ML, y + 2)
      // Zero line at x=68
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.15)
      doc.line(ML + 30, y, ML + 30, y + 3.5)
      // Bar
      const scale = 50 / 30   // 30% max → 50mm
      const barLen = Math.abs(premium) * scale
      if (premium >= 0) {
        fill(doc, barColor)
        doc.rect(ML + 30, y, Math.min(barLen, 50), 3, 'F')
      } else {
        fill(doc, barColor)
        doc.rect(ML + 30 - Math.min(barLen, 28), y, Math.min(barLen, 28), 3, 'F')
      }
      doc.setFont('helvetica','bold')
      rgb(doc, barColor)
      doc.setFontSize(6)
      doc.text(`${premium > 0 ? '+' : ''}${premium.toFixed(1)}%`, ML + 83, y + 2.5)
      y += 4.5
    }
    y += 3

    // Share classes section
    y = drawSectionTitle(doc, y, 'Share Class Structure')
    y = drawTable(doc, y,
      [
        {header:'CLASS',          width:20},
        {header:'VOTES / SHARE',  width:30, align:'center'},
        {header:'DISTRIBUTION %', width:30, align:'right'},
        {header:'SYNTHETIC',      width:25, align:'center'},
        {header:'DESCRIPTION',    width:CW-105},
      ],
      sc.map(c => [
        `Class ${c.class}`,
        c.votesPerShare === 0 ? 'NO VOTE' : `${c.votesPerShare}x`,
        `${c.pct}%`,
        c.synthetic ? 'YES' : 'NO',
        c.description,
      ])
    )

    // Synthetic data note
    fill(doc, [15,20,10])
    doc.rect(ML, y + 2, CW, 8, 'F')
    doc.setDrawColor(...C.warning)
    doc.setLineWidth(0.2)
    doc.rect(ML, y + 2, CW, 8, 'S')
    doc.setFont('helvetica','bold')
    doc.setFontSize(6.5)
    rgb(doc, C.warning)
    doc.text('⚠ SYNTHETIC DATA NOTE:', ML + 2, y + 6)
    doc.setFont('helvetica','normal')
    rgb(doc, C.sec)
    doc.text('Share class multipliers and voting power fields marked SYNTHETIC are derived per Real Rails Protocol where SEC DEF 14A disclosure is incomplete. Do not present as confirmed SEC figures.', ML + 44, y + 6)
  }

  // ── Page 10: Entity Comparison ────────────────────────────────────────────────
  page++
  doc.addPage()
  fill(doc, C.bg)
  doc.rect(0, 0, PW, PH, 'F')
  drawPageHeader(doc, page, TOTAL, 'Entity Comparison')

  let y = 15
  y = drawSectionTitle(doc, y, 'Side-by-Side Entity Comparison — Capital Formation Profile')

  // 4-column entity cards
  const cardW = CW / 4 - 2
  const CARD_ROWS = [
    ['Alert Level',       (t:Ticker) => METRICS[t].alertLevel],
    ['Top Econ. Holder',  (t:Ticker) => `${HOLDERS[t][0].name.split(' ')[0]} ${HOLDERS[t][0].economicPct.toFixed(1)}%`],
    ['Top Vote Holder',   (t:Ticker) => { const top = [...HOLDERS[t]].sort((a,b)=>b.votingPct-a.votingPct)[0]; return `${top.name.split(' ')[0]} ${top.votingPct.toFixed(1)}%` }],
    ['HHI Score',         (t:Ticker) => METRICS[t].hhi.toLocaleString()],
    ['Share Classes',     (t:Ticker) => String(METRICS[t].shareClasses)],
    ['Insider Economic',  (t:Ticker) => `${METRICS[t].insiderEconomicPct.toFixed(1)}%`],
    ['Insider Voting',    (t:Ticker) => `${METRICS[t].insiderVotingPct.toFixed(1)}%`],
    ['Vote/Equity Ratio', (t:Ticker) => `${METRICS[t].voteEquityRatio.toFixed(2)}x`],
    ['Market Cap',        (t:Ticker) => `$${METRICS[t].marketCapB.toLocaleString()}B`],
    ['Data Sources',      (_:Ticker) => 'SEC EDGAR 13F + OpenCorporates'],
  ] as [string, (t:Ticker)=>string][]

  // Card headers
  for (let i = 0; i < ALL_TICKERS.length; i++) {
    const t = ALL_TICKERS[i]
    const bx = ML + i * (cardW + 2.7)
    const alertCol = drawAlertLevel(doc, METRICS[t].alertLevel)
    fill(doc, C.surface)
    doc.rect(bx, y, cardW, 9, 'F')
    doc.setDrawColor(...alertCol)
    doc.setLineWidth(0.3)
    doc.line(bx, y, bx + cardW, y)
    doc.setFont('helvetica','bold')
    doc.setFontSize(10)
    rgb(doc, C.white)
    doc.text(t, bx + 2, y + 5)
    doc.setFontSize(6)
    rgb(doc, alertCol)
    doc.text(METRICS[t].alertLevel, bx + cardW - 2, y + 3, { align:'right' })
    doc.setFont('helvetica','normal')
    doc.setFontSize(5.5)
    rgb(doc, C.muted)
    doc.text(TICKER_NAMES[t], bx + 2, y + 8)
  }
  y += 12

  // Data rows
  for (const [label, getter] of CARD_ROWS) {
    for (let i = 0; i < ALL_TICKERS.length; i++) {
      const t = ALL_TICKERS[i]
      const bx = ML + i * (cardW + 2.7)
      const val = getter(t)
      const rowBg: [number,number,number] = CARD_ROWS.indexOf([label,getter] as typeof CARD_ROWS[number]) % 2 === 0 ? C.surface : [15,25,35]
      fill(doc, rowBg)
      doc.rect(bx, y, cardW, 5.5, 'F')
      doc.setFont('helvetica','normal')
      doc.setFontSize(5.5)
      rgb(doc, C.muted)
      doc.text(label, bx + 1.5, y + 2.2)
      // Value colour logic
      let valCol: [number,number,number] = C.white
      if (label === 'Alert Level') valCol = drawAlertLevel(doc, val)
      else if (label === 'HHI Score') valCol = parseInt(val.replace(',','')) > 2500 ? C.danger : C.success
      else if (label.includes('Insider Voting') || label.includes('Vote/Equity')) valCol = C.warning
      else if (label.includes('Economic') && i===0) valCol = C.cyan
      doc.setFont('helvetica','bold')
      doc.setFontSize(6)
      rgb(doc, valCol)
      doc.text(val, bx + cardW - 1.5, y + 4.2, { align:'right' })
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(bx, y + 5.5, bx + cardW, y + 5.5)
    }
    y += 5.5
  }

  y += 6
  // Cross-entity comparison table
  y = drawSectionTitle(doc, y, 'Cross-Entity Metrics Summary Table')
  y = drawTable(doc, y,
    [
      {header:'TICKER',            width:18},
      {header:'COMPANY',           width:50},
      {header:'HHI',               width:20, align:'right'},
      {header:'ALERT',             width:22, align:'center'},
      {header:'CLASSES',           width:18, align:'center'},
      {header:'INSIDER ECON %',    width:28, align:'right'},
      {header:'INSIDER VOTE %',    width:28, align:'right'},
      {header:'VOTE/EQTY',         width:24, align:'right'},
      {header:'MARKET CAP',        width:CW-208, align:'right'},
    ],
    ALL_TICKERS.map(t => {
      const m = METRICS[t]
      return [
        t,
        TICKER_NAMES[t],
        m.hhi.toLocaleString(),
        m.alertLevel,
        String(m.shareClasses),
        `${m.insiderEconomicPct.toFixed(1)}%`,
        `${m.insiderVotingPct.toFixed(1)}%`,
        `${m.voteEquityRatio.toFixed(2)}x`,
        `$${m.marketCapB.toLocaleString()}B`,
      ]
    })
  )

  // ── Page 11: Alerts + HHI ─────────────────────────────────────────────────────
  page++
  doc.addPage()
  fill(doc, C.bg)
  doc.rect(0, 0, PW, PH, 'F')
  drawPageHeader(doc, page, TOTAL, 'Control Alerts')

  y = 15

  // HHI bar chart (horizontal)
  y = drawSectionTitle(doc, y, 'HHI Concentration Score vs SEC Threshold (2,500) — All Entities')

  const HHI_BAR_MAX = 4200
  const HHI_BAR_W   = 120
  for (const ticker of ALL_TICKERS) {
    const m = METRICS[ticker]
    const alertCol = drawAlertLevel(doc, m.alertLevel)
    doc.setFont('helvetica','bold')
    doc.setFontSize(8)
    rgb(doc, C.white)
    doc.text(ticker, ML, y + 3)
    // Background bar
    fill(doc, C.border)
    doc.rect(ML + 20, y, HHI_BAR_W, 5, 'F')
    // Value bar
    fill(doc, alertCol)
    doc.rect(ML + 20, y, (m.hhi / HHI_BAR_MAX) * HHI_BAR_W, 5, 'F')
    // Threshold line at 2500
    const threshX = ML + 20 + (2500 / HHI_BAR_MAX) * HHI_BAR_W
    doc.setDrawColor(...C.warning)
    doc.setLineWidth(0.4)
    doc.line(threshX, y - 1, threshX, y + 6)
    // Labels
    doc.setFont('helvetica','bold')
    doc.setFontSize(7)
    rgb(doc, alertCol)
    doc.text(m.hhi.toLocaleString(), ML + 20 + HHI_BAR_W + 3, y + 3.5)
    doc.setFont('helvetica','normal')
    rgb(doc, C.muted)
    doc.text(m.alertLevel, ML + 20 + HHI_BAR_W + 18, y + 3.5)
    rgb(doc, C.muted)
    doc.text(m.hhi > 2500 ? `+${m.hhi - 2500} above limit` : 'Below threshold', ML + 20 + HHI_BAR_W + 36, y + 3.5)
    y += 9
  }

  // Threshold legend
  doc.setFont('helvetica','normal')
  doc.setFontSize(6)
  rgb(doc, C.warning)
  doc.text('| = SEC threshold 2,500', ML + 20 + (2500/HHI_BAR_MAX)*HHI_BAR_W - 2, y)
  y += 8

  // Alert cards
  y = drawSectionTitle(doc, y, 'Active Control Alerts — Severity Ranked')

  for (const alert of ALERTS) {
    const alertCol = drawAlertLevel(doc, alert.level)
    // Left accent bar
    fill(doc, alertCol)
    doc.rect(ML, y, 2.5, 18, 'F')
    // Card background
    fill(doc, C.surface)
    doc.rect(ML + 2.5, y, CW - 2.5, 18, 'F')
    // Header row
    doc.setFont('helvetica','bold')
    doc.setFontSize(8)
    rgb(doc, C.white)
    doc.text(`${alert.ticker}`, ML + 5, y + 5)
    doc.setFontSize(7)
    rgb(doc, alertCol)
    doc.text(alert.level, ML + 18, y + 5)
    rgb(doc, C.white)
    doc.text(alert.title, ML + 35, y + 5)
    // Message
    doc.setFont('helvetica','normal')
    doc.setFontSize(6.5)
    rgb(doc, C.sec)
    // Word-wrap manually — split at 120 chars across 2 lines
    const msg = alert.message
    const line1 = msg.slice(0, 120)
    const line2 = msg.slice(120)
    doc.text(line1, ML + 5, y + 10)
    if (line2) doc.text(line2, ML + 5, y + 13.5)
    // Source
    doc.setFontSize(6)
    rgb(doc, C.muted)
    doc.text(`Source: ${alert.source}`, ML + 5, y + 17)
    y += 21
  }

  // ── Page 12: Data Sources & Metadata ─────────────────────────────────────────
  page++
  doc.addPage()
  fill(doc, C.bg)
  doc.rect(0, 0, PW, PH, 'F')
  drawPageHeader(doc, page, TOTAL, 'Data Sources & Metadata')

  y = 15
  y = drawSectionTitle(doc, y, 'Data Sources & API Provenance')

  const sourceRows = [
    ['SEC EDGAR 13F',    'Quarterly institutional holdings reports (>$100M AUM). Economic ownership %,\nshare counts, filing dates. T+45 day publication lag.', 'https://data.sec.gov/submissions/', 'Public — no API key'],
    ['SEC DEF 14A',      'Annual proxy statements. Voting structure, share class multipliers, insider stakes.\nSynthetic where incomplete.', 'https://efts.sec.gov/LATEST/search-index', 'Public — no API key'],
    ['SEC Form 4',       'Insider transaction filings. T+2 business day publication. PII-adjacent (named individuals).', 'https://efts.sec.gov/LATEST/search-index', 'Public — no API key'],
    ['OpenCorporates',  'Entity classification (institutional vs insider), company number, jurisdiction,\nregistered officer names.', 'https://api.opencorporates.com/v0.4', 'API key required (OPENCORPORATES_API_KEY)'],
    ['Rail Compute',    'Synthetic field generation: votingPct, voteEquityRatio, insiderVotingPct, HHI.\nDerived from disclosed Class B structures.', 'Internal', 'No external dependency'],
  ]

  for (const [src, desc, url, auth] of sourceRows) {
    fill(doc, C.surface)
    doc.rect(ML, y, CW, 16, 'F')
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.15)
    doc.rect(ML, y, CW, 16, 'S')
    doc.setFont('helvetica','bold')
    doc.setFontSize(7.5)
    rgb(doc, C.cyan)
    doc.text(src, ML + 2, y + 5)
    doc.setFont('helvetica','normal')
    doc.setFontSize(6.5)
    rgb(doc, C.sec)
    const lines = desc.split('\n')
    doc.text(lines[0], ML + 2, y + 9)
    if (lines[1]) doc.text(lines[1], ML + 2, y + 12.5)
    rgb(doc, C.muted)
    doc.setFontSize(6)
    doc.text(`URL: ${url}`, ML + 120, y + 5)
    doc.text(`Auth: ${auth}`, ML + 120, y + 9)
    y += 18
  }

  y += 4
  y = drawSectionTitle(doc, y, 'Synthetic Data Protocol')
  const synRows = [
    ['votingPct',          'Synthetic where SEC DEF 14A is incomplete. Uses Class B multiplier × disclosed share count.'],
    ['voteEquityRatio',    'Computed: insiderVotingPct / insiderEconomicPct. Fully synthetic for dual-class entities.'],
    ['insiderVotingPct',   'Aggregated insider voting — derived from disclosed Class B structures. Mark as SYNTHETIC in all exports.'],
    ['hhi',                'Computed Herfindahl-Hirschman Index from top-10 holder distribution. Not a regulatory filing.'],
    ['shareClass (B/C)',   'Vote multipliers (10x Class B, 0x Class C) are synthetic where not fully disclosed in DEF 14A.'],
  ]
  y = drawTable(doc, y,
    [{header:'FIELD', width:45},{header:'SYNTHETIC DERIVATION METHOD', width:CW-45}],
    synRows
  )

  // Export metadata box
  y += 4
  fill(doc, C.surface)
  doc.rect(ML, y, CW, 22, 'F')
  doc.setDrawColor(...C.cyan)
  doc.setLineWidth(0.25)
  doc.rect(ML, y, CW, 22, 'S')
  doc.setFont('helvetica','bold')
  doc.setFontSize(7.5)
  rgb(doc, C.cyan)
  doc.text('EXPORT METADATA', ML + 3, y + 5)
  const metaKV = [
    ['Report Generated', subtitle],
    ['Tickers',          ALL_TICKERS.join('  ·  ')],
    ['Total Pages',      String(TOTAL)],
    ['Data Mode',        'MOCK — synthetic voting rights per Real Rails Protocol'],
    ['Disclaimer',       'For internal demonstration only. Not financial or legal advice. Verify all figures against primary SEC filings.'],
  ]
  let my = y + 10
  for (const [k, v] of metaKV) {
    doc.setFont('helvetica','bold')
    doc.setFontSize(6.5)
    rgb(doc, C.muted)
    doc.text(k + ':', ML + 3, my)
    doc.setFont('helvetica','normal')
    rgb(doc, C.sec)
    doc.text(v, ML + 40, my)
    my += 4
  }

  // Save
  doc.save(`${filename}.pdf`)
}

// ── Fallback: browser print dialog ───────────────────────────────────────────
export function exportViaPrint(options: PdfSnapshotOptions = {}): void {
  const { title = 'Ownership Concentration Dashboard', subtitle } = options
  const hdr = document.createElement('div')
  hdr.id = '__rr_ph__'
  hdr.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#030712;color:#F1F5F9;padding:12px 24px;font-family:Space Mono,monospace;font-size:11px;display:none;'
  hdr.innerHTML = `<div style="font-size:14px;font-weight:700;color:#38BDF8;">${title}</div>${subtitle?`<div style="color:#94A3B8;margin-top:2px;">${subtitle}</div>`:''}<div style="color:#475569;margin-top:2px;">Real Rails Intelligence Library · POC-07</div>`
  document.body.appendChild(hdr)
  const st = document.createElement('style')
  st.id = '__rr_ps__'
  st.textContent = '@media print{#__rr_ph__{display:block!important;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}'
  document.head.appendChild(st)
  window.print()
  setTimeout(()=>{ document.getElementById('__rr_ph__')?.remove(); document.getElementById('__rr_ps__')?.remove() }, 2000)
}

export type { PdfSnapshotOptions as PdfOptions }