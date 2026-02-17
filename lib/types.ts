export type Tag = {
  id: string
  name: string
  color: string
}

export type TimeEntry = {
  date: string
  slot: number
  tagId: string
}

export type NotificationMode = "off" | "browser" | "sound"

export type DailySchedule = {
  id: string
  tagId: string
  startMinute: number
  endMinute: number
  weekdays: number[]
  startsOn: string
}

export type Settings = {
  interval: 15 | 30
  clockFormat: 12 | 24
  notificationMode: NotificationMode
}
