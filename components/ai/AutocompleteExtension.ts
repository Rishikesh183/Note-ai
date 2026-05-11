import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

interface AutocompleteState {
  suggestion: string
  from: number
}

export const AUTOCOMPLETE_KEY = new PluginKey<AutocompleteState>('autocomplete')

// Module-level flag — off by default, toggled by user
let _autocompleteEnabled = false
export function setAutocompleteEnabled(v: boolean) { _autocompleteEnabled = v }

export const AutocompleteExtension = Extension.create({
  name: 'autocomplete',

  addOptions() {
    return {
      debounceMs: parseInt(
        typeof process !== 'undefined' ? (process.env.AI_AUTOCOMPLETE_DEBOUNCE_MS ?? '600') : '600',
        10,
      ),
      enabled: true,
    }
  },

  addProseMirrorPlugins() {
    let timer: ReturnType<typeof setTimeout> | null = null
    const debounceMs = this.options.debounceMs as number

    return [
      new Plugin({
        key: AUTOCOMPLETE_KEY,

        state: {
          init: (): AutocompleteState => ({ suggestion: '', from: 0 }),
          apply(tr, val): AutocompleteState {
            const meta = tr.getMeta(AUTOCOMPLETE_KEY) as AutocompleteState | undefined
            if (meta !== undefined) return meta
            if (tr.docChanged) return { suggestion: '', from: 0 }
            return val
          },
        },

        props: {
          decorations(state) {
            const { suggestion, from } = AUTOCOMPLETE_KEY.getState(state)!
            if (!suggestion || !from) return DecorationSet.empty

            const pos = Math.min(from, state.doc.content.size)
            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement('span')
                span.className = 'autocomplete-ghost'
                span.textContent = suggestion
                return span
              },
              { side: 1 },
            )
            return DecorationSet.create(state.doc, [widget])
          },

          handleKeyDown(view, event) {
            const st = AUTOCOMPLETE_KEY.getState(view.state)!
            if (!st.suggestion) return false

            if (event.key === 'Tab') {
              event.preventDefault()
              const tr = view.state.tr
                .insertText(st.suggestion, st.from)
                .setMeta(AUTOCOMPLETE_KEY, { suggestion: '', from: 0 })
              view.dispatch(tr)
              return true
            }

            if (event.key === 'Escape') {
              view.dispatch(
                view.state.tr.setMeta(AUTOCOMPLETE_KEY, { suggestion: '', from: 0 }),
              )
              return false
            }

            return false
          },
        },

        view(_editorView) {
          return {
            update(view) {
              if (!_autocompleteEnabled) return
              const { selection } = view.state
              if (!selection.empty) return

              const { from } = selection
              const text = view.state.doc.textBetween(0, from, '\n', '')
              if (!text || text.trim().split(/\s+/).length < 3) return

              if (timer) clearTimeout(timer)
              timer = setTimeout(async () => {
                try {
                  const res = await fetch('/api/ai/autocomplete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                  })
                  if (!res.ok) return
                  const { suggestion } = (await res.json()) as { suggestion: string }
                  if (!suggestion) return
                  if (view.isDestroyed || view.state.selection.from !== from) return
                  view.dispatch(
                    view.state.tr.setMeta(AUTOCOMPLETE_KEY, { suggestion, from }),
                  )
                } catch { /* silent */ }
              }, debounceMs)
            },
            destroy() {
              if (timer) clearTimeout(timer)
            },
          }
        },
      }),
    ]
  },
})
