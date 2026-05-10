'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { Sparkles, Plus } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import NotesList from '@/components/NotesList'
import Editor from '@/components/Editor'
import CommandPalette from '@/components/CommandPalette'
import { useNotes } from '@/lib/firestore'
import { NavItem } from '@/lib/mock-data'

export default function Page() {
  const { user, isLoaded } = useUser()
  const userId = user?.id ?? null

  const { notes, loading, createNote, deleteNote, toggleFavorite, updateNoteInList } =
    useNotes(userId)

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? notes[0] ?? null
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState<NavItem>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const handleNewNote = useCallback(async () => {
    const note = await createNote()
    if (!note) return
    setSelectedNoteId(note.id)
    setActiveNav('all')
    setSearchQuery('')
  }, [createNote])

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((o) => !o)
      }
      /* Alt+N / ⌥N — new note (avoids browser-reserved Ctrl+N) */
      if (e.altKey && e.key === 'n') {
        e.preventDefault()
        handleNewNote()
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNewNote])

  const filteredNotes = notes.filter((note) => {
    if (activeNav === 'favorites') return note.favorite
    if (activeNav === 'trash') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return note.title.toLowerCase().includes(q) || note.preview.toLowerCase().includes(q)
    }
    return true
  })

  const handleToggleFavorite = useCallback(
    (id: string, current: boolean) => toggleFavorite(id, current),
    [toggleFavorite]
  )

  const handleDeleteNote = useCallback(
    async (id: string) => {
      await deleteNote(id)
      if (selectedNoteId === id) setSelectedNoteId(null)
    },
    [deleteNote, selectedNoteId]
  )

  /* ── Auth loading ───────────────────────────────────── */
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center app-bg">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ── Sign-in screen ─────────────────────────────────── */
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center app-bg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-175 h-175 rounded-full bg-violet-600/6 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-100 h-100 rounded-full bg-indigo-600/4 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-8 text-center px-6 max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-violet-900/40">
            <Sparkles size={28} className="text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold t-primary">NoteAI</h1>
            <p className="text-[15px] t-secondary leading-relaxed">
              Your intelligent notes workspace. Write, think, and let AI do the rest.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <SignUpButton mode="modal">
              <button className="flex-1 h-11 px-6 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white text-[13.5px] font-semibold hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Get started free
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="flex-1 h-11 px-6 rounded-xl surface-btn border text-[13.5px] font-medium hover:scale-[1.02] active:scale-[0.98]">
                Sign in
              </button>
            </SignInButton>
          </div>

          <p className="text-[11px] t-muted">
            Your notes are private and encrypted per user.
          </p>
        </motion.div>
      </div>
    )
  }

  /* ── Notes loading skeleton ─────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-screen app-bg overflow-hidden">
        <div className="w-14.5 h-full panel-bg panel-border-r shrink-0" />
        <div className="w-68 h-full panel-bg panel-border-r shrink-0 p-4 space-y-2">
          {[80, 60, 72, 55, 68].map((_w, i) => (
            <motion.div
              key={i}
              className="h-16 rounded-xl surface"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
        <div className="flex-1 editor-bg flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-8 h-8 rounded-xl surface"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen app-bg overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        activeNav={activeNav}
        onNavChange={(nav) => { setActiveNav(nav); setSearchQuery('') }}
        onNewNote={handleNewNote}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden min-w-0">
        <NotesList
          notes={filteredNotes}
          selectedNote={selectedNote}
          onSelectNote={(n) => setSelectedNoteId(n.id)}
          onDeleteNote={handleDeleteNote}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeNav={activeNav}
          onNewNote={handleNewNote}
        />

        <AnimatePresence mode="wait">
          {selectedNote ? (
            <Editor
              key={selectedNote.id}
              note={selectedNote}
              onNoteUpdated={updateNoteInList}
              onToggleFavorite={handleToggleFavorite}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
              sidebarOpen={sidebarOpen}
            />
          ) : (
            <motion.div
              key="empty-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 editor-bg flex flex-col items-center justify-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl surface flex items-center justify-center">
                <Plus size={20} className="t-muted" />
              </div>
              <p className="text-[13px] t-muted">Create a note to get started</p>
              <button
                onClick={handleNewNote}
                className="h-9 px-4 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white text-[12.5px] font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all"
              >
                New Note
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette
            onClose={() => setCommandPaletteOpen(false)}
            notes={notes}
            onSelectNote={(note) => { setSelectedNoteId(note.id); setCommandPaletteOpen(false) }}
            onNewNote={() => { handleNewNote(); setCommandPaletteOpen(false) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
