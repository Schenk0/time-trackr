"use client"

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Tags,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onOpenTagManager: () => void
  onOpenSchedules: () => void
  onOpenStats: () => void
  onOpenSettings: () => void
}

function shiftDate(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diff = d.getTime() - today.getTime()
  const dayDiff = Math.round(diff / (1000 * 60 * 60 * 24))

  const weekday = d.toLocaleDateString("en-US", { weekday: "short" })
  const monthStr = d.toLocaleDateString("en-US", { month: "short" })

  if (dayDiff === 0) return `Today, ${monthStr} ${day}`
  if (dayDiff === -1) return `Yesterday, ${monthStr} ${day}`
  if (dayDiff === 1) return `Tomorrow, ${monthStr} ${day}`
  return `${weekday}, ${monthStr} ${day}`
}

export function Header({
  selectedDate,
  onDateChange,
  onOpenTagManager,
  onOpenSchedules,
  onOpenStats,
  onOpenSettings,
}: HeaderProps) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const isToday = selectedDate === today

  return (
    <header className="shrink-0 z-10 bg-background border-b">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDateChange(shiftDate(selectedDate, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium min-w-[140px] text-center">
            {formatDisplayDate(selectedDate)}
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDateChange(shiftDate(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button
              variant="outline"
              size="xs"
              className="ml-1 text-xs"
              onClick={() => onDateChange(today)}
            >
              Today
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenTagManager}
            title="Tags"
          >
            <Tags className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenSchedules}
            title="Schedules"
          >
            <CalendarClock className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenStats}
            title="Statistics"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenSettings}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
