"use client"

import { useMemo, useState, useCallback, useSyncExternalStore } from "react"
import type { Tag, TimeEntry, Settings, DailySchedule } from "./types"
import { STORAGE_KEYS, DEFAULT_TAGS } from "./constants"

const CLEAR_OVERRIDE_TAG_ID = "__tt_clear__"

function toLocalDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function parseDateStr(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getWeekday(dateStr: string) {
  return parseDateStr(dateStr).getDay()
}

function isDateOnOrAfter(dateStr: string, baseline: string) {
  return dateStr >= baseline
}

function getStorageValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : fallback
  } catch {
    return fallback
  }
}

function setStorageValue<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new StorageEvent("storage", { key }))
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function normalizeSchedule(schedule: Partial<DailySchedule>): DailySchedule {
  return {
    id: schedule.id ?? `schedule-${Date.now()}-${Math.random()}`,
    tagId: schedule.tagId ?? "",
    startMinute: schedule.startMinute ?? 0,
    endMinute: schedule.endMinute ?? 0,
    weekdays:
      Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0
        ? schedule.weekdays
        : [0, 1, 2, 3, 4, 5, 6],
    startsOn: schedule.startsOn ?? toLocalDateStr(new Date()),
  }
}

function slotOverlapsRange(
  slotStart: number,
  slotEnd: number,
  rangeStart: number,
  rangeEnd: number
) {
  return slotStart < rangeEnd && slotEnd > rangeStart
}

function isSlotCoveredBySchedule(
  slot: number,
  interval: 15 | 30,
  schedule: DailySchedule
) {
  const slotStart = slot * interval
  const slotEnd = slotStart + interval
  const { startMinute, endMinute } = schedule

  // Same start/end means full-day recurrence.
  if (startMinute === endMinute) return true

  if (startMinute < endMinute) {
    return slotOverlapsRange(slotStart, slotEnd, startMinute, endMinute)
  }

  // Overnight range (e.g. 22:00 -> 06:00)
  return (
    slotOverlapsRange(slotStart, slotEnd, startMinute, 1440) ||
    slotOverlapsRange(slotStart, slotEnd, 0, endMinute)
  )
}

function isScheduleActiveOnDate(schedule: DailySchedule, dateStr: string) {
  if (!isDateOnOrAfter(dateStr, schedule.startsOn)) return false
  return schedule.weekdays.includes(getWeekday(dateStr))
}

function resolveScheduledTagForSlot(
  dateStr: string,
  slot: number,
  interval: 15 | 30,
  schedules: DailySchedule[]
) {
  let tagId: string | null = null
  for (const schedule of schedules) {
    if (!isScheduleActiveOnDate(schedule, dateStr)) continue
    if (isSlotCoveredBySchedule(slot, interval, schedule)) {
      tagId = schedule.tagId
    }
  }
  return tagId
}

function resolveEffectiveTagForSlot(
  dateStr: string,
  slot: number,
  interval: 15 | 30,
  schedules: DailySchedule[],
  manualEntriesBySlot?: Map<number, string>
) {
  const manualTagId = manualEntriesBySlot?.get(slot)
  if (manualTagId !== undefined) {
    if (manualTagId === CLEAR_OVERRIDE_TAG_ID) return null
    return manualTagId
  }

  return resolveScheduledTagForSlot(dateStr, slot, interval, schedules)
}

function buildEntriesForDate(
  dateStr: string,
  totalSlots: number,
  interval: 15 | 30,
  schedules: DailySchedule[],
  manualEntriesBySlot?: Map<number, string>
) {
  const result: TimeEntry[] = []
  for (let slot = 0; slot < totalSlots; slot++) {
    const tagId = resolveEffectiveTagForSlot(
      dateStr,
      slot,
      interval,
      schedules,
      manualEntriesBySlot
    )
    if (!tagId) continue
    result.push({ date: dateStr, slot, tagId })
  }
  return result
}

function buildEntriesByDate(entries: TimeEntry[]) {
  const map = new Map<string, Map<number, string>>()
  for (const entry of entries) {
    let dateMap = map.get(entry.date)
    if (!dateMap) {
      dateMap = new Map()
      map.set(entry.date, dateMap)
    }
    dateMap.set(entry.slot, entry.tagId)
  }
  return map
}

function useLocalStorage<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const item = window.localStorage.getItem(key)
        return item ?? JSON.stringify(fallback)
      } catch {
        return JSON.stringify(fallback)
      }
    },
    () => JSON.stringify(fallback)
  )

  const parsed = JSON.parse(value) as T

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const newValue =
        typeof next === "function"
          ? (next as (prev: T) => T)(getStorageValue(key, fallback))
          : next
      setStorageValue(key, newValue)
    },
    [key, fallback]
  )

  return [parsed, setValue] as const
}

