'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, Star, Share2, PanelLeft, Sparkles, Clock } from 'lucide-react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import FloatingToolbar from './FloatingToolbar'
import SaveStatusIndicator from './SaveStatus'
import { useAutosave } from '@/hooks/useAutosave'
import { Note } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EditorProps {
  note: Note
  onNoteUpdated: (id: string, data: { title: string; content: string }) => void
  onToggleFavorite: (id: string, current: boolean) => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function Editor({ note, onNoteUpdated, onToggleFavorite, onToggleSidebar, sidebarOpen }: EditorProps) {
  const { isSignedIn } = useUser()
  const { local, save, status } = useAutosave(
    note.id,
    { title: note.title, content: note.content },
    (synced) => onNoteUpdated(note.id, synced)
  )
  const [starred, setStarred] = useState(note.favorite)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const localTitleRef = useRef(local.title)
  localTitleRef.current = local.title

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    immediatelyRender: false,
    content: local.content,
    editorProps: {
      attributes: { class: 'tiptap-content' },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      save({ content: html })
      onNoteUpdated(note.id, { title: localTitleRef.current, content: html })
    },
  })

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [local.title])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      save({ title: e.target.value })
      onNoteUpdated(note.id, { title: e.target.value, content: localTitleRef.current })
    },
    [note.id, save, onNoteUpdated]
  )

  const wordCount = (() => {
    const text = stripHtml(local.content)
    return text ? text.split(/\s+/).length : 0
  })()

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 h-full flex flex-col editor-bg min-w-0 relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 panel-border-b shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button onClick={onToggleSidebar} className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
              <PanelLeft size={14} />
            </button>
          )}
          <div className="flex items-center gap-1.5 t-muted">
            <Clock size={11} />
            <span className="text-[11px] font-mono">{note.updatedAt}</span>
          </div>
          <SaveStatusIndicator status={status} />
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setStarred((s) => !s); onToggleFavorite(note.id, starred) }}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150',
              starred ? 'text-amber-400/80 hover:bg-amber-400/10' : 'app-icon-btn'
            )}
          >
            <Star size={14} className={starred ? 'fill-amber-400/80' : ''} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
            <Share2 size={14} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
            <MoreHorizontal size={14} />
          </button>

          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="h-8 px-3 ml-1 rounded-full bg-linear-to-r from-violet-600 to-purple-500 text-white text-sm font-semibold shadow-[0_0_25px_rgba(124,58,237,0.4)] hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(124,58,237,0.55)] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                Get Started
              </button>
            </SignInButton>
          )}

          {isSignedIn && (
            <div className="ml-1">
              <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8 ring-2 ring-violet-500/30 hover:ring-violet-500/60 transition-all' } }} />
            </div>
          )}
        </div>
      </div>

      {/* Format toolbar */}
      <FloatingToolbar editor={editor} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-170 mx-auto px-10 pt-8 pb-24">
          <textarea
            ref={titleRef}
            value={local.title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            rows={1}
            className="w-full bg-transparent text-[28px] font-bold t-primary resize-none outline-none leading-tight mb-6 font-sans overflow-hidden"
          />

          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-linear-to-r from-(--border-dim) to-transparent" />
            <span className="text-[10px] t-muted font-mono tracking-wide">{note.updatedAt}</span>
            <div className="h-px flex-1 bg-linear-to-l from-(--border-dim) to-transparent" />
          </div>

          <EditorContent editor={editor} className="w-full" />
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 px-8 py-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] t-muted font-mono">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          {note.category && (
            <>
              <span className="t-muted text-[10px]">·</span>
              <span className="text-[10px] t-muted capitalize">{note.category}</span>
            </>
          )}
        </div>
      </div>

      {/* AI button */}
      <div className="absolute bottom-5 right-6 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12.5px] font-semibold text-white bg-linear-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-950/60 hover:from-violet-500 hover:to-indigo-500 transition-all duration-200"
        >
          <Sparkles size={13} className="shrink-0" />
          Ask AI
        </motion.button>
      </div>
    </motion.div>
  )
}
