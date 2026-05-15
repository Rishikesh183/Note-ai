'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Wand2, Copy, RefreshCw, ChevronDown, Check, Settings } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { Note } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import AiSettingsModal from './AiSettingsModal'

type Mode = 'summarize' | 'rewrite'

interface Props {
  isOpen: boolean
  onClose: () => void
  note: Note | null
  editor: Editor | null
  initialMode?: Mode
  initialSelection?: string
}

function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

export default function AiPanel({ isOpen, onClose, note, editor, initialMode = 'summarize', initialSelection }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [replaced, setReplaced] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // Apply initialMode/selection when panel opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setOutput('')
      setDone(false)
    }
  }, [isOpen, initialMode])

  const run = useCallback(async (m: Mode) => {
    if (!note) return
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setOutput('')
    setLoading(true)
    setDone(false)
    setReplaced(false)

    const endpoint = m === 'summarize' ? '/api/ai/summarize' : '/api/ai/rewrite'
    const body: Record<string, string> =
      m === 'summarize' && initialSelection
        ? { title: 'Selection', content: initialSelection }
        : m === 'rewrite' && initialSelection
        ? { title: note.title, content: note.content, selection: initialSelection }
        : { title: note.title, content: note.content }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setOutput(`Error: ${err.error ?? 'Unknown error'}`)
        return
      }
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done: d, value } = await reader.read()
        if (d) break
        setOutput(prev => prev + dec.decode(value))
      }
      setDone(true)
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setOutput(`Error: ${(err as Error).message}`)
      }
    } finally {
      setLoading(false)
    }
  }, [note, initialSelection])

  const handleModeSwitch = (m: Mode) => {
    setMode(m)
    setOutput('')
    setDone(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleReplace = () => {
    if (!editor || !output) return
    editor.commands.setContent(textToHtml(output))
    setReplaced(true)
    setTimeout(() => setReplaced(false), 1800)
  }

  const handleInsertBelow = () => {
    if (!editor || !output) return
    editor.commands.focus('end')
    editor.commands.insertContent('<hr/>' + textToHtml(output))
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-80 z-30 flex flex-col cmd-bg border-l border-dim shadow-2xl shadow-black/30 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dim shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles size={11} className="text-white" />
                </div>
                <span className="text-[13px] font-semibold t-primary">AI Assistant</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn"
                  title="AI Settings"
                >
                  <Settings size={13} />
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 px-4 py-2.5 border-b border-dim shrink-0">
              {(['summarize', 'rewrite'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => handleModeSwitch(m)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 capitalize',
                    mode === m
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                      : 'app-icon-btn',
                  )}
                >
                  {m === 'summarize' ? <Sparkles size={11} /> : <Wand2 size={11} />}
                  {m}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => run(mode)}
                disabled={loading || !note}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold text-white transition-all duration-200',
                  'bg-linear-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500',
                  'shadow-md shadow-violet-950/40 disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw size={13} />
                  </motion.div>
                ) : (
                  <Sparkles size={13} />
                )}
                {loading
                  ? 'Generating…'
                  : mode === 'summarize'
                  ? 'Summarize Note'
                  : initialSelection
                  ? 'Improve Selection'
                  : 'Rewrite Note'}
              </motion.button>
            </div>

            {/* Output area */}
            <div ref={outputRef} className="flex-1 overflow-y-auto px-4 py-2">
              {!output && !loading && (
                <div className="h-full flex flex-col items-center justify-center gap-2 py-8">
                  <div className="w-10 h-10 rounded-2xl surface flex items-center justify-center">
                    {mode === 'summarize' ? (
                      <Sparkles size={16} className="t-muted" />
                    ) : (
                      <Wand2 size={16} className="t-muted" />
                    )}
                  </div>
                  <p className="text-[12px] t-muted text-center">
                    {mode === 'summarize'
                      ? 'Click to generate a concise summary'
                      : initialSelection
                      ? 'Click to improve the selected text'
                      : 'Click to enhance the entire note'}
                  </p>
                </div>
              )}

              {loading && !output && (
                <div className="flex items-center gap-2 py-4">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}

              {output && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[13px] t-secondary leading-relaxed whitespace-pre-wrap"
                >
                  {output}
                  {loading && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 align-middle"
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Action buttons */}
            <AnimatePresence>
              {done && output && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="px-4 pb-4 pt-2 border-t border-dim shrink-0 space-y-2"
                >
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl surface-btn border text-[12px] font-medium transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>

                  {mode === 'rewrite' && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleReplace}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all"
                      >
                        {replaced ? <Check size={12} /> : null}
                        {replaced ? 'Replaced!' : 'Replace Note'}
                      </button>
                      <button
                        onClick={handleInsertBelow}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-medium surface-btn border transition-all"
                      >
                        <ChevronDown size={12} />
                        Insert Below
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AiSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
