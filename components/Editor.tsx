'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, Star, PanelLeft, Sparkles, Clock, ChevronLeft, Plus, X } from 'lucide-react'
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
import SharePopover from './SharePopover'
import AiPanel from './ai/AiPanel'
import SelectionBubble from './ai/SelectionBubble'
import { AutocompleteExtension, setAutocompleteEnabled } from './ai/AutocompleteExtension'
import { useAutosave } from '@/hooks/useAutosave'
import { Note, NoteTab } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface EditorProps {
  note: Note
  onNoteUpdated: (id: string, data: { title: string; content: string }) => void
  onToggleFavorite: (id: string, current: boolean) => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onBack?: () => void
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function makeTab(name: string): NoteTab {
  return { id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, content: '' }
}

function migrateTabs(note: Note): NoteTab[] {
  if (Array.isArray(note.tabs) && note.tabs.length > 0) return note.tabs
  return [{ id: 'tab_1', name: 'Main', content: note.content ?? '' }]
}

export default function Editor({ note, onNoteUpdated, onToggleFavorite, onToggleSidebar, sidebarOpen, onBack }: EditorProps) {
  const { isSignedIn } = useUser()
  const initialTabs = migrateTabs(note)
  const { local, save, status } = useAutosave(
    note.id,
    { title: note.title, tabs: initialTabs },
    (synced) => onNoteUpdated(note.id, { title: synced.title, content: synced.tabs[0]?.content ?? '' })
  )

  const [activeTabId, setActiveTabId] = useState(initialTabs[0]?.id ?? 'tab_1')
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState('')
  const [starred, setStarred] = useState(note.favorite)
  const [isPublic, setIsPublic] = useState(note.public ?? false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiPanelMode, setAiPanelMode] = useState<'summarize' | 'rewrite'>('summarize')
  const [aiSelection, setAiSelection] = useState<string | undefined>(undefined)
  const [aiSelectionRange, setAiSelectionRange] = useState<{ from: number; to: number } | undefined>(undefined)
  const [autocompleteOn, setAutocompleteOn] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('noteai_autocomplete') === 'true'
  })
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const localTitleRef = useRef(local.title)
  useEffect(() => { localTitleRef.current = local.title })

  // Active tab data
  const tabs = local.tabs.length > 0 ? local.tabs : initialTabs
  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]
  const activeContent = activeTab?.content ?? ''

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
      AutocompleteExtension,
    ],
    immediatelyRender: false,
    content: activeContent,
    editorProps: {
      attributes: { class: 'tiptap-content' },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const updatedTabs = tabs.map(t => t.id === activeTab?.id ? { ...t, content: html } : t)
      save({ tabs: updatedTabs })
      onNoteUpdated(note.id, { title: localTitleRef.current, content: updatedTabs[0]?.content ?? '' })
    },
  })

  // Swap editor content when switching tabs (without triggering onUpdate)
  const prevTabId = useRef(activeTabId)
  useEffect(() => {
    if (!editor || prevTabId.current === activeTabId) return
    prevTabId.current = activeTabId
    const tab = tabs.find(t => t.id === activeTabId)
    editor.commands.setContent(tab?.content ?? '', { emitUpdate: false })
  }, [activeTabId, editor, tabs])

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [local.title])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      save({ title: e.target.value })
      onNoteUpdated(note.id, { title: e.target.value, content: activeContent })
    },
    [note.id, save, onNoteUpdated, activeContent]
  )

  const handleAddTab = () => {
    const newTab = makeTab(`Tab ${tabs.length + 1}`)
    const updatedTabs = [...tabs, newTab]
    save({ tabs: updatedTabs })
    setActiveTabId(newTab.id)
  }

  const handleDeleteTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) return
    const idx = tabs.findIndex(t => t.id === tabId)
    const updatedTabs = tabs.filter(t => t.id !== tabId)
    save({ tabs: updatedTabs })
    if (activeTabId === tabId) {
      setActiveTabId(updatedTabs[Math.max(0, idx - 1)]?.id ?? updatedTabs[0].id)
    }
  }

  const handleTabDoubleClick = (tab: NoteTab) => {
    setEditingTabId(tab.id)
    setEditingTabName(tab.name)
  }

  const commitTabRename = () => {
    if (!editingTabId) return
    const name = editingTabName.trim() || 'Tab'
    const updatedTabs = tabs.map(t => t.id === editingTabId ? { ...t, name } : t)
    save({ tabs: updatedTabs })
    setEditingTabId(null)
  }

  useEffect(() => {
    setAutocompleteEnabled(autocompleteOn)
    localStorage.setItem('noteai_autocomplete', String(autocompleteOn))
  }, [autocompleteOn])

  const openAiPanel = (mode: 'summarize' | 'rewrite', selection?: string, range?: { from: number; to: number }) => {
    setAiPanelMode(mode)
    setAiSelection(selection)
    setAiSelectionRange(range)
    setAiPanelOpen(true)
  }

  const wordCount = (() => {
    const text = stripHtml(activeContent)
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
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 panel-border-b shrink-0">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
              <ChevronLeft size={14} />
            </button>
          ) : !sidebarOpen ? (
            <button onClick={onToggleSidebar} className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
              <PanelLeft size={14} />
            </button>
          ) : null}
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
          <SharePopover noteId={note.id} isPublic={isPublic} onTogglePublic={setIsPublic} />
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

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-3 sm:px-5 pt-2 pb-0 shrink-0 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            onDoubleClick={() => handleTabDoubleClick(tab)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[11.5px] font-medium cursor-pointer select-none shrink-0 border-b-2 transition-all duration-150',
              tab.id === activeTabId
                ? 'border-violet-500 text-violet-400 bg-violet-500/8'
                : 'border-transparent t-muted hover:t-secondary hover:bg-(--bg-surface-hover)'
            )}
          >
            {editingTabId === tab.id ? (
              <input
                autoFocus
                value={editingTabName}
                onChange={e => setEditingTabName(e.target.value)}
                onBlur={commitTabRename}
                onKeyDown={e => { if (e.key === 'Enter') commitTabRename(); if (e.key === 'Escape') setEditingTabId(null) }}
                onClick={e => e.stopPropagation()}
                className="bg-transparent outline-none w-20 text-[11.5px] t-primary"
              />
            ) : (
              <span>{tab.name}</span>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleDeleteTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center rounded hover:text-red-400 transition-all"
              >
                <X size={9} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddTab}
          className="w-6 h-6 flex items-center justify-center rounded-lg app-icon-btn ml-1 shrink-0"
          title="Add tab"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Format toolbar */}
      <FloatingToolbar editor={editor} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-170 mx-auto px-4 sm:px-8 lg:px-10 pt-8 pb-24">
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
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 py-3 flex items-center gap-3 pointer-events-none">
        <span className="text-[10px] t-muted font-mono">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        {note.category && (
          <>
            <span className="t-muted text-[10px]">·</span>
            <span className="text-[10px] t-muted capitalize">{note.category}</span>
          </>
        )}
        {isSignedIn && (
          <button
            onClick={() => setAutocompleteOn(v => !v)}
            title={autocompleteOn ? 'Autocomplete on — click to disable' : 'Autocomplete off — click to enable'}
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono transition-all pointer-events-auto',
              autocompleteOn
                ? 'bg-violet-500/12 text-violet-400/80 border border-violet-500/20'
                : 'surface border border-dim t-muted opacity-60 hover:opacity-100',
            )}
          >
            <Sparkles size={9} />
            AI complete {autocompleteOn ? 'on' : 'off'}
          </button>
        )}
      </div>

      {/* AI button */}
      <div className="absolute bottom-5 right-6 pointer-events-auto z-20">
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => aiPanelOpen ? setAiPanelOpen(false) : openAiPanel('summarize')}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12.5px] font-semibold text-white transition-all duration-200',
            aiPanelOpen
              ? 'bg-linear-to-br from-violet-700 to-indigo-700 shadow-lg shadow-violet-950/60'
              : 'bg-linear-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-950/60 hover:from-violet-500 hover:to-indigo-500',
          )}
        >
          <Sparkles size={13} className="shrink-0" />
          {aiPanelOpen ? 'Close AI' : 'Ask AI'}
        </motion.button>
      </div>

      {/* AI Panel */}
      <AiPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        note={note}
        editor={editor}
        activeContent={activeContent}
        initialMode={aiPanelMode}
        initialSelection={aiSelection}
        initialSelectionRange={aiSelectionRange}
      />

      {/* Selection bubble */}
      <SelectionBubble
        editor={editor}
        onImprove={(text, range) => openAiPanel('rewrite', text, range)}
        onSummarize={(text) => openAiPanel('summarize', text)}
      />
    </motion.div>
  )
}
