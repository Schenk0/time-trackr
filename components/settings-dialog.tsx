"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import type { Settings, NotificationMode } from "@/lib/types"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onUpdate: (updates: Partial<Settings>) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdate,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Clock format */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Clock format</Label>
            <ToggleGroup
              type="single"
              value={String(settings.clockFormat)}
              onValueChange={(v) => {
                if (v) onUpdate({ clockFormat: Number(v) as 12 | 24 })
              }}
              className="h-8"
            >
              <ToggleGroupItem value="12" className="text-xs px-3 h-8">
                12h
              </ToggleGroupItem>
              <ToggleGroupItem value="24" className="text-xs px-3 h-8">
                24h
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Interval */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Time interval</Label>
            <ToggleGroup
              type="single"
              value={String(settings.interval)}
              onValueChange={(v) => {
                if (v) onUpdate({ interval: Number(v) as 15 | 30 })
              }}
              className="h-8"
            >
              <ToggleGroupItem value="15" className="text-xs px-3 h-8">
                15 min
              </ToggleGroupItem>
              <ToggleGroupItem value="30" className="text-xs px-3 h-8">
                30 min
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Notification mode */}
          <div className="flex flex-col gap-2.5">
            <Label className="text-sm">Notifications</Label>
            <ToggleGroup
              type="single"
              value={settings.notificationMode}
              onValueChange={(v) => {
                if (v) onUpdate({ notificationMode: v as NotificationMode })
              }}
              className="h-8 w-full"
            >
              <ToggleGroupItem
                value="off"
                className="text-xs px-3 h-8 flex-1"
              >
                Off
              </ToggleGroupItem>
              <ToggleGroupItem
                value="browser"
                className="text-xs px-3 h-8 flex-1"
              >
                Browser
              </ToggleGroupItem>
              <ToggleGroupItem
                value="sound"
                className="text-xs px-3 h-8 flex-1"
              >
                Sound
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {settings.notificationMode === "off"
                ? "Reminders are disabled."
                : settings.notificationMode === "browser"
                  ? "Browser push notifications when a time block is unlogged."
                  : "A short sound plays every time block."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
