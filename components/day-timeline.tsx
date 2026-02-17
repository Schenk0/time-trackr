"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TimeSlot } from "@/components/time-slot"
import { TagPicker } from "@/components/tag-picker"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import type { Tag, TimeEntry } from "@/lib/types"

interface DayTimelineProps {
  totalSlots: number
  interval: 15 | 30
  clockFormat: 12 | 24
  entries: TimeEntry[]
  tags: Tag[]
  currentSlot: number
  isToday: boolean
  onSetEntry: (slot: number, tagId: string | null) => void
  onSetEntries: (slots: number[], tagId: string | null) => void
}

function buildRange(from: number, to: number) {
  const start = Math.min(from, to)
  const end = Math.max(from, to)
  const range: number[] = []
  for (let slot = start; slot <= end; slot++) {
    range.push(slot)
  }
  return range
}

type TimeSlotRowProps = {
  slot: number
  interval: 15 | 30
  clockFormat: 12 | 24
  tags: Tag[]
  tag: Tag | undefined
  isCurrentSlot: boolean
  isSelected: boolean
  onSelectTag: (slot: number, tagId: string | null) => void
  onModifierClick: (
    slot: number,
    modifiers: { ctrlOrMeta: boolean; shift: boolean }
  ) => void
  onPlainClick: (slot: number) => void
}

const TimeSlotRow = memo(function TimeSlotRow({
  slot,
  interval,
  clockFormat,
  tags,
  tag,
  isCurrentSlot,
  isSelected,
  onSelectTag,
  onModifierClick,
  onPlainClick,
}: TimeSlotRowProps) {
  return (
    <TagPicker
      tags={tags}
      currentTagId={tag?.id ?? null}
      onSelect={(nextTagId) => onSelectTag(slot, nextTagId)}
      selectionCount={1}
    >
      <TimeSlot
        slot={slot}
        interval={interval}
        clockFormat={clockFormat}
        tag={tag}
        isCurrentSlot={isCurrentSlot}
        isSelected={isSelected}
        onModifierClick={onModifierClick}
        onPlainClick={onPlainClick}
      />
    </TagPicker>
  )
})

TimeSlotRow.displayName = "TimeSlotRow"

