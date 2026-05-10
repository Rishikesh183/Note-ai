'use client'

import { motion } from 'framer-motion'
import { Star, Trash2 } from 'lucide-react'
import { Note } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: Note
  selected: boolean
  onClick: () => void
  onDelete?: () => void
}

export default function NoteCard({ note, selected, onClick, onDelete }: NoteCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.008 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'w-full text-left px-3.5 py-3 rounded-xl mb-0.5 transition-all duration-200 relative group border',
        selected
          ? 'bg-violet-500/9 border-violet-500/18 shadow-[0_0_20px_rgba(124,106,247,0.07)]'
          : 'border-transparent note-card-hover border-dim'
      )}
    >
      {selected && (
        <motion.div
          layoutId="card-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-7 rounded-r-full bg-violet-400"
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-1">
        <h3
          className={cn(
            'text-[12.5px] font-semibold leading-snug truncate flex-1',
            selected ? 'text-violet-800' : 't-primary'
          )}
        >
          {note.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {note.favorite && (
            <Star size={10} className="text-amber-400/70 fill-amber-400/70" />
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-4 h-4 flex items-center justify-center rounded text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
              title="Delete note"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] t-muted leading-relaxed line-clamp-2 mb-2">
        {note.preview}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] t-muted font-mono">{note.updatedAt}</span>
        {note.wordCount ? (
          <span className="text-[10px] t-muted">{note.wordCount.toLocaleString()} w</span>
        ) : null}
      </div>
    </motion.button>
  )
}
