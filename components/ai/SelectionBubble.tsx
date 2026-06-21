'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, FileText } from 'lucide-react'
import type { Editor } from '@tiptap/react'

interface Props {
  editor: Editor | null
  onImprove: (text: string, range?: { from: number; to: number }) => void
  onSummarize: (text: string) => void
}

export default function SelectionBubble({ editor, onImprove, onSummarize }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [selText, setSelText] = useState('')

  const [selRange, setSelRange] = useState<{ from: number; to: number } | null>(null)

  const update = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    if (from === to) { setPos(null); return }

    const text = editor.state.doc.textBetween(from, to, ' ').trim()
    if (text.length < 10) { setPos(null); return }

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { setPos(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (!rect.width) { setPos(null); return }

    setSelText(text)
    setSelRange({ from, to })
    setPos({
      top: rect.top - 8,
      left: Math.min(
        Math.max(rect.left + rect.width / 2, 100),
        window.innerWidth - 100,
      ),
    })
  }, [editor])

  const hide = useCallback(() => {
    setTimeout(() => setPos(null), 120)
  }, [])

  useEffect(() => {
    if (!editor) return
    editor.on('selectionUpdate', update)
    editor.on('blur', hide)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('blur', hide)
    }
  }, [editor, update, hide])

  return (
    <AnimatePresence>
      {pos && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.94 }}
          transition={{ duration: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 60,
          }}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl cmd-bg border border-dim shadow-2xl shadow-black/40 backdrop-blur-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={() => { onImprove(selText, selRange ?? undefined); setPos(null) }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium app-icon-btn transition-colors"
          >
            <Wand2 size={11} className="text-violet-400" />
            Improve
          </button>
          <div className="w-px h-3 bg-(--border-dim)" />
          <button
            onClick={() => { onSummarize(selText); setPos(null) }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium app-icon-btn transition-colors"
          >
            <FileText size={11} className="text-blue-400" />
            Summarize
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
