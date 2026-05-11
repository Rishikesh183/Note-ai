'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Star, Sparkles, Clock, Trash2,
  Plus, ChevronLeft, ChevronRight, Command, Zap,
} from 'lucide-react'
import { NavItem } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { id: 'all'       as NavItem, label: 'All Notes',     icon: FileText  },
  { id: 'favorites' as NavItem, label: 'Favorites',     icon: Star      },
  { id: 'ai'        as NavItem, label: 'AI Workspace',  icon: Sparkles, special: true },
  { id: 'recent'    as NavItem, label: 'Recent',        icon: Clock     },
  { id: 'trash'     as NavItem, label: 'Trash',         icon: Trash2    },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
  activeNav: NavItem
  onNavChange: (nav: NavItem) => void
  onNewNote: () => void
  onOpenCommandPalette: () => void
}

export default function Sidebar({
  open, onToggle, activeNav, onNavChange, onNewNote, onOpenCommandPalette,
}: SidebarProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? 232 : 58 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="h-full flex flex-col panel-bg panel-border-r relative z-20 shrink-0 overflow-hidden"
    >
      {/* Logo + toggle */}
      <div className={cn('flex items-center py-4 px-3.5 mb-1', open ? 'justify-between' : 'justify-center')}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-[9px] bg-linear-to-br from-violet-500 to-indigo-700 flex items-center justify-center shrink-0 shadow-lg shadow-violet-950/30">
            <Zap size={13} className="text-white" fill="white" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.14 }}
                className="text-[13.5px] font-bold t-primary tracking-tight truncate"
              >
                NoteAI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {open && (
          <button onClick={onToggle} className="w-6 h-6 rounded-md flex items-center justify-center app-icon-btn shrink-0">
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {!open && (
        <button onClick={onToggle} className="mx-auto mb-2 w-7 h-7 rounded-lg flex items-center justify-center app-icon-btn">
          <ChevronRight size={13} />
        </button>
      )}

      {/* Command palette trigger */}
      <div className={cn('px-2.5 mb-3', !open && 'px-1.5')}>
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            'w-full flex items-center gap-2 rounded-xl border surface-btn transition-all duration-150',
            open ? 'px-2.5 py-2' : 'justify-center p-2'
          )}
        >
          {isMac ? <Command size={12} className="shrink-0" /> : <span className="text-[10px] font-mono"></span>}
          {/* <Command size={12} className="shrink-0" /> */}
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11.5px] flex-1 text-left"
              >
                Commands
              </motion.span>
            )}
          </AnimatePresence>
          {open && <kbd className="text-[9.5px] font-mono t-muted tracking-tighter">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>}
        </button>
      </div>

      {open && (
        <div className="px-4 mb-1">
          <span className="text-[9.5px] font-semibold t-muted uppercase tracking-widest">Library</span>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 space-y-0.5', open ? 'px-2.5' : 'px-1.5')}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              title={!open ? item.label : undefined}
              className={cn(
                'w-full flex items-center rounded-xl text-[12.5px] transition-all duration-150 relative group',
                open ? 'gap-2.5 px-2.5 py-2' : 'justify-center p-2',
                isActive ? 'nav-active' : 'app-icon-btn'
              )}
            >
              <Icon
                size={14}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={cn('shrink-0', isActive ? 'text-violet-400' : '')}
              />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium tracking-tight flex-1 text-left truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {open && item.special && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/18 text-violet-400/80 font-semibold tracking-wide">AI</span>
              )}
              {isActive && open && (
                <motion.div layoutId="nav-indicator" className="absolute right-2 w-1 h-4 rounded-full bg-violet-400/70" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: theme toggle + new note */}
      <div className={cn('border-t border-dim p-2.5 space-y-1.5', !open && 'p-1.5')}>
        <div className={cn('flex', open ? 'justify-start px-0.5' : 'justify-center')}>
          <ThemeToggle />
        </div>

        <motion.button
          onClick={onNewNote}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full flex items-center rounded-xl text-[12.5px] font-semibold text-white transition-all duration-200',
            'bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600',
            'shadow-md shadow-violet-950/40',
            open ? 'gap-2 px-3 py-2.5 justify-start' : 'justify-center p-2.5'
          )}
        >
          <Plus size={14} strokeWidth={2.5} className="shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                New Note
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}
