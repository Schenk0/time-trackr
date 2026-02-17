"use client"

import { useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMinuteTime } from "@/lib/hooks"
import type { DailySchedule, Tag } from "@/lib/types"

const WEEKDAYS = [
  { id: 0, short: "Su", label: "Sunday" },
  { id: 1, short: "Mo", label: "Monday" },
  { id: 2, short: "Tu", label: "Tuesday" },
  { id: 3, short: "We", label: "Wednesday" },
  { id: 4, short: "Th", label: "Thursday" },
  { id: 5, short: "Fr", label: "Friday" },
  { id: 6, short: "Sa", label: "Saturday" },
] as const

type ScheduleDraft = {
  tagId: string
  startMinute: number
  endMinute: number
  weekdays: number[]
}

interface SchedulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  schedules: DailySchedule[]
  interval: 15 | 30
  clockFormat: 12 | 24
  onAddSchedule: (schedule: DailySchedule) => void
  onUpdateSchedule: (
    id: string,
    updates: Partial<Omit<DailySchedule, "id">>
  ) => void
  onDeleteSchedule: (id: string) => void
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function formatWeekdays(days: number[]) {
  if (days.length === 7) return "Every day"
  return WEEKDAYS.filter((day) => days.includes(day.id))
    .map((day) => day.short)
    .join(", ")
}

function buildMinuteOptions(interval: 15 | 30) {
  const slotCount = (24 * 60) / interval
  return Array.from({ length: slotCount }, (_, index) => index * interval)
}

function sortedWeekdays(weekdays: number[]) {
  return Array.from(new Set(weekdays)).sort((a, b) => a - b)
}

function ScheduleForm({
  draft,
  setDraft,
  tags,
  tagMap,
  minuteOptions,
  clockFormat,
}: {
  draft: ScheduleDraft
  setDraft: (updates: Partial<ScheduleDraft>) => void
  tags: Tag[]
  tagMap: Map<string, Tag>
  minuteOptions: number[]
  clockFormat: 12 | 24
}) {
  const defaultTagId = tags[0]?.id ?? ""
  const selectedTagId = tags.some((tag) => tag.id === draft.tagId)
    ? draft.tagId
    : defaultTagId
  const selectedTag = tagMap.get(selectedTagId)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tag</Label>
          <Select value={selectedTagId} onValueChange={(value) => setDraft({ tagId: value })}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedTag?.color ?? "#888888" }}
                />
                <SelectValue placeholder="Select tag" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Start</Label>
          <Select
            value={String(draft.startMinute)}
            onValueChange={(value) => setDraft({ startMinute: Number(value) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((minute) => (
                <SelectItem key={minute} value={String(minute)}>
                  {formatMinuteTime(minute, clockFormat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">End</Label>
          <Select
            value={String(draft.endMinute)}
            onValueChange={(value) => setDraft({ endMinute: Number(value) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...minuteOptions, 1440].map((minute) => (
                <SelectItem key={minute} value={String(minute)}>
                  {formatMinuteTime(minute, clockFormat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Weekdays</Label>
        <ToggleGroup
          type="multiple"
          value={draft.weekdays.map((day) => String(day))}
          onValueChange={(values) => setDraft({ weekdays: values.map(Number) })}
          className="justify-start flex-wrap"
        >
          {WEEKDAYS.map((day) => (
            <ToggleGroupItem
              key={day.id}
              value={String(day.id)}
              aria-label={day.label}
              className="h-8 px-2 text-xs"
            >
              {day.short}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}

export function SchedulesDialog({
  open,
  onOpenChange,
  tags,
  schedules,
  interval,
  clockFormat,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: SchedulesDialogProps) {
  const [addDraft, setAddDraft] = useState<ScheduleDraft>({
    tagId: "",
    startMinute: 1320,
    endMinute: 360,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<ScheduleDraft | null>(null)

  const minuteOptions = useMemo(() => buildMinuteOptions(interval), [interval])
  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])
  const defaultTagId = tags[0]?.id ?? ""

  const addSchedule = () => {
    const selectedTagId = tags.some((tag) => tag.id === addDraft.tagId)
      ? addDraft.tagId
      : defaultTagId
    if (!selectedTagId || addDraft.weekdays.length === 0) return
    onAddSchedule({
      id: `schedule-${Date.now()}`,
      tagId: selectedTagId,
      startMinute: addDraft.startMinute,
      endMinute: addDraft.endMinute,
      weekdays: sortedWeekdays(addDraft.weekdays),
      startsOn: todayStr(),
    })
  }

  const startEdit = (schedule: DailySchedule) => {
    setEditingId(schedule.id)
    setEditDraft({
      tagId: schedule.tagId,
      startMinute: schedule.startMinute,
      endMinute: schedule.endMinute,
      weekdays: schedule.weekdays,
    })
  }

  const resetEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const saveEdit = (schedule: DailySchedule) => {
    if (!editDraft) return
    const selectedTagId = tags.some((tag) => tag.id === editDraft.tagId)
      ? editDraft.tagId
      : defaultTagId
    if (!selectedTagId || editDraft.weekdays.length === 0) return
    onUpdateSchedule(schedule.id, {
      tagId: selectedTagId,
      startMinute: editDraft.startMinute,
      endMinute: editDraft.endMinute,
      weekdays: sortedWeekdays(editDraft.weekdays),
      startsOn: schedule.startsOn,
    })
    resetEdit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedules</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Schedules are defaults from the creation date onward. Any day can be
              overridden from the timeline.
            </p>
            <ScheduleForm
              draft={addDraft}
              setDraft={(updates) => setAddDraft((prev) => ({ ...prev, ...updates }))}
              tags={tags}
              tagMap={tagMap}
              minuteOptions={minuteOptions}
              clockFormat={clockFormat}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addSchedule}
              disabled={tags.length === 0 || addDraft.weekdays.length === 0}
            >
              Add schedule
            </Button>
          </div>

          <div className="space-y-1">
            {schedules.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 px-1">
                No schedules yet.
              </p>
            ) : (
              schedules.map((schedule) => {
                const scheduleTag = tagMap.get(schedule.tagId)
                const isEditing = editingId === schedule.id && Boolean(editDraft)

                if (isEditing && editDraft) {
                  return (
                    <div key={schedule.id} className="rounded-md border p-3 space-y-3">
                      <p className="text-xs font-medium">Editing schedule</p>
                      <ScheduleForm
                        draft={editDraft}
                        setDraft={(updates) =>
                          setEditDraft((prev) => (prev ? { ...prev, ...updates } : prev))
                        }
                        tags={tags}
                        tagMap={tagMap}
                        minuteOptions={minuteOptions}
                        clockFormat={clockFormat}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveEdit(schedule)}
                          disabled={editDraft.weekdays.length === 0 || tags.length === 0}
                        >
                          Save changes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={resetEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={schedule.id}
                    className="rounded-md border px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: scheduleTag?.color ?? "#888888",
                          }}
                        />
                        <p className="text-xs font-medium truncate">
                          {scheduleTag?.name ?? "Unknown tag"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatMinuteTime(schedule.startMinute, clockFormat)} -{" "}
                          {formatMinuteTime(schedule.endMinute, clockFormat)}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatWeekdays(schedule.weekdays)} from {schedule.startsOn}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => startEdit(schedule)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="hover:text-destructive"
                        onClick={() => onDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
