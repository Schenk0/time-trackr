"use client"

import { NOTIFICATION_START_HOUR, NOTIFICATION_END_HOUR } from "./constants"
import type { NotificationMode } from "./types"

export function requestNotificationPermission() {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (Notification.permission === "default") {
    Notification.requestPermission()
  }
}

function isWithinWakingHours() {
  const hour = new Date().getHours()
  return hour >= NOTIFICATION_START_HOUR && hour < NOTIFICATION_END_HOUR
}

function playNotificationSound() {
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.frequency.value = 660
  oscillator.type = "sine"
  gain.gain.value = 0.15

  oscillator.start()
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  oscillator.stop(ctx.currentTime + 0.5)
}

function sendBrowserNotification() {
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  new Notification("Time Tracker", {
    body: "What have you been doing? Log your current time block.",
    icon: "/vercel.svg",
    tag: "time-tracker-reminder",
  })
}

export function startNotificationLoop(
  isPreviousSlotLogged: () => boolean,
  mode: NotificationMode,
  intervalMinutes: number
) {
  if (mode === "off") return () => {}

  if (mode === "browser") {
    requestNotificationPermission()
  }

  let lastNotifiedSlot = -1

  const getCurrentSlotIndex = () => {
    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()
    return Math.floor(minutes / intervalMinutes)
  }

  let prevSlotIndex = getCurrentSlotIndex()

  const check = () => {
    const currentSlotIndex = getCurrentSlotIndex()

    // Only check when a new slot begins (slot transition)
    if (currentSlotIndex !== prevSlotIndex) {
      prevSlotIndex = currentSlotIndex

      // Don't notify for the same slot twice
      if (lastNotifiedSlot === currentSlotIndex) return

      // Always play sound on slot transition; browser notifications only when unlogged + waking hours
      if (mode === "sound") {
        playNotificationSound()
        lastNotifiedSlot = currentSlotIndex
      } else if (mode === "browser" && isWithinWakingHours() && !isPreviousSlotLogged()) {
        sendBrowserNotification()
        lastNotifiedSlot = currentSlotIndex
      }
    }
  }

  // Check every 15 seconds so we catch transitions quickly
  const id = window.setInterval(check, 15_000)

  return () => window.clearInterval(id)
}
