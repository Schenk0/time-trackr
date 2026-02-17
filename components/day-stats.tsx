"use client"

type DayStat = {
  name: string
  minutes: number
  color: string
}

interface DayStatsProps {
  stats: DayStat[]
  totalMinutes: number
  loggedMinutes: number
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const SIZE = 220
const STROKE = 28
const RADIUS = (SIZE - STROKE) / 2
const CENTER = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Full circle (no intentional arc cutout)
const ARC_DEGREES = 360

// Rotation so the first segment starts at the top
const START_ROTATION = -90

// Use a fixed visual gap between segments. We convert that into a path gap
// by adding the round cap overshoot on both sides.
const ARC_PX_PER_DEG = CIRCUMFERENCE / 360
const CAP_OVERSHOOT_DEG = (STROKE / 2) / ARC_PX_PER_DEG
const VISIBLE_GAP_DEG = 3
const PATH_GAP_DEG = VISIBLE_GAP_DEG + CAP_OVERSHOOT_DEG * 2

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function DayStats({ stats, totalMinutes, loggedMinutes }: DayStatsProps) {
  const unloggedMinutes = Math.max(totalMinutes - loggedMinutes, 0)
  const total = stats.reduce((sum, s) => sum + s.minutes, 0)

  const segments = stats.map((stat) => ({
    ...stat,
    fraction: total > 0 ? stat.minutes / total : 0,
  }))

  // Lay out segments with a fixed gap between each neighbor (including last-first).
  const arcStart = START_ROTATION
  const arcEnd = START_ROTATION + ARC_DEGREES
  const gapCount = segments.length > 1 ? segments.length : 0
  const maxGapDeg = gapCount > 0 ? ARC_DEGREES / gapCount - 2 : 0
  const gapDeg = gapCount > 0 ? Math.max(0, Math.min(PATH_GAP_DEG, maxGapDeg)) : 0
  const availableDeg = ARC_DEGREES - gapDeg * gapCount

  const rawDegs = segments.map((seg) => seg.fraction * availableDeg)
  const rawTotal = rawDegs.reduce((sum, deg) => sum + deg, 0)
  const segDegs = rawTotal > 0 ? rawDegs.map((deg) => (deg / rawTotal) * availableDeg) : []

  const arcs = segments.reduce<
    Array<typeof segments[number] & { startAngle: number; endAngle: number }>
  >((acc, seg, i) => {
    const cursor = acc.length === 0 ? arcStart : acc[i - 1].endAngle + gapDeg
    const isLast = i === segments.length - 1
    const end = isLast ? arcEnd - gapDeg : cursor + (segDegs[i] ?? 0)
    acc.push({ ...seg, startAngle: cursor, endAngle: end })
    return acc
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Donut chart */}
      <div className="relative">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Colored segments */}
          {arcs.map((arc) =>
            segments.length === 1 ? (
              <circle
                key={arc.name}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
              />
            ) : (
              <path
                key={arc.name}
                d={describeArc(CENTER, CENTER, RADIUS, arc.startAngle, arc.endAngle)}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
            )
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Total Tracked
          </span>
          <span className="text-4xl font-bold leading-none mt-1.5 text-foreground">
            {formatDuration(loggedMinutes)}
          </span>
        </div>
      </div>

      {/* Legend */}
      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No tracked time yet for this day.</p>
      ) : (
        <div className="w-full max-w-[260px] flex flex-col gap-3">
          {stats.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-foreground flex-1 truncate">{item.name}</span>
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {formatDuration(item.minutes)}
              </span>
            </div>
          ))}

          {unloggedMinutes > 0 && (
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full shrink-0 bg-muted" />
              <span className="text-sm text-muted-foreground flex-1">Unlogged</span>
              <span className="text-sm font-medium text-muted-foreground/70 tabular-nums">
                {formatDuration(unloggedMinutes)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
