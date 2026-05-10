'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, FileText, Plus, Sparkles, Clock, Trash2, Settings, ArrowRight, Star, Hash } from 'lucide-react'
import { Note } from '@/lib/mock-data'

const QUICK_ACTIONS = [
  { icon: Plus,     label: 'New Note',        mac: '⌘N',    win: 'Ctrl+N',       color: 'text-violet-400',    action: 'new' },
  { icon: Sparkles, label: 'Ask AI',           mac: '⌘⇧A',  win: 'Ctrl+Shift+A', color: 'text-indigo-400',    action: null  },
  { icon: Star,     label: 'View Favorites',   mac: '⌘2',   win: 'Ctrl+2',       color: 'text-amber-400/80',  action: null  },
  { icon: Clock,    label: 'Recent Notes',     mac: '⌘4',   win: 'Ctrl+4',       color: 'text-blue-400/80',   action: null  },
  { icon: Hash,     label: 'Browse Tags',      mac: '⌘T',   win: 'Ctrl+T',       color: 'text-green-400/70',  action: null  },
  { icon: Trash2,   label: 'Trash',            mac: '⌘⌫',  win: 'Ctrl+Del',     color: 'text-red-400/60',    action: null  },
  { icon: Settings, label: 'Settings',         mac: '⌘,',   win: 'Ctrl+,',       color: 'text-violet-300/50', action: null  },
]

interface CommandPaletteProps {
  onClose: () => void
  notes: Note[]
  onSelectNote: (note: Note) => void
  onNewNote: () => void
}

export default function CommandPalette({ onClose, notes, onSelectNote, onNewNote }: CommandPaletteProps) {
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  useEffect(() => { requestAnimationFrame(() => inputRef.current?.focus()) }, [])

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(query.toLowerCase()) ||
    n.preview.toLowerCase().includes(query.toLowerCase())
  )
  const filteredActions = QUICK_ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  )
  const totalItems = filteredActions.length + filteredNotes.length

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, totalItems - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (selected < filteredActions.length) {
          if (filteredActions[selected]?.action === 'new') onNewNote()
        } else {
          const note = filteredNotes[selected - filteredActions.length]
          if (note) onSelectNote(note)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, filteredActions, filteredNotes, onNewNote, onSelectNote, totalItems])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-start justify-center pt-[18vh] z-50 px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="w-full max-w-130 pointer-events-auto"
        >
          <div className="cmd-bg border border-md rounded-2xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-2xl">
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-dim">
              <Search size={14} className="t-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search notes or run a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[13.5px] t-primary outline-none"
              />
              <kbd className="text-[10px] font-mono t-muted surface border border-dim px-1.5 py-0.5 rounded-md shrink-0">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-90 overflow-y-auto py-1.5">
              {filteredActions.length > 0 && (
                <section className="mb-1">
                  <div className="px-4 py-1.5 text-[9.5px] font-semibold t-muted uppercase tracking-widest">Actions</div>
                  {filteredActions.map((action, i) => {
                    const Icon = action.icon
                    const isSelected = i === selected
                    return (
                      <button
                        key={action.label}
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => { if (action.action === 'new') onNewNote(); else onClose() }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isSelected ? 'surface' : 'hover:bg-(--bg-surface)'}`}
                      >
                        <div className="w-6 h-6 rounded-lg surface flex items-center justify-center shrink-0">
                          <Icon size={12} className={action.color} />
                        </div>
                        <span className="flex-1 text-[12.5px] t-secondary">{action.label}</span>
                        <span className="text-[10px] font-mono t-muted">{isMac ? action.mac : action.win}</span>
                        {isSelected && <ArrowRight size={11} className="t-muted shrink-0" />}
                      </button>
                    )
                  })}
                </section>
              )}

              {filteredNotes.length > 0 && (
                <section>
                  <div className="px-4 py-1.5 text-[9.5px] font-semibold t-muted uppercase tracking-widest">Notes</div>
                  {filteredNotes.slice(0, 6).map((note, i) => {
                    const globalIndex = filteredActions.length + i
                    const isSelected = globalIndex === selected
                    return (
                      <button
                        key={note.id}
                        onMouseEnter={() => setSelected(globalIndex)}
                        onClick={() => onSelectNote(note)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isSelected ? 'surface' : 'hover:bg-(--bg-surface)'}`}
                      >
                        <div className="w-6 h-6 rounded-lg surface flex items-center justify-center shrink-0">
                          <FileText size={12} className="t-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] t-primary truncate">{note.title}</div>
                          <div className="text-[10.5px] t-muted truncate mt-px">{note.preview}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono t-muted">{note.updatedAt}</span>
                          {isSelected && <ArrowRight size={11} className="t-muted" />}
                        </div>
                      </button>
                    )
                  })}
                </section>
              )}

              {filteredActions.length === 0 && filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-[12.5px] t-muted">No results for &ldquo;{query}&rdquo;</p>
                  <button
                    onClick={onNewNote}
                    className="text-[11.5px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={11} /> Create note with this title
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-dim flex items-center gap-3">
              {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'close']].map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <kbd className="text-[9px] font-mono t-muted surface border border-dim px-1.5 py-0.5 rounded">{key}</kbd>
                  <span className="text-[10px] t-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
