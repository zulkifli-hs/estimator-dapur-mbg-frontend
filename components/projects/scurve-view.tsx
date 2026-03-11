"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FileDown, Loader2 } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SCurveItem {
  name: string
  section: string
  subsection: string
  startDate: Date | null
  endDate: Date | null
  durationDays: number
  totalPrice: number
  weight: number
}

interface SCurveGroup {
  section: string
  subsections: {
    subsection: string
    items: SCurveItem[]
  }[]
}

interface Week {
  key: string
  label: string
  start: Date
  end: Date
}

// ─── Category colour palette ──────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  string,
  { sectionHeader: string; subsectionHeader: string }
> = {
  Preliminary: {
    sectionHeader: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
    subsectionHeader: "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  },
  "Fitting Out": {
    sectionHeader: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200",
    subsectionHeader: "bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  },
  "Furniture Work": {
    sectionHeader: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
    subsectionHeader: "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  },
  MEP: {
    sectionHeader: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    subsectionHeader: "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  },
}

function getCategoryStyle(section: string) {
  return (
    CATEGORY_STYLES[section] ?? {
      sectionHeader: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
      subsectionHeader: "bg-slate-50 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300",
    }
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function getSunday(monday: Date): Date {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
}

function weekOfMonth(monday: Date): number {
  const year = monday.getFullYear()
  const month = monday.getMonth()
  let count = 0
  const cursor = new Date(year, month, 1)
  while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() + 1)
  while (cursor <= monday && cursor.getMonth() === month) {
    count++
    cursor.setDate(cursor.getDate() + 7)
  }
  return count === 0 ? 1 : count
}

function generateWeeks(from: Date, to: Date): Week[] {
  const weeks: Week[] = []
  let monday = getMonday(from)
  const endSunday = getSunday(getMonday(to))
  while (monday <= endSunday) {
    const wom = weekOfMonth(monday)
    const ml = monthLabel(monday)
    weeks.push({
      key: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-W${wom}`,
      label: `W${wom} ${ml}`,
      start: new Date(monday),
      end: getSunday(monday),
    })
    monday = new Date(monday)
    monday.setDate(monday.getDate() + 7)
  }
  return weeks
}

function overlapDays(itemStart: Date, itemEnd: Date, weekStart: Date, weekEnd: Date): number {
  const start = Math.max(itemStart.getTime(), weekStart.getTime())
  const end = Math.min(itemEnd.getTime(), weekEnd.getTime())
  if (start > end) return 0
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID")
}

function formatDate(d: Date | null): string {
  if (!d) return "-"
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// ─── Bottom S-Curve SVG ───────────────────────────────────────────────────────
// Rendered as a real DOM child inside a tfoot <td>.
// Because it lives in the normal document flow, html2canvas captures it at the
// correct position with zero offset drift — regardless of container scroll or
// width changes made during export.

interface BottomSCurveSvgProps {
  cumulativeWeights: number[]
  weekCount: number
}

function BottomSCurveSvg({ cumulativeWeights, weekCount }: BottomSCurveSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cx = (i: number, w: number) => ((i + 0.5) / weekCount) * w
  const cy = (c: number, h: number) => h * (1 - c / 100)

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {size && size.width > 0 && size.height > 0 && (
        <svg
          width={size.width}
          height={size.height}
          style={{ display: "block", overflow: "visible" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bottom-scurve-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(221.2,83.2%,53.3%)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(221.2,83.2%,53.3%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={[
              `M ${cx(0, size.width)} ${size.height}`,
              ...cumulativeWeights.map((c, i) => `L ${cx(i, size.width)} ${cy(c, size.height)}`),
              `L ${cx(weekCount - 1, size.width)} ${size.height}`,
              "Z",
            ].join(" ")}
            fill="url(#bottom-scurve-grad)"
          />
          <polyline
            points={cumulativeWeights.map((c, i) => `${cx(i, size.width)},${cy(c, size.height)}`).join(" ")}
            fill="none"
            stroke="hsl(221.2,83.2%,53.3%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {cumulativeWeights.map((c, i) => (
            <circle
              key={i}
              cx={cx(i, size.width)}
              cy={cy(c, size.height)}
              r="3"
              fill="hsl(221.2,83.2%,53.3%)"
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SCurveViewProps {
  mainBOQ: any
}

export function SCurveView({ mainBOQ }: SCurveViewProps) {
  // ── 1. Flat item list ─────────────────────────────────────────────────
  const flatItems = useMemo<SCurveItem[]>(() => {
    if (!mainBOQ) return []
    const result: SCurveItem[] = []

    const push = (raw: any, section: string, subsection: string) => {
      const totalPrice = (raw.qty ?? 0) * (raw.price ?? 0)
      const start = raw.startDate ? new Date(raw.startDate) : null
      const end = raw.endDate ? new Date(raw.endDate) : null
      const durationDays =
        start && end
          ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          : 0
      result.push({ name: raw.name, section, subsection, startDate: start, endDate: end, durationDays, totalPrice, weight: 0 })
    }

    if (Array.isArray(mainBOQ.preliminary))
      mainBOQ.preliminary.forEach((item: any) => push(item, "Preliminary", "Preliminary"))
    if (Array.isArray(mainBOQ.fittingOut))
      mainBOQ.fittingOut.forEach((cat: any) =>
        (cat.products || []).forEach((p: any) => push(p, "Fitting Out", cat.name))
      )
    if (Array.isArray(mainBOQ.furnitureWork))
      mainBOQ.furnitureWork.forEach((cat: any) =>
        (cat.products || []).forEach((p: any) => push(p, "Furniture Work", cat.name))
      )
    if (Array.isArray(mainBOQ.mechanicalElectrical))
      mainBOQ.mechanicalElectrical.forEach((cat: any) =>
        (cat.products || []).forEach((p: any) => push(p, "MEP", cat.name))
      )

    const totalBudget = result.reduce((s, i) => s + i.totalPrice, 0)
    if (totalBudget > 0) result.forEach((i) => { i.weight = (i.totalPrice / totalBudget) * 100 })

    return result
  }, [mainBOQ])

  // ── 2. Grouped structure ───────────────────────────────────────────────
  const groups = useMemo<SCurveGroup[]>(() => {
    const sectionMap = new Map<string, Map<string, SCurveItem[]>>()
    flatItems.forEach((item) => {
      if (!sectionMap.has(item.section)) sectionMap.set(item.section, new Map())
      const subMap = sectionMap.get(item.section)!
      if (!subMap.has(item.subsection)) subMap.set(item.subsection, [])
      subMap.get(item.subsection)!.push(item)
    })
    return Array.from(sectionMap.entries()).map(([section, subMap]) => ({
      section,
      subsections: Array.from(subMap.entries()).map(([subsection, items]) => ({ subsection, items })),
    }))
  }, [flatItems])

  // ── 3. Weeks ──────────────────────────────────────────────────────────
  const weeks = useMemo<Week[]>(() => {
    const datedItems = flatItems.filter((i) => i.startDate && i.endDate)
    if (datedItems.length === 0) return []
    const minDate = datedItems.reduce((m, i) => (i.startDate! < m ? i.startDate! : m), datedItems[0].startDate!)
    const maxDate = datedItems.reduce((m, i) => (i.endDate! > m ? i.endDate! : m), datedItems[0].endDate!)
    return generateWeeks(minDate, maxDate)
  }, [flatItems])

  // ── 4. Weight + overlap-days matrices ─────────────────────────────────
  const { weekWeights, weekOverlapDays } = useMemo(() => {
    const weights: number[][] = []
    const days: number[][] = []
    flatItems.forEach((item) => {
      const weightRow: number[] = []
      const daysRow: number[] = []
      if (!item.startDate || !item.endDate || weeks.length === 0) {
        weeks.forEach(() => { weightRow.push(0); daysRow.push(0) })
      } else {
        const totalOverlap = weeks.reduce(
          (s, w) => s + overlapDays(item.startDate!, item.endDate!, w.start, w.end), 0
        )
        weeks.forEach((w) => {
          const d = overlapDays(item.startDate!, item.endDate!, w.start, w.end)
          weightRow.push(totalOverlap === 0 ? 0 : (d / totalOverlap) * item.weight)
          daysRow.push(d)
        })
      }
      weights.push(weightRow)
      days.push(daysRow)
    })
    return { weekWeights: weights, weekOverlapDays: days }
  }, [flatItems, weeks])

  // ── 5. Totals & cumulative ─────────────────────────────────────────────
  const weekTotals = useMemo<number[]>(
    () => weeks.map((_, wi) => flatItems.reduce((s, _, ii) => s + (weekWeights[ii]?.[wi] ?? 0), 0)),
    [flatItems, weeks, weekWeights],
  )

  const cumulativeWeights = useMemo<number[]>(() => {
    let cum = 0
    return weekTotals.map((t) => { cum += t; return cum })
  }, [weekTotals])

  // ── Month groups ──────────────────────────────────────────────────────
  const monthGroups = useMemo(() => {
    const result: { label: string; count: number }[] = []
    weeks.forEach((w) => {
      const ml = monthLabel(w.start)
      const last = result[result.length - 1]
      if (last && last.label === ml) last.count++
      else result.push({ label: ml, count: 1 })
    })
    return result
  }, [weeks])

  // ── State ─────────────────────────────────────────────────────────────
  const [showDays,         setShowDays        ] = useState(true)
  // Overlay: floating SVG above the tbody rows (visual on-screen)
  const [showOverlayCurve, setShowOverlayCurve] = useState(true)
  // Bottom: dedicated tfoot row — always accurate in PDF export
  const [showBottomCurve,  setShowBottomCurve ] = useState(true)
  const [exportingPdf,     setExportingPdf    ] = useState(false)

  // ── Refs for overlay measurement ──────────────────────────────────────
  const tbodyRef        = useRef<HTMLTableSectionElement>(null)
  const firstWeekThRef  = useRef<HTMLTableCellElement>(null)
  const firstItemRowRef = useRef<HTMLTableRowElement>(null)
  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const exportContainerRef = useRef<HTMLDivElement>(null)
  const overlaySvgRef   = useRef<SVGSVGElement>(null)

  const [overlayRect, setOverlayRect] = useState<{
    top: number; left: number; width: number; height: number
  } | null>(null)

  const updateOverlayRect = () => {
    if (!tbodyRef.current || !firstWeekThRef.current || !tableWrapperRef.current || !firstItemRowRef.current) return
    const tableEl           = tbodyRef.current.parentElement as HTMLTableElement
    const thOffsetLeft      = firstWeekThRef.current.offsetLeft
    const tableOffsetLeft   = tableEl.offsetLeft
    const tableOffsetTop    = tableEl.offsetTop
    const tbodyOffsetTop    = tbodyRef.current.offsetTop
    const firstRowOffsetTop = firstItemRowRef.current.offsetTop
    setOverlayRect({
      top:    tableOffsetTop + tbodyOffsetTop + firstRowOffsetTop,
      left:   tableOffsetLeft + thOffsetLeft,
      width:  tableEl.offsetWidth - thOffsetLeft,
      height: tbodyRef.current.offsetHeight - firstRowOffsetTop,
    })
  }

  useEffect(() => {
    updateOverlayRect()
    const ro = new ResizeObserver(updateOverlayRect)
    if (tbodyRef.current)      ro.observe(tbodyRef.current)
    if (tableWrapperRef.current) ro.observe(tableWrapperRef.current)
    return () => ro.disconnect()
  }, [weeks, groups, showOverlayCurve, showBottomCurve])

  // ── PDF Export ────────────────────────────────────────────────────────
  // 1. Hide the overlay SVG (floating absolute — drifts during capture)
  // 2. Force-show the bottom S-Curve row (real DOM child — always accurate)
  // 3. Capture → restore both back to user's chosen state
  const exportSCurvePdf = async () => {
    if (!exportContainerRef.current) return
    setExportingPdf(true)

    const containerEl    = exportContainerRef.current
    const origOverflow   = containerEl.style.overflow
    const origWidth      = containerEl.style.width
    const origScrollLeft = containerEl.scrollLeft

    // Hide overlay SVG for export
    if (overlaySvgRef.current) overlaySvgRef.current.style.visibility = "hidden"
    // Force bottom curve visible (even if user has it off)
    const bottomWasHidden = !showBottomCurve
    if (bottomWasHidden) setShowBottomCurve(true)

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF }   = await import('jspdf')

      const trueContentWidth = containerEl.scrollWidth
      containerEl.scrollLeft = 0
      containerEl.style.overflow = 'visible'
      containerEl.style.width    = `${trueContentWidth}px`

      // Wait for React re-render of bottom curve row + browser paint
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))
      )

      const canvas = await html2canvas(containerEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width:       containerEl.offsetWidth,
        height:      containerEl.offsetHeight,
        windowWidth: containerEl.offsetWidth,
        scrollX: 0,
        scrollY: 0,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      let imgW = pageW - 20
      let imgH = imgW / ratio
      if (imgH > pageH - 20) { imgH = pageH - 20; imgW = imgH * ratio }

      pdf.addImage(imgData, 'PNG', (pageW - imgW) / 2, (pageH - imgH) / 2, imgW, imgH)
      pdf.save('s-curve.pdf')
    } catch (err) {
      console.error('Failed to export S-Curve PDF:', err)
    } finally {
      containerEl.style.overflow  = origOverflow
      containerEl.style.width     = origWidth
      containerEl.scrollLeft      = origScrollLeft
      if (overlaySvgRef.current) overlaySvgRef.current.style.visibility = ""
      if (bottomWasHidden) setShowBottomCurve(false)
      setExportingPdf(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  const FIXED_COLS            = 7
  const BOTTOM_CURVE_HEIGHT   = 240

  if (flatItems.length === 0) {
    return (
      <Alert>
        <AlertDescription>No items found in Main BOQ.</AlertDescription>
      </Alert>
    )
  }

  const hasDates = weeks.length > 0

  let itemNo = 0
  let firstItemRefSet = false
  const itemIndexMap = new Map<SCurveItem, number>()
  flatItems.forEach((item, idx) => itemIndexMap.set(item, idx))

  return (
    <div className="space-y-6">
      {/* ── Controls ─────────────────────────────────────────────────── */}
      {hasDates && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch id="show-overlay" checked={showOverlayCurve} onCheckedChange={setShowOverlayCurve} className="cursor-pointer" />
              <Label htmlFor="show-overlay" className="text-xs cursor-pointer select-none leading-none mb-0">
                Show inline S-Curve
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-bottom" checked={showBottomCurve} onCheckedChange={setShowBottomCurve} className="cursor-pointer" />
              <Label htmlFor="show-bottom" className="text-xs cursor-pointer select-none leading-none mb-0">
                Show S-Curve in table footer
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-days" checked={showDays} onCheckedChange={setShowDays} className="cursor-pointer" />
              <Label htmlFor="show-days" className="text-xs cursor-pointer select-none leading-none mb-0">
                Show active days per week
              </Label>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button variant="outline" size="sm" onClick={exportSCurvePdf} disabled={exportingPdf}>
              {exportingPdf
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting...</>
                : <><FileDown className="h-4 w-4 mr-2" />Export PDF</>
              }
            </Button>
            <p className="text-[10px] text-primary text-right">
              PDF export only supports the S-Curve in the table footer, not the inline overlay.
            </p>
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div ref={exportContainerRef} className="overflow-x-auto rounded-lg border">
        {/* position:relative wrapper — anchor for the overlay SVG */}
        <div ref={tableWrapperRef} className="relative inline-block min-w-full">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              {hasDates ? (
                <>
                  <tr>
                    <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>No</th>
                    <th className="border border-border bg-muted px-2 py-1.5 text-left font-semibold min-w-48" rowSpan={2}>Task / Work Item</th>
                    <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>Start</th>
                    <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>Finish</th>
                    <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>Duration (days)</th>
                    <th className="border border-border bg-muted px-2 py-1.5 text-right font-semibold whitespace-nowrap" rowSpan={2}>Price (IDR)</th>
                    <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>Weight (%)</th>
                    {monthGroups.map((mg) => (
                      <th key={mg.label} colSpan={mg.count}
                        className="border border-border bg-primary/10 px-2 py-1.5 text-center font-semibold text-primary whitespace-nowrap">
                        {mg.label}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {weeks.map((w, wi) => (
                      <th key={w.key}
                        ref={wi === 0 ? firstWeekThRef : undefined}
                        className="border border-border bg-muted/60 px-1 py-1 text-center font-medium whitespace-nowrap min-w-13">
                        {w.label}
                      </th>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold">No</th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-left font-semibold min-w-48">Task / Work Item</th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold">Start</th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold">Finish</th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold">Duration (days)</th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-right font-semibold">Price (IDR)</th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold">Weight (%)</th>
                </tr>
              )}
            </thead>

            <tbody ref={tbodyRef}>
              {groups.map(({ section, subsections }) => {
                const style = getCategoryStyle(section)
                const isFlat = subsections.length === 1 && subsections[0].subsection === section
                return (
                  <>
                    <tr key={`section-${section}`}>
                      <td colSpan={FIXED_COLS + weeks.length}
                        className={`border border-border px-3 py-1 font-bold text-xs uppercase tracking-wide ${style.sectionHeader}`}>
                        {section}
                      </td>
                    </tr>
                    {subsections.map(({ subsection, items }) => (
                      <>
                        {!isFlat && (
                          <tr key={`sub-${section}-${subsection}`}>
                            <td colSpan={FIXED_COLS + weeks.length}
                              className={`border border-border px-5 py-0.5 font-semibold text-[11px] ${style.subsectionHeader}`}>
                              {subsection}
                            </td>
                          </tr>
                        )}
                        {items.map((item) => {
                          itemNo++
                          const idx = itemIndexMap.get(item) ?? 0
                          const isFirst = !firstItemRefSet
                          if (isFirst) firstItemRefSet = true
                          return (
                            <tr key={`item-${section}-${subsection}-${idx}`}
                              ref={isFirst ? firstItemRowRef : undefined}
                              className="hover:bg-muted/30">
                              <td className="border border-border px-2 py-1 text-center text-muted-foreground">{itemNo}</td>
                              <td className="border border-border px-2 py-1 font-medium">{item.name}</td>
                              <td className="border border-border px-2 py-1 text-center whitespace-nowrap">{formatDate(item.startDate)}</td>
                              <td className="border border-border px-2 py-1 text-center whitespace-nowrap">{formatDate(item.endDate)}</td>
                              <td className="border border-border px-2 py-1 text-center">{item.durationDays > 0 ? item.durationDays : "-"}</td>
                              <td className="border border-border px-2 py-1 text-right whitespace-nowrap">{formatNumber(item.totalPrice)}</td>
                              <td className="border border-border px-2 py-1 text-center font-semibold">{item.weight.toFixed(2)}%</td>
                              {weeks.map((_, wi) => {
                                const val  = weekWeights[idx]?.[wi] ?? 0
                                const days = weekOverlapDays[idx]?.[wi] ?? 0
                                return (
                                  <td key={wi} className="border border-border px-1 py-1 text-center">
                                    {val > 0 ? (
                                      <div className="flex flex-col items-center leading-tight">
                                        <span>{val.toFixed(2)}</span>
                                        {showDays && <span className="text-[9px] text-muted-foreground font-normal">{days}d</span>}
                                      </div>
                                    ) : null}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </>
                    ))}
                  </>
                )
              })}
            </tbody>

            {hasDates && (
              <tfoot>
                <tr className="bg-muted/60 font-semibold">
                  <td colSpan={FIXED_COLS} className="border border-border px-2 py-1.5 text-right">
                    Total / Week (%)
                  </td>
                  {weekTotals.map((t, wi) => (
                    <td key={wi} className="border border-border px-1 py-1.5 text-center">{t.toFixed(2)}</td>
                  ))}
                </tr>
                <tr className="bg-primary/10 font-bold text-primary">
                  <td colSpan={FIXED_COLS} className="border border-border px-2 py-1.5 text-right">
                    Cumulative(%)
                  </td>
                  {cumulativeWeights.map((c, wi) => (
                    <td key={wi} className="border border-border px-1 py-1.5 text-center">{c.toFixed(2)}</td>
                  ))}
                </tr>

                {/* ── Bottom S-Curve row ─────────────────────────────────────
                    Toggle: showBottomCurve (also force-shown during PDF export).
                    SVG is a real DOM child → zero offset drift in html2canvas.
                ──────────────────────────────────────────────────────────── */}
                {showBottomCurve && (
                  <tr>
                    <td
                      colSpan={FIXED_COLS}
                      className="border border-border bg-background px-2 text-right text-[hsl(221.2,83.2%,53.3%)] font-bold align-middle"
                      style={{ height: BOTTOM_CURVE_HEIGHT }}
                    >
                      S-Curve
                    </td>
                    <td
                      colSpan={weeks.length}
                      className="border border-border bg-background p-0"
                      style={{ height: BOTTOM_CURVE_HEIGHT, position: "relative" }}
                    >
                      <BottomSCurveSvg cumulativeWeights={cumulativeWeights} weekCount={weeks.length} />
                    </td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>

          {/* ── Overlay S-Curve ──────────────────────────────────────────
              Floating absolute SVG drawn above tbody rows.
              Looks great on screen; hidden during PDF export via ref
              (.style.visibility = "hidden") to prevent offset drift.
          ──────────────────────────────────────────────────────────────── */}
          {showOverlayCurve && overlayRect && weeks.length > 0 && (
            <svg
              ref={overlaySvgRef}
              style={{
                position: "absolute",
                top:    overlayRect.top,
                left:   overlayRect.left,
                width:  overlayRect.width,
                height: overlayRect.height,
                pointerEvents: "none",
                zIndex: 5,
                overflow: "visible",
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="overlay-scurve-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(221.2,83.2%,53.3%)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="hsl(221.2,83.2%,53.3%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={[
                  `M ${(0.5 / weeks.length) * overlayRect.width} ${overlayRect.height}`,
                  ...cumulativeWeights.map(
                    (c, i) => `L ${((i + 0.5) / weeks.length) * overlayRect.width} ${overlayRect.height * (1 - c / 100)}`
                  ),
                  `L ${((weeks.length - 0.5) / weeks.length) * overlayRect.width} ${overlayRect.height}`,
                  "Z",
                ].join(" ")}
                fill="url(#overlay-scurve-grad)"
              />
              <polyline
                points={cumulativeWeights
                  .map((c, i) => `${((i + 0.5) / weeks.length) * overlayRect.width},${overlayRect.height * (1 - c / 100)}`)
                  .join(" ")}
                fill="none"
                stroke="hsl(221.2,83.2%,53.3%)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {cumulativeWeights.map((c, i) => (
                <circle
                  key={i}
                  cx={((i + 0.5) / weeks.length) * overlayRect.width}
                  cy={overlayRect.height * (1 - c / 100)}
                  r="3"
                  fill="hsl(221.2,83.2%,53.3%)"
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          )}
        </div>

        {!hasDates && (
          <p className="text-xs text-muted-foreground p-3">
            * Items have no dates — timeline distribution cannot be displayed. Add startDate &amp; endDate via the Gantt Chart.
          </p>
        )}
      </div>
    </div>
  )
}