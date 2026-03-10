"use client"

import { useMemo, useState } from "react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SCurveItem {
  name: string
  /** main section, e.g. "Preliminary", "Fitting Out", "Furniture Work", "MEP" */
  section: string
  /** sub-section / category name within the section */
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

// ─── Category colour palette (mirrors gantt-chart-view) ───────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface SCurveViewProps {
  mainBOQ: any
}

export function SCurveView({ mainBOQ }: SCurveViewProps) {
  // ── 1. Build flat item list ────────────────────────────────────────────
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

    if (Array.isArray(mainBOQ.preliminary)) {
      mainBOQ.preliminary.forEach((item: any) => push(item, "Preliminary", "Preliminary"))
    }
    if (Array.isArray(mainBOQ.fittingOut)) {
      mainBOQ.fittingOut.forEach((cat: any) => {
        ;(cat.products || []).forEach((p: any) => push(p, "Fitting Out", cat.name))
      })
    }
    if (Array.isArray(mainBOQ.furnitureWork)) {
      mainBOQ.furnitureWork.forEach((cat: any) => {
        ;(cat.products || []).forEach((p: any) => push(p, "Furniture Work", cat.name))
      })
    }
    if (Array.isArray(mainBOQ.mechanicalElectrical)) {
      mainBOQ.mechanicalElectrical.forEach((cat: any) => {
        ;(cat.products || []).forEach((p: any) => push(p, "MEP", cat.name))
      })
    }

    // Assign weights
    const totalBudget = result.reduce((s, i) => s + i.totalPrice, 0)
    if (totalBudget > 0) {
      result.forEach((i) => { i.weight = (i.totalPrice / totalBudget) * 100 })
    }

    return result
  }, [mainBOQ])

  // ── 2. Grouped structure for table rendering ───────────────────────────
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

  // ── 3. Generate weeks ─────────────────────────────────────────────────
  const weeks = useMemo<Week[]>(() => {
    const datedItems = flatItems.filter((i) => i.startDate && i.endDate)
    if (datedItems.length === 0) return []
    const minDate = datedItems.reduce((m, i) => (i.startDate! < m ? i.startDate! : m), datedItems[0].startDate!)
    const maxDate = datedItems.reduce((m, i) => (i.endDate! > m ? i.endDate! : m), datedItems[0].endDate!)
    return generateWeeks(minDate, maxDate)
  }, [flatItems])

  // ── 4. Weight per week matrix + overlap-days matrix ──────────────────
  const { weekWeights, weekOverlapDays } = useMemo<{
    weekWeights: number[][]
    weekOverlapDays: number[][]
  }>(() => {
    const weights: number[][] = []
    const days: number[][] = []
    flatItems.forEach((item) => {
      const weightRow: number[] = []
      const daysRow: number[] = []
      if (!item.startDate || !item.endDate || weeks.length === 0) {
        weeks.forEach(() => { weightRow.push(0); daysRow.push(0) })
      } else {
        const totalOverlap = weeks.reduce((s, w) => s + overlapDays(item.startDate!, item.endDate!, w.start, w.end), 0)
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

  // ── 5. Column totals & cumulative ─────────────────────────────────────
  const weekTotals = useMemo<number[]>(
    () => weeks.map((_, wi) => flatItems.reduce((s, _, ii) => s + (weekWeights[ii]?.[wi] ?? 0), 0)),
    [flatItems, weeks, weekWeights],
  )

  const cumulativeWeights = useMemo<number[]>(() => {
    let cum = 0
    return weekTotals.map((t) => { cum += t; return cum })
  }, [weekTotals])

  // ── 6. Chart data ─────────────────────────────────────────────────────
  const chartData = useMemo(
    () =>
      weeks.map((w, i) => ({
        week: w.label,
        planned: parseFloat(cumulativeWeights[i].toFixed(2)),
        weekly: parseFloat(weekTotals[i].toFixed(2)),
      })),
    [weeks, cumulativeWeights, weekTotals],
  )

  // ── Month groups for merged header ────────────────────────────────────
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

  // State
  const [showDays, setShowDays] = useState(false)
  const [showInlineCurve, setShowInlineCurve] = useState(false)

  // Fixed column count (No | Task | Start | Finish | Duration | Price | Weight)
  const FIXED_COLS = 7

  // ── No data ───────────────────────────────────────────────────────────
  if (flatItems.length === 0) {
    return (
      <Alert>
        <AlertDescription>No items found in Main BOQ.</AlertDescription>
      </Alert>
    )
  }

  const hasDates = weeks.length > 0

  // Running item counter (mutated during render — intentional for sequential numbering)
  let itemNo = 0
  // Map each item to its index in flatItems for weekWeights lookup
  const itemIndexMap = new Map<SCurveItem, number>()
  flatItems.forEach((item, idx) => itemIndexMap.set(item, idx))

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          CHART — full width on top
      ════════════════════════════════════════════════════════════════ */}
      {hasDates && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold mb-0.5">S-Curve – Planned</h3>
          <p className="text-xs text-muted-foreground mb-4">Cumulative planned weight per week (%)</p>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 64 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={72}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10 }}
                width={44}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) =>
                  [
                    value != null ? `${Number(value).toFixed(2)}%` : "-",
                    name === "planned" ? "Cumulative" : "Weekly",
                  ] as any
                }
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Legend
                formatter={(value) => (value === "planned" ? "Cumulative S-Curve" : "Weekly Weight")}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Area
                type="monotone"
                dataKey="weekly"
                fill="hsl(var(--primary) / 0.12)"
                stroke="hsl(var(--primary) / 0.35)"
                strokeWidth={1}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))", stroke: "#fff", strokeWidth: 1.5 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "#fff" }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TABLE — full width below chart
      ════════════════════════════════════════════════════════════════ */}
      {hasDates && (
        <div className="flex items-center justify-end gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch id="show-inline-curve" checked={showInlineCurve} onCheckedChange={setShowInlineCurve} className="cursor-pointer" />
            <Label htmlFor="show-inline-curve" className="text-xs cursor-pointer select-none leading-none mb-0">
              Show inline S-Curve
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-days" checked={showDays} onCheckedChange={setShowDays} className="cursor-pointer" />
            <Label htmlFor="show-days" className="text-xs cursor-pointer select-none leading-none mb-0">
              Show active days per week
            </Label>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            {hasDates ? (
              <>
                {/* Row 1: fixed-col labels (rowSpan 2) + month groups */}
                <tr>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>
                    No
                  </th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-left font-semibold min-w-48" rowSpan={2}>
                    Task / Work Item
                  </th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>
                    Start
                  </th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>
                    Finish
                  </th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>
                    Duration (days)
                  </th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-right font-semibold whitespace-nowrap" rowSpan={2}>
                    Price (IDR)
                  </th>
                  <th className="border border-border bg-muted px-2 py-1.5 text-center font-semibold whitespace-nowrap" rowSpan={2}>
                    Weight (%)
                  </th>
                  {monthGroups.map((mg) => (
                    <th
                      key={mg.label}
                      colSpan={mg.count}
                      className="border border-border bg-primary/10 px-2 py-1.5 text-center font-semibold text-primary whitespace-nowrap"
                    >
                      {mg.label}
                    </th>
                  ))}
                </tr>
                {/* Row 2: week labels */}
                <tr>
                  {weeks.map((w) => (
                    <th
                      key={w.key}
                      className="border border-border bg-muted/60 px-1 py-1 text-center font-medium whitespace-nowrap min-w-13"
                    >
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

          <tbody>
            {groups.map(({ section, subsections }) => {
              const style = getCategoryStyle(section)
              // If only one subsection and name matches section (Preliminary), skip sub-header
              const isFlat = subsections.length === 1 && subsections[0].subsection === section

              return (
                <>
                  {/* Section header row */}
                  <tr key={`section-${section}`}>
                    <td
                      colSpan={FIXED_COLS + weeks.length}
                      className={`border border-border px-3 py-1 font-bold text-xs uppercase tracking-wide ${style.sectionHeader}`}
                    >
                      {section}
                    </td>
                  </tr>

                  {subsections.map(({ subsection, items }) => (
                    <>
                      {/* Subsection header row */}
                      {!isFlat && (
                        <tr key={`sub-${section}-${subsection}`}>
                          <td
                            colSpan={FIXED_COLS + weeks.length}
                            className={`border border-border px-5 py-0.5 font-semibold text-[11px] ${style.subsectionHeader}`}
                          >
                            {subsection}
                          </td>
                        </tr>
                      )}

                      {/* Item rows */}
                      {items.map((item) => {
                        itemNo++
                        const idx = itemIndexMap.get(item) ?? 0
                        return (
                          <tr key={`item-${section}-${subsection}-${idx}`} className="hover:bg-muted/30">
                            <td className="border border-border px-2 py-1 text-center text-muted-foreground">
                              {itemNo}
                            </td>
                            <td className="border border-border px-2 py-1 font-medium">{item.name}</td>
                            <td className="border border-border px-2 py-1 text-center whitespace-nowrap">
                              {formatDate(item.startDate)}
                            </td>
                            <td className="border border-border px-2 py-1 text-center whitespace-nowrap">
                              {formatDate(item.endDate)}
                            </td>
                            <td className="border border-border px-2 py-1 text-center">
                              {item.durationDays > 0 ? item.durationDays : "-"}
                            </td>
                            <td className="border border-border px-2 py-1 text-right whitespace-nowrap">
                              {formatNumber(item.totalPrice)}
                            </td>
                            <td className="border border-border px-2 py-1 text-center font-semibold">
                              {item.weight.toFixed(2)}%
                            </td>
                            {weeks.map((_, wi) => {
                              const val = weekWeights[idx]?.[wi] ?? 0
                              const days = weekOverlapDays[idx]?.[wi] ?? 0
                              return (
                                <td key={wi} className="border border-border px-1 py-1 text-center">
                                  {val > 0 ? (
                                    <div className="flex flex-col items-center leading-tight">
                                      <span>{val.toFixed(2)}</span>
                                      {showDays && (
                                        <span className="text-[9px] text-muted-foreground font-normal">{days}d</span>
                                      )}
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
                  <td key={wi} className="border border-border px-1 py-1.5 text-center">
                    {t.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="bg-primary/10 font-bold text-primary">
                <td colSpan={FIXED_COLS} className="border border-border px-2 py-1.5 text-right">
                  Cumulative / S-Curve (%)
                </td>
                {cumulativeWeights.map((c, wi) => (
                  <td key={wi} className="border border-border px-1 py-1.5 text-center">
                    {c.toFixed(2)}
                  </td>
                ))}
              </tr>
              {/* S-Curve visual row — inline SVG spanning all week columns */}
              {showInlineCurve && (
              <tr>
                <td
                  colSpan={FIXED_COLS}
                  className="border border-border px-2 py-1 text-right text-[10px] font-semibold text-primary"
                >
                  S-Curve
                </td>
                <td colSpan={weeks.length} className="border border-border p-0">
                  <svg
                    width="100%"
                    height="60"
                    viewBox={`0 0 ${weeks.length * 52} 60`}
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="scurve-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(221.2,83.2%,53.3%)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="hsl(221.2,83.2%,53.3%)" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {/* Area fill below the curve */}
                    <path
                      d={[
                        `M ${0.5 * 52} 58`,
                        ...cumulativeWeights.map(
                          (c, i) => `L ${(i + 0.5) * 52} ${((100 - c) / 100) * 54 + 3}`,
                        ),
                        `L ${(weeks.length - 0.5) * 52} 58`,
                        "Z",
                      ].join(" ")}
                      fill="url(#scurve-area-grad)"
                    />
                    {/* Connecting line */}
                    <polyline
                      points={cumulativeWeights
                        .map((c, i) => `${(i + 0.5) * 52},${((100 - c) / 100) * 54 + 3}`)
                        .join(" ")}
                      fill="none"
                      stroke="hsl(221.2,83.2%,53.3%)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Dots at each week */}
                    {cumulativeWeights.map((c, i) => (
                      <circle
                        key={i}
                        cx={(i + 0.5) * 52}
                        cy={((100 - c) / 100) * 54 + 3}
                        r="3.5"
                        fill="hsl(221.2,83.2%,53.3%)"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                </td>
              </tr>
              )}
            </tfoot>
          )}
        </table>

        {!hasDates && (
          <p className="text-xs text-muted-foreground p-3">
            * Items have no dates — timeline distribution cannot be displayed. Add startDate &amp; endDate via the Gantt Chart.
          </p>
        )}
      </div>
    </div>
  )
}
