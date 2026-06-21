import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import ShareNoteView from '@/components/ShareNoteView'
import { Sparkles, Clock, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ userId: string; noteId: string }>
}

export default async function SharePage({ params }: Props) {
  const { userId, noteId } = await params

  const snap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('notes')
    .doc(noteId)
    .get()

  if (!snap.exists) notFound()

  const data = snap.data()!
  if (!data.public) notFound()

  const title     = data.title   ?? 'Untitled'
  const content   = data.content ?? ''
  const updatedAt = data.updatedAt?.toDate?.()?.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) ?? ''

  return (
    <div className="min-h-screen app-bg overflow-y-auto" style={{ height: '100dvh' }}>
      {/* Nav bar */}
      <header className="sticky top-0 z-10 panel-bg panel-border-b backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold t-primary">NoteAI</span>
          </div>
          <div className="flex items-center gap-1.5 t-muted">
            <Globe size={11} />
            <span className="text-[11px] font-mono">Public Note</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <h1 className="text-[32px] font-bold t-primary leading-tight mb-4">{title}</h1>

        {updatedAt && (
          <div className="flex items-center gap-1.5 t-muted mb-10">
            <Clock size={11} />
            <span className="text-[11px] font-mono">Last updated {updatedAt}</span>
          </div>
        )}

        <div className="h-px bg-linear-to-r from-(--border-dim) to-transparent mb-10" />

        <ShareNoteView content={content} />
      </main>
    </div>
  )
}
