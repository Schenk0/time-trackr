"use client"

import { useMemo, useState, useEffect } from "react"
import { Header } from "@/components/header"
import { DayTimeline } from "@/components/day-timeline"
import { TagManager } from "@/components/tag-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { SchedulesDialog } from "@/components/schedules-dialog"
import { StatsDialog } from "@/components/stats-dialog"
import { useTimeTracker } from "@/lib/hooks"
import { startNotificationLoop } from "@/lib/notifications"

export default function Page() {
  const {
    tags,
    entriesForDate,
    schedules,
    settings,
    selectedDate,
    totalSlots,
    setSelectedDate,
    setEntry,
    setEntriesForSlots,
    addTag,
    updateTag,
    deleteTag,
    updateSettings,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getCurrentSlot,
    isPreviousSlotLogged,
  } = useTimeTracker()

  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [schedulesOpen, setSchedulesOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [, setTick] = useState(0)

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const isToday = selectedDate === today
  const currentSlot = getCurrentSlot()
  const { stats, loggedMinutes } = useMemo(() => {
    const minutesByTag = new Map<string, number>()
    for (const entry of entriesForDate) {
      minutesByTag.set(
        entry.tagId,
        (minutesByTag.get(entry.tagId) ?? 0) + settings.interval
      )
    }
    const tagById = new Map(tags.map((tag) => [tag.id, tag]))
    const stats = Array.from(minutesByTag.entries())
      .map(([tagId, minutes]) => {
        const tag = tagById.get(tagId)
        return {
          name: tag?.name ?? "Unknown",
          minutes,
          color: tag?.color ?? "#888888",
        }
      })
      .sort((a, b) => b.minutes - a.minutes)
    const loggedMinutes = stats.reduce((sum, item) => sum + item.minutes, 0)
    return { stats, loggedMinutes }
  }, [entriesForDate, settings.interval, tags])

  // Trigger re-render every 30s for current slot updates
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Start notification loop based on mode
  useEffect(() => {
    const cleanup = startNotificationLoop(
      isPreviousSlotLogged,
      settings.notificationMode,
      settings.interval
    )
    return cleanup
  }, [isPreviousSlotLogged, settings.notificationMode, settings.interval])

  return (
    <div className="h-dvh flex flex-col min-h-0 overflow-hidden">
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenTagManager={() => setTagManagerOpen(true)}
        onOpenSchedules={() => setSchedulesOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <DayTimeline
        key={`${selectedDate}-${settings.interval}`}
        totalSlots={totalSlots}
        interval={settings.interval}
        clockFormat={settings.clockFormat}
        entries={entriesForDate}
        tags={tags}
        currentSlot={currentSlot}
        isToday={isToday}
        onSetEntry={setEntry}
        onSetEntries={setEntriesForSlots}
      />

      <TagManager
        open={tagManagerOpen}
        onOpenChange={setTagManagerOpen}
        tags={tags}
        onAdd={addTag}
        onUpdate={updateTag}
        onDelete={deleteTag}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdate={updateSettings}
      />

      <SchedulesDialog
        open={schedulesOpen}
        onOpenChange={setSchedulesOpen}
        tags={tags}
        schedules={schedules}
        interval={settings.interval}
        clockFormat={settings.clockFormat}
        onAddSchedule={addSchedule}
        onUpdateSchedule={updateSchedule}
        onDeleteSchedule={deleteSchedule}
      />

      <StatsDialog
        open={statsOpen}
        onOpenChange={setStatsOpen}
        dateLabel={selectedDate}
        stats={stats}
        loggedMinutes={loggedMinutes}
        totalMinutes={24 * 60}
      />
    </div>
  )
}
