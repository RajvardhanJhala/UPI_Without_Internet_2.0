import { useState } from 'react'
import { RefreshCw, CloudUpload, RotateCcw } from 'lucide-react'
import { api, type FlushUploadResult } from '../lib/api'
import { StatusBadge } from './StatusBadge'

interface Props {
  busy: boolean
  setBusy: (b: boolean) => void
  onDone: (message: string) => void
  onError: (message: string) => void
}

/**
 * Steps 2–3 — gossip the packet across the mesh, then have every bridge node
 * upload to the backend at once (the duplicate-storm moment), plus reset.
 */
export function PipelineControls({ busy, setBusy, onDone, onError }: Props) {
  const [lastFlush, setLastFlush] = useState<FlushUploadResult[] | null>(null)

  const run = async (fn: () => Promise<string>) => {
    setBusy(true)
    try {
      onDone(await fn())
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const gossip = () =>
    run(async () => {
      const r = await api.gossip()
      return `Gossip round: ${r.transfers} packet transfer${r.transfers === 1 ? '' : 's'} between devices`
    })

  const flush = () =>
    run(async () => {
      const r = await api.flush()
      setLastFlush(r.results)
      const settled = r.results.filter((x) => x.outcome === 'SETTLED').length
      return `Bridges uploaded ${r.uploadsAttempted} packet(s): ${settled} settled, ${r.uploadsAttempted - settled} deduped/rejected`
    })

  const reset = () =>
    run(async () => {
      await api.reset()
      setLastFlush(null)
      return 'Mesh and idempotency cache cleared'
    })

  const btn =
    'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          2
        </span>
        Spread it, then reach the internet
      </h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={gossip}
          disabled={busy}
          className={`${btn} border border-edge bg-surface2 text-ink hover:border-accent/60 hover:text-accent`}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Run gossip round
        </button>
        <button
          onClick={flush}
          disabled={busy}
          className={`${btn} bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent-deep`}
        >
          <CloudUpload size={15} aria-hidden="true" />
          Bridges upload to backend
        </button>
        <button
          onClick={reset}
          disabled={busy}
          className={`${btn} border border-transparent text-danger hover:border-danger/30 hover:bg-danger/10`}
        >
          <RotateCcw size={15} aria-hidden="true" />
          Reset demo
        </button>
      </div>

      {lastFlush && lastFlush.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-xs font-semibold tracking-wide text-muted uppercase">Last upload results</div>
          {lastFlush.map((r, i) => (
            <div
              key={`${r.packetId}-${r.bridgeNode}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md border border-edge bg-bg px-2.5 py-1.5"
            >
              <span className="truncate font-mono text-xs text-muted">
                {r.bridgeNode} · pkt {r.packetId}
              </span>
              <StatusBadge outcome={r.outcome} />
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted">
        Each gossip round copies packets phone-to-phone, decrementing TTL. When a phone with
        internet uploads, the backend dedupes by ciphertext hash — the same payment settles
        exactly once no matter how many bridges deliver it.
      </p>
    </div>
  )
}
