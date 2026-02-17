"use client"

import { useState } from "react"
import { X } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Tag } from "@/lib/types"

interface TagPickerProps {
  tags: Tag[]
  currentTagId: string | null
  onSelect: (tagId: string | null) => void
  selectionCount?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function TagPicker({
  tags,
  currentTagId,
  onSelect,
  selectionCount = 1,
  open,
  onOpenChange,
  children,
}: TagPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open === "boolean"
  const resolvedOpen = isControlled ? open : internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const handleSelect = (tagId: string | null) => {
    onSelect(tagId)
    setOpen(false)
  }

  return (
    <Popover open={resolvedOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      {resolvedOpen ? (
        <PopoverContent className="w-48 p-2" align="center">
          <div className="flex flex-col gap-1">
            {selectionCount > 1 && (
              <p className="px-2.5 py-1 text-xs text-muted-foreground">
                Apply to {selectionCount} slots
              </p>
            )}
            {tags.map((tag) => (
              <button
                key={tag.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left hover:bg-accent ${
                  currentTagId === tag.id
                    ? "bg-accent font-medium"
                    : ""
                }`}
                onClick={() => handleSelect(tag.id)}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}

            {(currentTagId || selectionCount > 1) && (
              <>
                <div className="h-px bg-border my-1" />
                <button
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors"
                  onClick={() => handleSelect(null)}
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </>
            )}
          </div>
        </PopoverContent>
      ) : null}
    </Popover>
  )
}