export function useTimeTracker() {
  const [tags, setTags] = useLocalStorage<Tag[]>(
    STORAGE_KEYS.tags,
    DEFAULT_TAGS
  )
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>(
    STORAGE_KEYS.entries,
    []
  )
  const [settings, setSettings] = useLocalStorage<Settings>(
    STORAGE_KEYS.settings,
    { interval: 30, clockFormat: 24, notificationMode: "browser" }
  )
  const [rawSchedules, setRawSchedules] = useLocalStorage<DailySchedule[]>(
    STORAGE_KEYS.schedules,
    []
  )
  const schedules = useMemo(
    () => rawSchedules.map(normalizeSchedule),
    [rawSchedules]
  )

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()))

  const totalSlots = (24 * 60) / settings.interval
  const entriesByDate = useMemo(() => buildEntriesByDate(entries), [entries])
  const entriesForDate = useMemo(
    () =>
      buildEntriesForDate(
        selectedDate,
        totalSlots,
        settings.interval,
        schedules,
        entriesByDate.get(selectedDate)
      ),
    [selectedDate, totalSlots, settings.interval, schedules, entriesByDate]
  )

  const setEntry = useCallback(
    (slot: number, tagId: string | null) => {
      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.date === selectedDate && e.slot === slot)
        )

        if (tagId === null) {
          const hasScheduleDefault = Boolean(
            resolveScheduledTagForSlot(
              selectedDate,
              slot,
              settings.interval,
              schedules
            )
          )
          if (!hasScheduleDefault) return filtered
          return [
            ...filtered,
            { date: selectedDate, slot, tagId: CLEAR_OVERRIDE_TAG_ID },
          ]
        }

        return [...filtered, { date: selectedDate, slot, tagId }]
      })
    },
    [selectedDate, setEntries, settings.interval, schedules]
  )

  const setEntriesForSlots = useCallback(
    (slots: number[], tagId: string | null) => {
      const uniqueSlots = Array.from(new Set(slots))
      if (uniqueSlots.length === 0) return

      setEntries((prev) => {
        const slotSet = new Set(uniqueSlots)
        const filtered = prev.filter(
          (e) => !(e.date === selectedDate && slotSet.has(e.slot))
        )

        if (tagId === null) {
          const overrides: TimeEntry[] = []
          for (const slot of slotSet) {
            const hasScheduleDefault = Boolean(
              resolveScheduledTagForSlot(
                selectedDate,
                slot,
                settings.interval,
                schedules
              )
            )
            if (hasScheduleDefault) {
              overrides.push({
                date: selectedDate,
                slot,
                tagId: CLEAR_OVERRIDE_TAG_ID,
              })
            }
          }
          return overrides.length === 0 ? filtered : [...filtered, ...overrides]
        }

        return [
          ...filtered,
          ...uniqueSlots.map((slot) => ({ date: selectedDate, slot, tagId })),
        ]
      })
    },
    [selectedDate, setEntries, settings.interval, schedules]
  )

  const addTag = useCallback(
    (tag: Tag) => {
      setTags((prev) => [...prev, tag])
    },
    [setTags]
  )

  const updateTag = useCallback(
    (id: string, updates: Partial<Omit<Tag, "id">>) => {
      setTags((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
    },
    [setTags]
  )

  const deleteTag = useCallback(
    (id: string) => {
      setTags((prev) => prev.filter((t) => t.id !== id))
      setEntries((prev) => prev.filter((e) => e.tagId !== id))
      setRawSchedules((prev) => prev.filter((s) => s.tagId !== id))
    },
    [setTags, setEntries, setRawSchedules]
  )

  const updateSettings = useCallback(
    (updates: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
    },
    [setSettings]
  )

  const addSchedule = useCallback(
    (schedule: DailySchedule) => {
      setRawSchedules((prev) => [...prev, normalizeSchedule(schedule)])
    },
    [setRawSchedules]
  )

  const updateSchedule = useCallback(
    (id: string, updates: Partial<Omit<DailySchedule, "id">>) => {
      setRawSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === id
            ? normalizeSchedule({ ...schedule, ...updates, id: schedule.id })
            : normalizeSchedule(schedule)
        )
      )
    },
    [setRawSchedules]
  )

  const deleteSchedule = useCallback(
    (id: string) => {
      setRawSchedules((prev) => prev.filter((s) => s.id !== id))
    },
    [setRawSchedules]
  )

  const getCurrentSlot = useCallback(() => {
    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()
    return Math.floor(minutes / settings.interval)
  }, [settings.interval])

  const isPreviousSlotLogged = useCallback(() => {
    const today = toLocalDateStr(new Date())
    const currentSlot = getCurrentSlot()
    if (currentSlot === 0) return true
    const prevSlot = currentSlot - 1
    const tagId = resolveEffectiveTagForSlot(
      today,
      prevSlot,
      settings.interval,
      schedules,
      entriesByDate.get(today)
    )
    return Boolean(tagId)
  }, [entriesByDate, getCurrentSlot, schedules, settings.interval])

  return {
    tags,
    entries,
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
  }
}

export function formatSlotTime(
  slot: number,
  interval: 15 | 30,
  clockFormat: 12 | 24 = 24
) {
  const totalMinutes = (slot + 0) * interval
  const hours24 = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const mm = minutes.toString().padStart(2, "0")

  if (clockFormat === 12) {
    const period = hours24 >= 12 ? "PM" : "AM"
    const hours12 = hours24 % 12 || 12
    return `${hours12}:${mm} ${period}`
  }

  return `${hours24.toString().padStart(2, "0")}:${mm}`
}

export function formatSlotRange(
  slot: number,
  interval: 15 | 30,
  clockFormat: 12 | 24 = 24
) {
  const start = formatSlotTime(slot, interval, clockFormat)
  const end = formatSlotTime(slot + 1, interval, clockFormat)
  return `${start}-${end}`
}

export function formatMinuteTime(minute: number, clockFormat: 12 | 24 = 24) {
  if (minute === 1440) {
    return clockFormat === 24 ? "24:00" : "12:00 AM"
  }

  const clamped = Math.max(0, Math.min(1439, minute))
  const slot = Math.floor(clamped / 15)
  return formatSlotTime(slot, 15, clockFormat)
}
