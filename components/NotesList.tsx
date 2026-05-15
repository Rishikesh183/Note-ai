'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, X, Plus, Menu } from 'lucide-react'
import NoteCard from './NoteCard'
import { Note, NavItem } from '@/lib/mock-data'

const NAV_LABELS: Record<NavItem, string> = {
  all: 'All Notes',
  favorites: 'Favorites',
  ai: 'AI Workspace',
  recent: 'Recent',
  trash: 'Trash',
}

const NAV_DESCRIPTIONS: Record<NavItem, string> = {
  all: 'Every note in one place',
  favorites: "Notes you've starred",
  ai: 'AI-enhanced workspace',
  recent: 'Recently accessed',
  trash: 'Deleted notes',
}

interface NotesListProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  activeNav: NavItem
  onNewNote: () => void
  onToggleSidebar?: () => void
}

export default function NotesList({
  notes,
  selectedNote,
  onSelectNote,
  onDeleteNote,
  searchQuery,
  onSearchChange,
  activeNav,
  onNewNote,
  onToggleSidebar,
}: NotesListProps) {
  return (
    <div className="w-full md:w-68 h-full flex flex-col shrink-0 panel-bg panel-border-r">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn shrink-0 md:hidden"
              >
                <Menu size={14} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold t-primary tracking-tight">
                {NAV_LABELS[activeNav]}
              </h2>
              <p className="text-[10.5px] t-muted mt-0.5">
                {NAV_DESCRIPTIONS[activeNav]}
              </p>
            </div>
          </div>
          <button
            onClick={onNewNote}
            title="New note"
            className="w-6 h-6 rounded-lg flex items-center justify-center app-icon-btn mt-0.5 shrink-0"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 t-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full surface border border-dim rounded-xl pl-7 pr-7 py-2 text-[12px] t-primary focus:border-violet-500/30 transition-all duration-150 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 t-muted hover:t-secondary transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 pb-2 shrink-0">
        <span className="text-[10px] t-muted font-mono">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence mode="popLayout">
          {notes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-44 gap-3 text-center px-4"
            >
              <div className="w-12 h-12 rounded-2xl surface border border-dim flex items-center justify-center">
                <FileText size={18} className="t-muted" />
              </div>
              <p className="text-[11.5px] t-muted leading-relaxed">
                {searchQuery
                  ? `No notes match "${searchQuery}"`
                  : activeNav === 'trash'
                  ? 'Trash is empty'
                  : 'No notes here yet'}
              </p>
              {!searchQuery && activeNav !== 'trash' && (
                <button
                  onClick={onNewNote}
                  className="text-[11.5px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  <Plus size={11} />
                  Create one
                </button>
              )}
            </motion.div>
          ) : (
            notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: index * 0.035, duration: 0.18 }}
              >
                <NoteCard
                  note={note}
                  selected={selectedNote?.id === note.id}
                  onClick={() => onSelectNote(note)}
                  onDelete={() => onDeleteNote(note.id)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
