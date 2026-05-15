'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, RefreshCw, FileText, Settings, ChevronLeft } from 'lucide-react'
import type { Note } from '@/lib/mock-data'
import AiSettingsModal from './AiSettingsModal'

interface Source { id: string; title: string }
interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

interface Props {
  notes: Note[]
  onSelectNote: (note: Note) => void
  onClose?: () => void
}

const SUGGESTIONS = [
  'What were my key decisions this week?',
  'Summarize my recent meeting notes',
  'What are my current project priorities?',
  'Find notes about design decisions',
]

export default function AiWorkspace({ notes, onSelectNote, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const submit = useCallback(async (q: string) => {
    const question = q.trim()
    if (!question || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))

    // placeholder for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: `Error: ${err.error}` }
          return copy
        })
        return
      }

      const sourcesHeader = res.headers.get('X-Sources')
      const sources: Source[] = sourcesHeader ? JSON.parse(sourcesHeader) : []

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value)
        setMessages(prev => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, content: last.content + chunk, sources }
          return copy
        })
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: `Error: ${(err as Error).message}` }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  return (
    <div className="w-full md:w-72 shrink-0 h-full flex flex-col panel-bg panel-border-r">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 panel-border-b shrink-0">
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center app-icon-btn md:hidden">
              <ChevronLeft size={13} />
            </button>
          )}
          <div className="w-6 h-6 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold t-primary">Ask Notes</span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] font-mono t-muted">{notes.length} notes</span>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-1.5 w-6 h-6 rounded-lg flex items-center justify-center app-icon-btn"
          >
            <Settings size={11} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-[11.5px] t-muted text-center pt-4 pb-2">
              Ask anything across your {notes.length} notes
            </p>
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => submit(s)}
                className="w-full text-left px-3 py-2.5 rounded-xl surface border border-dim text-[11.5px] t-secondary hover:border-violet-500/30 hover:text-violet-300/80 transition-all duration-150"
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={msg.role === 'user' ? 'flex justify-end' : 'flex flex-col gap-1.5'}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[88%] px-3 py-2 rounded-2xl rounded-tr-sm bg-violet-600/20 border border-violet-500/20 text-[12.5px] t-primary">
                  {msg.content}
                </div>
              ) : (
                <>
                  <div className="text-[12.5px] t-secondary leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {loading && i === messages.length - 1 && !msg.content && (
                      <span className="flex items-center gap-1 py-1">
                        {[0, 1, 2].map(j => (
                          <motion.span
                            key={j}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                          />
                        ))}
                      </span>
                    )}
                    {loading && i === messages.length - 1 && msg.content && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="inline-block w-0.5 h-3 bg-violet-400 ml-0.5 align-middle"
                      />
                    )}
                  </div>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.sources.map(s => {
                        const note = notes.find(n => n.id === s.id)
                        return (
                          <button
                            key={s.id}
                            onClick={() => note && onSelectNote(note)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg surface border border-dim text-[10.5px] t-muted hover:text-violet-400 hover:border-violet-500/30 transition-all"
                          >
                            <FileText size={9} />
                            {s.title.length > 22 ? s.title.slice(0, 22) + '…' : s.title}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 py-1">
            <RefreshCw size={11} className="text-violet-400 animate-spin" />
            <span className="text-[11px] t-muted">Searching notes…</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-4 pt-2 border-t border-dim shrink-0">
        <div className="flex items-end gap-2 px-3 py-2 rounded-2xl surface border border-dim focus-within:border-violet-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your notes…"
            rows={1}
            className="flex-1 bg-transparent text-[12.5px] t-primary resize-none outline-none leading-relaxed"
          />
          <button
            onClick={() => submit(input)}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-[10px] t-muted text-center mt-1.5">↵ send · Shift+↵ newline</p>
      </div>

      <AiSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
