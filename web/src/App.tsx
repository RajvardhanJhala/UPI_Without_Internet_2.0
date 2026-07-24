import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Radio } from 'lucide-react'
import { api, type Account, type MeshState, type Stats, type Transaction } from './lib/api'
import { useMeshEvents, type MeshEvent } from './hooks/useMeshEvents'
import { useTheme } from './hooks/useTheme'
import { MeshBackground } from './components/MeshBackground'
import { ThemeToggle } from './components/ThemeToggle'
import { ComposePayment } from './components/ComposePayment'
import { PipelineControls } from './components/PipelineControls'
import { MeshVisualization } from './components/MeshVisualization'
import { StatsPanel } from './components/StatsPanel'
import { AccountsCard, LedgerCard } from './components/AccountsLedger'
import { EventLog, type LogEntry } from './components/EventLog'
import { ArchitectureExplainer } from './components/ArchitectureExplainer'

const now = () => new Date().toLocaleTimeString('en-IN', { hour12: false })

function App() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [meshState, setMeshState] = useState<MeshState | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [backendUp, setBackendUp] = useState(true)
  const [busy, setBusy] = useState(false)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [lastEvent, setLastEvent] = useState<MeshEvent | null>(null)
  const logSeq = useRef(0)
  const { theme, toggle } = useTheme()

  const appendLog = useCallback((kind: LogEntry['kind'], text: string) => {
    setLog((prev) => [...prev.slice(-199), { id: ++logSeq.current, at: now(), kind, text }])
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [acc, txs, mesh, st] = await Promise.all([
        api.accounts(),
        api.transactions(),
        api.meshState(),
        api.stats(),
      ])
      setAccounts(acc)
      setTransactions(txs)
      setMeshState(mesh)
      setStats(st)
      setBackendUp(true)
    } catch {
      setBackendUp(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useMeshEvents(
    useCallback(
      (event: MeshEvent) => {
        setLastEvent(event)
        setBackendUp(true)
        if (event.name === 'injected') {
          appendLog('info', `packet ${event.data.packetId} injected at ${event.data.device} (TTL ${event.data.ttl})`)
        } else if (event.name === 'gossip') {
          appendLog('info', `gossip round → ${event.data.transfers} transfer(s)`)
        } else if (event.name === 'settlement') {
          const o = String(event.data.outcome)
          const kind = o === 'SETTLED' ? 'ok' : o === 'DUPLICATE_DROPPED' ? 'warn' : 'error'
          appendLog(kind, `${event.data.bridgeNode} → backend: pkt ${event.data.packetId} ${o}${event.data.reason ? ` (${event.data.reason})` : ''}`)
        } else if (event.name === 'reset') {
          appendLog('info', 'mesh + idempotency cache reset')
        }
        // Delay the data refresh so it lands after the packet-dot animation.
        setTimeout(refresh, event.name === 'settlement' ? 950 : 750)
      },
      [appendLog, refresh],
    ),
  )

  const onDone = useCallback((msg: string) => appendLog('info', msg), [appendLog])
  const onError = useCallback(
    (msg: string) => {
      appendLog('error', msg)
      refresh()
    },
    [appendLog, refresh],
  )

  // Auto-play the whole story end to end so a first-time visitor sees a
  // payment settle without needing to know the steps. Each pause is timed so
  // the SSE-driven mesh animation for that step has room to play.
  const watchItRun = useCallback(async () => {
    if (busy) return
    setAutoPlaying(true)
    setBusy(true)
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    try {
      appendLog('info', 'demo: resetting the mesh for a clean run')
      await api.reset()
      await sleep(700)
      appendLog('info', 'demo: Alice pays Bob ₹500 — no internet on her phone')
      await api.send({ senderVpa: 'alice@demo', receiverVpa: 'bob@demo', amount: 500, pin: '1234' })
      await sleep(1500)
      appendLog('info', 'demo: the encrypted payment gossips phone to phone')
      await api.gossip()
      await sleep(1600)
      await api.gossip()
      await sleep(1600)
      appendLog('info', 'demo: a phone reaches 4G and uploads to the backend')
      await api.flush()
      await sleep(1300)
      appendLog('ok', 'demo: settled exactly once — watch the ledger and balances')
    } catch (e) {
      appendLog('error', e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      setAutoPlaying(false)
      refresh()
    }
  }, [busy, appendLog, refresh])

  return (
    <>
      <div className="app-backdrop" />
      <MeshBackground />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/25">
              <Radio size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-bold tracking-tight text-ink">
                UPI Offline Mesh
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  mesh-routed deferred settlement
                </span>
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Send money with zero internet. Encrypted packets gossip phone-to-phone until one
                reaches connectivity — then the backend settles each payment exactly once.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={watchItRun}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play size={15} aria-hidden="true" className={autoPlaying ? 'animate-pulse' : ''} />
              {autoPlaying ? 'Playing…' : 'Watch it run'}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1.5 text-xs text-muted">
              <span
                className={`h-2 w-2 rounded-full ${backendUp ? 'bg-ok' : 'bg-danger'} ${backendUp ? 'animate-pulse' : ''}`}
                aria-hidden="true"
              />
              {backendUp ? 'backend connected' : 'backend unreachable'}
            </div>
            <ThemeToggle theme={theme} toggle={toggle} />
          </div>
        </header>

      {!backendUp && (
        <div className="mb-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
          Can't reach the backend API. If you're running locally, start it with{' '}
          <code className="font-mono">mvnw spring-boot:run</code> — the page reconnects
          automatically.
        </div>
      )}

      <main className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <ComposePayment
              accounts={accounts}
              busy={busy}
              setBusy={setBusy}
              onDone={onDone}
              onError={onError}
            />
            <PipelineControls busy={busy} setBusy={setBusy} onDone={onDone} onError={onError} />
          </div>
          <div className="lg:col-span-2">
            <MeshVisualization meshState={meshState} lastEvent={lastEvent} />
          </div>
        </div>

        <StatsPanel stats={stats} />

        <div className="grid gap-4 lg:grid-cols-3">
          <AccountsCard accounts={accounts} />
          <div className="lg:col-span-2">
            <LedgerCard transactions={transactions} />
          </div>
        </div>

        <EventLog entries={log} />

        <ArchitectureExplainer />
      </main>

        <footer className="mt-8 border-t border-edge pt-4 text-xs text-muted">
          Spring Boot + H2 backend · React + Vite frontend · demo data reseeds on backend restart
        </footer>
      </div>
    </>
  )
}

export default App
