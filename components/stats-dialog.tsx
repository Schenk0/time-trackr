"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DayStats } from "@/components/day-stats"

type DayStat = {
  name: string
  minutes: number
  color: string
}

interface StatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateLabel: string
  stats: DayStat[]
  loggedMinutes: number
  totalMinutes: number
}

export function StatsDialog({
  open,
  onOpenChange,
  dateLabel,
  stats,
  loggedMinutes,
  totalMinutes,
}: StatsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statistics - {dateLabel}</DialogTitle>
        </DialogHeader>
        <DayStats
          stats={stats}
          loggedMinutes={loggedMinutes}
          totalMinutes={totalMinutes}
        />
      </DialogContent>
    </Dialog>
  )
}
