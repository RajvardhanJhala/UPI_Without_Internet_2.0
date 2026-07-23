import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

export interface LogEntry {
  id: number
  at: string
  kind: 'info' | 'ok' | 'warn' | 'error'
  text: string
}

const KIND_CLASS: Record<LogEntry['kind'], string> = {
  info: 'text-console',
  ok: 'text-ok',
  warn: 'text-warn',
  error: 'text-danger',
}

export function EventLog({ entries }: { entries: LogEntry[] }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div className="card p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <Terminal size={14} className="text-accent" aria-hidden="true" />
        Event log
      </h3>
      <div
        ref={boxRef}
        className="max-h-52 overflow-y-auto rounded-md border border-edge bg-[#010409] p-3 font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 && <div className="text-muted">Waiting for activity…</div>}
        {entries.map((e) => (
          <div key={e.id} className={KIND_CLASS[e.kind]}>
            <span className="text-muted">[{e.at}]</span> {e.text}
          </div>
        ))}
      </div>
    </div>
  )
}
