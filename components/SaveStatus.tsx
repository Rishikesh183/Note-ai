'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, FileText, Loader2, CloudOff } from 'lucide-react'
import { SaveStatus } from '@/hooks/useAutosave'

const CONFIG: Record<SaveStatus, { icon: React.ElementType; label: string; cls: string }> = {
  saved:   { icon: Check,      label: 'Saved',         cls: 'text-emerald-400/70' },
  draft:   { icon: FileText,   label: 'Draft',         cls: 'text-amber-400/70'   },
  saving:  { icon: Loader2,    label: 'Saving...',     cls: 'text-violet-400/70'  },
  offline: { icon: CloudOff,   label: 'Offline Draft', cls: 'text-rose-400/70'   },
}

export default function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const { icon: Icon, label, cls } = CONFIG[status]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center gap-1.5 text-[10px] font-mono select-none ${cls}`}
      >
        <Icon size={11} className={status === 'saving' ? 'animate-spin' : ''} />
        <span>{label}</span>
      </motion.div>
    </AnimatePresence>
  )
}
