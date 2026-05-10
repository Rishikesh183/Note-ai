'use client'

import { motion } from 'framer-motion'
import { Heading1, Bold, Italic, CheckSquare, Code2, Minus } from 'lucide-react'

const TOOLS = [
  { icon: Heading1,    label: 'Heading',   shortcut: '⌘⇧1' },
  { icon: Bold,        label: 'Bold',      shortcut: '⌘B'  },
  { icon: Italic,      label: 'Italic',    shortcut: '⌘I'  },
  { icon: CheckSquare, label: 'Checklist', shortcut: '⌘⇧C' },
  { icon: Code2,       label: 'Code',      shortcut: '⌘E'  },
  { icon: Minus,       label: 'Divider',   shortcut: '---' },
]

export default function FloatingToolbar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
      className="flex justify-center px-6 py-2 shrink-0"
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl surface border border-dim backdrop-blur-xl">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon
          return (
            <div key={i} className="relative group">
              <button
                type="button"
                className="w-8 h-7 flex items-center justify-center rounded-lg app-icon-btn active:scale-95"
              >
                <Icon size={13} strokeWidth={2} />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 rounded-lg cmd-bg border border-dim text-[10px] t-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                {tool.label}
                <span className="ml-2 font-mono t-muted">{tool.shortcut}</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-(--bg-cmd)" />
              </div>
            </div>
          )
        })}

        <div className="w-px h-4 bg-(--border-dim) mx-1.5" />
        <div className="px-2 text-[10px] t-muted font-mono tracking-tight">⌘K</div>
      </div>
    </motion.div>
  )
}
