import type { Tag } from "./types"

export const STORAGE_KEYS = {
  tags: "tt-tags",
  entries: "tt-entries",
  settings: "tt-settings",
  schedules: "tt-schedules",
} as const

export const TAG_COLORS = [
  "#4A90D9", // blue
  "#D94A4A", // red
  "#50B86C", // green
  "#E8A838", // amber
  "#9B6DD7", // purple
  "#D97B4A", // orange
  "#4ABFBF", // teal
  "#D94A8A", // pink
  "#8B8B8B", // gray
  "#6B8E5A", // olive
] as const

export const DEFAULT_TAGS: Tag[] = [
  { id: "work", name: "Work", color: TAG_COLORS[0] },
  { id: "sleep", name: "Sleep", color: TAG_COLORS[4] },
  { id: "exercise", name: "Exercise", color: TAG_COLORS[2] },
  { id: "break", name: "Break", color: TAG_COLORS[3] },
  { id: "personal", name: "Personal", color: TAG_COLORS[5] },
]

export const NOTIFICATION_START_HOUR = 7
export const NOTIFICATION_END_HOUR = 23