export function DayTimeline({
  totalSlots,
  interval,
  clockFormat,
  entries,
  tags,
  currentSlot,
  isToday,
  onSetEntry,
  onSetEntries,
}: DayTimelineProps) {
  const currentSlotRef = useRef<HTMLDivElement>(null)
  const scrollHostRef = useRef<HTMLDivElement>(null)
  const hasAutoScrolledRef = useRef(false)
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [isBatchSelecting, setIsBatchSelecting] = useState(false)
  const [pickerAnchorSlot, setPickerAnchorSlot] = useState<number | null>(null)
  const [showScrollToNow, setShowScrollToNow] = useState(false)

  useEffect(() => {
    if (!isToday || hasAutoScrolledRef.current || !currentSlotRef.current) return
    hasAutoScrolledRef.current = true
    currentSlotRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }, [isToday])

  useEffect(() => {
    if (!isToday) return
    const viewport = scrollHostRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )
    const target = currentSlotRef.current
    if (!viewport || !target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollToNow(!entry.isIntersecting)
      },
      { root: viewport, threshold: 0.7 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [isToday, currentSlot])

  const entryMap = useMemo(
    () => new Map(entries.map((entry) => [entry.slot, entry.tagId])),
    [entries]
  )
  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])
  const slots = useMemo(
    () => Array.from({ length: totalSlots }, (_, i) => i),
    [totalSlots]
  )

  const showBatchPicker =
    isBatchSelecting && selectedSlots.length > 0 && pickerAnchorSlot !== null
  const selectedSlotSet = useMemo(
    () => new Set(selectedSlots),
    [selectedSlots]
  )
  const selectedTagIds = useMemo(() => {
    const ids = new Set<string>()
    for (const slot of selectedSlots) {
      const tagId = entryMap.get(slot)
      if (tagId) ids.add(tagId)
    }
    return ids
  }, [selectedSlots, entryMap])
  const multiSelectionTagId = useMemo(() => {
    if (selectedTagIds.size !== 1) return null
    return selectedTagIds.values().next().value ?? null
  }, [selectedTagIds])

  const clearSelection = useCallback(() => {
    setSelectedSlots((prev) => (prev.length === 0 ? prev : []))
    setIsBatchSelecting((prev) => (prev ? false : prev))
    setPickerAnchorSlot((prev) => (prev === null ? prev : null))
  }, [])

  const handleModifierClick = useCallback(
    (
      slot: number,
      modifiers: { ctrlOrMeta: boolean; shift: boolean }
    ) => {
      if (modifiers.shift) {
        setSelectedSlots((prev) => {
          if (prev.length === 0) {
            setPickerAnchorSlot(slot)
            return [slot]
          }
          const start = Math.min(slot, ...prev)
          const end = Math.max(slot, ...prev)
          setPickerAnchorSlot(end)
          return buildRange(start, end)
        })
        setIsBatchSelecting(true)
        return
      }

      if (modifiers.ctrlOrMeta) {
        setSelectedSlots((prev) => {
          if (prev.includes(slot)) return prev
          const next = [...prev, slot].sort((a, b) => a - b)
          setPickerAnchorSlot(Math.max(...next))
          return next
        })
        setIsBatchSelecting(true)
      }
    },
    []
  )

  const handlePlainSlotClick = useCallback((slot: number) => {
    setSelectedSlots([slot])
  }, [setSelectedSlots])

  const scrollToCurrent = useCallback(() => {
    if (!currentSlotRef.current) return
    currentSlotRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }, [])

  const handleSingleSelectTag = useCallback(
    (slot: number, tagId: string | null) => {
      onSetEntry(slot, tagId)
    },
    [onSetEntry]
  )

  const handleMultiSelectTag = useCallback(
    (tagId: string | null) => {
      if (selectedSlots.length === 0) return
      onSetEntries(selectedSlots, tagId)
      clearSelection()
    },
    [clearSelection, onSetEntries, selectedSlots]
  )

  useEffect(() => {
    if (!showBatchPicker) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (event.ctrlKey || event.metaKey || event.shiftKey) return
      if (target.closest('[data-slot="popover-content"]')) return
      clearSelection()
    }

    window.addEventListener("pointerdown", handlePointerDown, true)
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [showBatchPicker, clearSelection])

  return (
    <div ref={scrollHostRef} className="relative flex-1 min-h-0">
      {isToday && showScrollToNow && (
        <div className="pointer-events-none absolute top-2 left-0 right-0 z-20 flex justify-center">
          <Button
            size="xs"
            variant="secondary"
            className="pointer-events-auto rounded-full shadow-md"
            onClick={scrollToCurrent}
          >
            <ArrowDown className="h-3 w-3" />
            Current time
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0 h-full">
        <div className="max-w-lg mx-auto px-4 py-3 flex flex-col gap-0.5">
          {slots.map((slot) => {
            const tagId = entryMap.get(slot)
            const tag = tagId ? tagMap.get(tagId) : undefined
            const isCurrent = isToday && slot === currentSlot
            const isSelected = selectedSlotSet.has(slot)

            return (
              <div
                key={slot}
                ref={isCurrent ? currentSlotRef : undefined}
                data-slot={slot}
              >
                <TimeSlotRow
                  slot={slot}
                  interval={interval}
                  clockFormat={clockFormat}
                  tags={tags}
                  tag={tag}
                  isCurrentSlot={isCurrent}
                  isSelected={isSelected}
                  onSelectTag={handleSingleSelectTag}
                  onModifierClick={handleModifierClick}
                  onPlainClick={handlePlainSlotClick}
                />

                {showBatchPicker && pickerAnchorSlot === slot && (
                  <div className="">
                    <TagPicker
                      tags={tags}
                      currentTagId={multiSelectionTagId}
                      onSelect={handleMultiSelectTag}
                      selectionCount={selectedSlots.length}
                      open
                    >
                      <div className="h-0 w-full" aria-hidden />
                    </TagPicker>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
