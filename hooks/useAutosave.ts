'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { NoteTab } from '@/lib/mock-data'

export type SaveStatus = 'saved' | 'draft' | 'saving' | 'offline'

interface Local {
  title: string
  tabs: NoteTab[]
}

function lsKey(noteId: string) {
  return `note-draft:${noteId}`
}

export function useAutosave(
  noteId: string,
  initial: Local,
  onSynced?: (data: Local) => void
) {
  const [local, setLocalState] = useState<Local>(() => {
    try {
      const raw = localStorage.getItem(lsKey(noteId))
      if (raw) return JSON.parse(raw) as Local
    } catch {}
    return initial
  })
  const [status, setStatus] = useState<SaveStatus>(() => {
    try {
      const raw = localStorage.getItem(lsKey(noteId))
      if (raw) {
        const draft = JSON.parse(raw) as Local
        if (draft.title !== initial.title || JSON.stringify(draft.tabs) !== JSON.stringify(initial.tabs)) return 'draft'
      }
    } catch {}
    return 'saved'
  })

  const localRef = useRef<Local>(local)
  const lastSynced = useRef<Local>(initial)
  const lsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const apiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSyncedRef = useRef(onSynced)
  onSyncedRef.current = onSynced

  const setLocal = useCallback((next: Local) => {
    localRef.current = next
    setLocalState(next)
  }, [])

  /* Reset on note switch */
  useEffect(() => {
    if (lsTimer.current) clearTimeout(lsTimer.current)
    if (apiTimer.current) clearTimeout(apiTimer.current)

    let restored = initial
    try {
      const raw = localStorage.getItem(lsKey(noteId))
      if (raw) restored = JSON.parse(raw) as Local
    } catch {}

    lastSynced.current = initial
    setLocal(restored)
    setStatus(
      restored.title !== initial.title || JSON.stringify(restored.tabs) !== JSON.stringify(initial.tabs)
        ? 'draft'
        : 'saved'
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  /* Warn before close if unsynced */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === 'draft' || status === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  const save = useCallback(
    (data: Partial<Local>) => {
      const next: Local = { ...localRef.current, ...data }
      setLocal(next)
      setStatus('draft')

      if (lsTimer.current) clearTimeout(lsTimer.current)
      lsTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(lsKey(noteId), JSON.stringify(localRef.current))
        } catch {}
      }, 2000)

      if (apiTimer.current) clearTimeout(apiTimer.current)
      apiTimer.current = setTimeout(async () => {
        const current = localRef.current
        const patch: Record<string, unknown> = {}
        if (current.title !== lastSynced.current.title) patch.title = current.title
        if (JSON.stringify(current.tabs) !== JSON.stringify(lastSynced.current.tabs)) patch.tabs = current.tabs
        if (Object.keys(patch).length === 0) {
          setStatus('saved')
          return
        }

        setStatus('saving')
        try {
          const res = await fetch(`/api/notes/${noteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          })
          if (res.ok) {
            lastSynced.current = { ...current }
            localStorage.removeItem(lsKey(noteId))
            setStatus('saved')
            onSyncedRef.current?.(current)
          } else {
            setStatus('offline')
          }
        } catch {
          setStatus('offline')
        }
      }, 4500)
    },
    [noteId, setLocal]
  )

  return { local, save, status }
}
