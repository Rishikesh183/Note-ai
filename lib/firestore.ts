'use client'

import { useEffect, useState, useCallback } from 'react'
import { Note } from './mock-data'

function formatTs(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const m = Math.floor(diffMs / 60_000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (day < 7) return `${day}d ago`
  return d.toLocaleDateString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shape(raw: any): Note {
  return { ...raw, updatedAt: formatTs(raw.updatedAt) }
}

export function useNotes(userId: string | null | undefined) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setNotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('/api/notes')
      .then((r) => r.json())
      .then(({ notes: raw }) => {
        setNotes(raw.map(shape))
        setLoading(false)
      })
      .catch((err: Error) => {
        console.error('[useNotes]', err)
        setError(err.message)
        setLoading(false)
      })
  }, [userId])

  const createNote = useCallback(async (): Promise<Note | null> => {
    try {
      const res = await fetch('/api/notes', { method: 'POST' })
      if (!res.ok) return null
      const { note } = await res.json()
      const formatted = shape(note)
      setNotes((prev) => [formatted, ...prev])
      return formatted
    } catch {
      return null
    }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('[deleteNote]', err)
    }
  }, [])

  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: !current } : n)))
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !current }),
      })
    } catch (err) {
      console.error('[toggleFavorite]', err)
    }
  }, [])

  /* Called by Editor on every keystroke for optimistic list preview */
  const updateNoteInList = useCallback((id: string, data: { title?: string; content?: string }) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const content = data.content ?? n.content
        return {
          ...n,
          ...data,
          preview: content.replace(/[#*_`[\]]/g, '').slice(0, 120),
          updatedAt: 'Just now',
          wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
        }
      })
    )
  }, [])

  return { notes, loading, error, createNote, deleteNote, toggleFavorite, updateNoteInList }
}
