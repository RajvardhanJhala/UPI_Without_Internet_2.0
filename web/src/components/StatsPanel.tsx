import type { Stats } from '../lib/api'

const DOT = {
  neutral: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
} as const

interface TileProps {
  label: string
  value: number
  tone: keyof typeof DOT
  hint: string
}

function Tile({ label, value, tone, hint }: TileProps) {
  return (
    <div className="card p-4" title={hint}>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value.toLocaleString('en-IN')}</div>
    </div>
  )
}

/** KPI row over every packet the backend has ever been handed. */
export function StatsPanel({ stats }: { stats: Stats | null }) {
  const o = stats?.outcomes
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Tile
        label="Packets ingested"
        value={stats?.total ?? 0}
        tone="neutral"
        hint="Every delivery attempt the backend has received"
      />
      <Tile
        label="Settled"
        value={o?.settled ?? 0}
        tone="ok"
        hint="Decrypted, verified fresh, and posted to the ledger"
      />
      <Tile
        label="Duplicates dropped"
        value={o?.duplicateDropped ?? 0}
        tone="warn"
        hint="Same ciphertext delivered again — caught by the idempotency gate"
      />
      <Tile
        label="Rejected"
        value={o?.rejected ?? 0}
        tone="danger"
        hint="Valid packet, but the sender lacked funds at settlement time"
      />
      <Tile
        label="Invalid"
        value={o?.invalid ?? 0}
        tone="danger"
        hint="Tampered, stale, or undecryptable — refused before touching the ledger"
      />
    </div>
  )
}
