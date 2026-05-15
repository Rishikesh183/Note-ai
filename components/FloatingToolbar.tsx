'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { type Editor } from '@tiptap/react'
import { Heading1, Bold, Italic, Code2, Minus, List, ListChecks, Table as TableIcon, Palette, Highlighter, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

const TEXT_COLORS = [
  { label: 'Default', value: null },
  { label: 'Violet',  value: '#a78bfa' },
  { label: 'Blue',    value: '#60a5fa' },
  { label: 'Green',   value: '#34d399' },
  { label: 'Amber',   value: '#fbbf24' },
  { label: 'Red',     value: '#f87171' },
  { label: 'Pink',    value: '#f472b6' },
]

const HIGHLIGHT_COLORS = [
  { label: 'None',   value: null },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green',  value: '#bbf7d0' },
  { label: 'Blue',   value: '#bfdbfe' },
  { label: 'Pink',   value: '#fecaca' },
  { label: 'Purple', value: '#e9d5ff' },
]

function ToolBtn({
  onClick, active, icon: Icon, label,
}: {
  onClick: () => void
  active?: boolean
  icon: React.ElementType
  label: string
}) {
  
  return (
    <div className="relative group">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick() }}
        className={`w-8 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-colors ${
          active ? 'text-violet-400 bg-violet-500/10' : 'app-icon-btn'
        }`}
      >
        <Icon size={13} strokeWidth={2} />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-lg cmd-bg border border-dim text-[10px] t-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-200 shadow-lg">
        {label}
      </div>
    </div>
  )
}

function ColorPopover({
  icon: Icon, title, colors, onSelect,
}: {
  icon: React.ElementType
  title: string
  colors: { label: string; value: string | null }[]
  onSelect: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative group">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o) }}
        className="w-8 h-7 flex items-center justify-center rounded-lg app-icon-btn active:scale-95"
        title={title}
      >
        <Icon size={13} strokeWidth={2} />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-lg cmd-bg border border-dim text-[10px] t-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-400 shadow-lg">
        {title}
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 p-2 rounded-xl cmd-bg border border-dim shadow-xl z-200 flex flex-wrap gap-1.5 w-34">
          {colors.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(value); setOpen(false) }}
              title={label}
              className="w-6 h-6 rounded-md border border-dim flex items-center justify-center transition-transform hover:scale-110"
              style={value ? { background: value } : {}}
            >
              {!value && <span className="text-[9px] t-muted leading-none">✕</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const Sep = () => <div className="w-px h-4 bg-(--border-dim) mx-0.5" />

export default function FloatingToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const inTable = editor.isActive('table')
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
      className="flex flex-col items-center gap-1.5 py-2 shrink-0"
    >
      <div className="w-full px-2 sm:px-6 flex justify-center">
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl surface border border-dim backdrop-blur-xl min-w-max">
        {/* Text formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} label="Heading 1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} label="Bold  ⌘B" />
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} label="Italic  ⌘I" />
        <Sep />
        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} label="Bullet List" />
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} icon={ListChecks} label="Task List" />
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={TableIcon} label="Insert Table" />
        <Sep />
        {/* Color */}
        <ColorPopover
          icon={Palette}
          title="Text Color"
          colors={TEXT_COLORS}
          onSelect={(c) => c
            ? editor.chain().focus().setColor(c).run()
            : editor.chain().focus().unsetColor().run()
          }
        />
        <ColorPopover
          icon={Highlighter}
          title="Highlight"
          colors={HIGHLIGHT_COLORS}
          onSelect={(c) => c
            ? editor.chain().focus().setHighlight({ color: c }).run()
            : editor.chain().focus().unsetHighlight().run()
          }
        />
        <Sep />
        {/* Code / divider */}
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} icon={Code2} label="Inline Code" />
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} label="Divider" />

        <div className="w-px h-4 bg-(--border-dim) mx-1" />
        <div className="px-2 text-[10px] t-muted font-mono tracking-tight">{isMac ? '⌘K' : 'Ctrl+K'}</div>
      </div>
      </div>

      {/* Table context toolbar — only when cursor is inside a table */}
      {inTable && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-0.5 px-2 py-1 rounded-xl surface border border-dim backdrop-blur-xl"
        >
          <span className="text-[9px] t-muted font-mono uppercase tracking-widest px-1 mr-0.5">Rows</span>
          <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} icon={ArrowUp}    label="Add Row Above" />
          <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()}  icon={ArrowDown}  label="Add Row Below" />
          <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()}    icon={Trash2}     label="Delete Row" />
          <Sep />
          <span className="text-[9px] t-muted font-mono uppercase tracking-widest px-1 mr-0.5">Cols</span>
          <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} icon={ArrowLeft}  label="Add Column Left" />
          <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()}  icon={ArrowRight} label="Add Column Right" />
          <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()}    icon={Trash2}     label="Delete Column" />
          <Sep />
          <ToolBtn
            onClick={() => editor.chain().focus().deleteTable().run()}
            icon={Trash2}
            label="Delete Table"
          />
        </motion.div>
      )}
    </motion.div>
  )
}
