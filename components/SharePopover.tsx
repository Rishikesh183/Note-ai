'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Lock, Globe, Copy, Check, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface SharePopoverProps {
  noteId: string
  isPublic: boolean
  onTogglePublic: (next: boolean) => void
}

export default function SharePopover({ noteId, isPublic, onTogglePublic }: SharePopoverProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'private' | 'public' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const copy = (type: 'private' | 'public') => {
    const base = window.location.origin
    const url = type === 'public'
      ? `${base}/share/${user?.id}/${noteId}`
      : `${base}/?note=${noteId}`
    navigator.clipboard.writeText(url)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleTogglePublic = async (next: boolean) => {
    await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public: next }),
    })
    onTogglePublic(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn"
        title="Share"
      >
        <Share2 size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 cmd-bg border border-md rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dim">
              <span className="text-[12.5px] font-semibold t-primary">Share Note</span>
              <button onClick={() => setOpen(false)} className="app-icon-btn w-5 h-5 flex items-center justify-center rounded">
                <X size={12} />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {/* Private link */}
              <div className="p-3 rounded-xl surface border border-dim">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Lock size={13} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold t-primary leading-tight">Private Link</p>
                    <p className="text-[10.5px] t-muted mt-0.5">Only accessible when signed in</p>
                  </div>
                </div>
                <button
                  onClick={() => copy('private')}
                  className="w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-medium surface-btn border transition-all"
                >
                  {copied === 'private' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  {copied === 'private' ? 'Copied!' : 'Copy Private Link'}
                </button>
              </div>

              {/* Public link */}
              <div className="p-3 rounded-xl surface border border-dim">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isPublic ? 'bg-emerald-500/10' : 'bg-(--bg-surface)'}`}>
                    <Globe size={13} className={isPublic ? 'text-emerald-400' : 't-muted'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold t-primary leading-tight">Public Link</p>
                    <p className="text-[10.5px] t-muted mt-0.5">Anyone with the link can view</p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleTogglePublic(!isPublic)}
                    className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${isPublic ? 'bg-emerald-500' : 'bg-(--border-md)'}`}
                  >
                    <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200 ${isPublic ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
                <button
                  onClick={() => { if (!isPublic) handleTogglePublic(true); copy('public') }}
                  disabled={false}
                  className={`w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-medium transition-all ${
                    isPublic
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15'
                      : 'surface-btn border'
                  }`}
                >
                  {copied === 'public' ? <Check size={11} /> : <Copy size={11} />}
                  {copied === 'public' ? 'Copied!' : isPublic ? 'Copy Public Link' : 'Enable & Copy Link'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
