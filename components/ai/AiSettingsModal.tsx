'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, Check, Trash2, ChevronDown } from 'lucide-react'
import type { AIProvider } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

const PROVIDERS: { id: AIProvider; label: string; placeholder: string; modelPlaceholder: string }[] = [
  { id: 'gemini', label: 'Gemini', placeholder: 'AIza...', modelPlaceholder: 'gemini-1.5-flash' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', modelPlaceholder: 'gpt-4o-mini' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...', modelPlaceholder: 'llama-3.3-70b-versatile' },
  { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...', modelPlaceholder: 'google/gemini-flash-1.5' },
  { id: 'custom', label: 'Custom (OpenAI-compat.)', placeholder: 'your-api-key', modelPlaceholder: 'model-name' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AiSettingsModal({ isOpen, onClose }: Props) {
  const [configured, setConfigured] = useState<AIProvider[]>([])
  const [active, setActive] = useState<AIProvider | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState<AIProvider | null>(null)
  const [showProviderDropdown, setShowProviderDropdown] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/user/ai-keys')
      .then(r => r.json())
      .then(d => { setConfigured(d.configured ?? []); setActive(d.activeProvider) })
      .catch(() => {})
  }, [isOpen])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await fetch('/api/user/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, apiKey, model: model || undefined, baseUrl: baseUrl || undefined }),
      })
      setSaved(true)
      setConfigured(prev => [...new Set([...prev, selectedProvider])])
      setActive(selectedProvider)
      setApiKey('')
      setModel('')
      setBaseUrl('')
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: AIProvider) => {
    setDeleting(p)
    try {
      await fetch('/api/user/ai-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: p }),
      })
      setConfigured(prev => prev.filter(x => x !== p))
      if (active === p) setActive(null)
    } finally {
      setDeleting(null)
    }
  }

  const providerInfo = PROVIDERS.find(p => p.id === selectedProvider)!

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="w-full max-w-md pointer-events-auto cmd-bg border border-dim rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-dim">
                <div className="flex items-center gap-2.5">
                  <Key size={14} className="text-violet-400" />
                  <span className="text-[14px] font-semibold t-primary">AI Provider Keys</span>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
                  <X size={13} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Configured providers */}
                {configured.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10.5px] font-semibold t-muted uppercase tracking-widest">Configured</p>
                    {configured.map(p => (
                      <div key={p} className="flex items-center justify-between px-3 py-2 rounded-xl surface border border-dim">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-[12.5px] t-primary capitalize">{PROVIDERS.find(x => x.id === p)?.label ?? p}</span>
                          {active === p && (
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-semibold">Active</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p}
                          className="w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn text-red-400/70 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add key form */}
                <div className="space-y-3">
                  <p className="text-[10.5px] font-semibold t-muted uppercase tracking-widest">Add / Update Key</p>

                  {/* Provider select */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProviderDropdown(o => !o)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl surface border border-dim text-[12.5px] t-primary"
                    >
                      {PROVIDERS.find(p => p.id === selectedProvider)?.label}
                      <ChevronDown size={12} className="t-muted" />
                    </button>
                    <AnimatePresence>
                      {showProviderDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full mt-1 w-full cmd-bg border border-dim rounded-xl shadow-xl z-10 overflow-hidden"
                        >
                          {PROVIDERS.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setSelectedProvider(p.id); setShowProviderDropdown(false) }}
                              className={cn(
                                'w-full text-left px-3 py-2.5 text-[12.5px] transition-colors',
                                selectedProvider === p.id ? 't-primary surface' : 't-secondary hover:bg-(--bg-surface)',
                              )}
                            >
                              {p.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={`API Key (${providerInfo.placeholder})`}
                    className="w-full px-3 py-2.5 rounded-xl surface border border-dim text-[12.5px] t-primary bg-transparent outline-none focus:border-violet-500/40 transition-colors"
                  />
                  <input
                    type="text"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder={`Model (default: ${providerInfo.modelPlaceholder})`}
                    className="w-full px-3 py-2.5 rounded-xl surface border border-dim text-[12.5px] t-primary bg-transparent outline-none focus:border-violet-500/40 transition-colors"
                  />
                  {selectedProvider === 'custom' && (
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={e => setBaseUrl(e.target.value)}
                      placeholder="Base URL (e.g. http://localhost:11434/v1)"
                      className="w-full px-3 py-2.5 rounded-xl surface border border-dim text-[12.5px] t-primary bg-transparent outline-none focus:border-violet-500/40 transition-colors"
                    />
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving || !apiKey.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saved ? <Check size={13} /> : <Key size={13} />}
                    {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Key'}
                  </button>
                </div>

                <p className="text-[11px] t-muted text-center">
                  Keys are encrypted with AES-256-GCM before storage. Never exposed to the client.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
