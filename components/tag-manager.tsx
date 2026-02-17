"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TAG_COLORS } from "@/lib/constants"
import type { Tag } from "@/lib/types"

interface TagManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  onAdd: (tag: Tag) => void
  onUpdate: (id: string, updates: Partial<Omit<Tag, "id">>) => void
  onDelete: (id: string) => void
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          className={`w-6 h-6 rounded-full transition-all ${
            value === color
              ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
              : "hover:scale-110"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}

export function TagManager({
  open,
  onOpenChange,
  tags,
  onAdd,
  onUpdate,
  onDelete,
}: TagManagerProps) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()
    onAdd({ id, name, color: newColor })
    setNewName("")
    setNewColor(TAG_COLORS[0])
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    onUpdate(editingId, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Add new tag */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
            <div className="flex gap-2">
              <Input
                placeholder="New tag name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>

          {/* Tag list */}
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {tags.map((tag) =>
              editingId === tag.id ? (
                <div
                  key={tag.id}
                  className="flex flex-col gap-2 p-2.5 rounded-lg border bg-card"
                >
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={saveEdit}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ColorPicker value={editColor} onChange={setEditColor} />
                </div>
              ) : (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm flex-1">{tag.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => startEdit(tag)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => onDelete(tag.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
