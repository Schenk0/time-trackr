"use client"

import { forwardRef, memo } from "react"
import { formatSlotTime } from "@/lib/hooks"
import type { Tag } from "@/lib/types"

type TimeSlotProps = {
  slot: number
  interval: 15 | 30
  clockFormat: 12 | 24
  tag: Tag | undefined
  isCurrentSlot: boolean
  isSelected: boolean
  onModifierClick: (
    slot: number,
    modifiers: { ctrlOrMeta: boolean; shift: boolean }
  ) => void
  onPlainClick: (slot: number) => void
} & Omit<React.ComponentPropsWithoutRef<"button">, "slot">

export const TimeSlot = memo(
  forwardRef<HTMLButtonElement, TimeSlotProps>(function TimeSlot(
    {
      slot,
      interval,
      clockFormat,
      tag,
      isCurrentSlot,
      isSelected,
      onModifierClick,
      onPlainClick,
      className,
      onClick,
      onPointerDownCapture,
      ...props
    },
    ref
  ) {
    const time = formatSlotTime(slot, interval, clockFormat)
    const isHourBoundary = (slot * interval) % 60 === 0
    const buttonClassName = [
      "group flex items-stretch w-full text-left transition-colors rounded-md",
      isCurrentSlot ? "ring-1 ring-primary/30" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <button
        ref={ref}
        type="button"
        onPointerDownCapture={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
          }
          onPointerDownCapture?.(e)
        }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            onModifierClick(slot, {
              ctrlOrMeta: e.ctrlKey || e.metaKey,
              shift: e.shiftKey,
            })
            return
          }
          onPlainClick(slot)
          onClick?.(e)
        }}
        className={buttonClassName}
        {...props}
      >
        {/* Time label */}
        <div
          className={`w-14 shrink-0 py-2 pr-2 text-right text-xs tabular-nums select-none ${
            isHourBoundary
              ? "text-foreground font-medium"
              : "text-muted-foreground/70"
          }`}
        >
          {time}
        </div>

        {/* Slot block */}
        <div
          className={`flex-1 min-h-[32px] rounded-md border transition-all ${
            tag
              ? "border-transparent group-hover:border-border"
              : "border-dashed border-border/50 group-hover:border-border group-hover:bg-accent/50"
          } ${isCurrentSlot && !tag ? "bg-primary/5" : ""} ${isSelected && !tag ? "bg-accent/50" : ""}`}
          style={
            tag
              ? {
                  backgroundColor: tag.color + "18",
                  borderLeft: `3px solid ${tag.color}`,
                }
              : undefined
          }
        >
          {tag && (
            <span
              className="block px-2.5 py-1.5 text-xs font-medium truncate select-none"
              style={{ color: tag.color }}
            >
              {tag.name}
            </span>
          )}
        </div>
      </button>
    )
  })
)

TimeSlot.displayName = "TimeSlot"
