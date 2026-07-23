import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Landmark, Radio, Smartphone } from 'lucide-react'
import type { MeshState } from '../lib/api'
import type { MeshEvent } from '../hooks/useMeshEvents'

// SVG fill/stroke accept var(), so the whole diagram re-tints with the theme
// automatically — no JS reads needed.
const C = {
  surface2: 'var(--surface-2)',
  edge: 'var(--border)',
  ink: 'var(--ink)',
  muted: 'var(--muted)',
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  okDeep: 'var(--ok-strong)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
}

interface Point {
  x: number
  y: number
}

interface FlyingDot {
  key: string
  from: Point
  to: Point
  color: string
  dur: number
}

interface Pulse {
  key: string
  at: Point
  color: string
}

const MESH_CENTER: Point = { x: 235, y: 210 }
const MESH_RADIUS = 145
const CLOUD: Point = { x: 585, y: 210 }

interface Props {
  meshState: MeshState | null
  lastEvent: MeshEvent | null
}

/**
 * The live picture of the system: phones in a Bluetooth mesh on the left,
 * the settlement backend on the right. Packet movement (gossip hops, bridge
 * uploads) is animated from SSE events, not polled.
 */
export function MeshVisualization({ meshState, lastEvent }: Props) {
  const [dots, setDots] = useState<FlyingDot[]>([])
  const [pulses, setPulses] = useState<Pulse[]>([])
  const prevCountsRef = useRef<Record<string, number>>({})
  const dotSeq = useRef(0)

  // Stable layout: alice on top, bridge next (closest to the backend), rest alpha.
  const devices = useMemo(() => {
    const list = [...(meshState?.devices ?? [])]
    list.sort((a, b) => {
      const rank = (d: (typeof list)[number]) =>
        d.deviceId === 'phone-alice' ? 0 : d.hasInternet ? 1 : 2
      return rank(a) - rank(b) || a.deviceId.localeCompare(b.deviceId)
    })
    return list
  }, [meshState])

  const positions = useMemo(() => {
    const map: Record<string, Point> = {}
    devices.forEach((d, i) => {
      const angle = ((-90 + (i * 360) / Math.max(devices.length, 1)) * Math.PI) / 180
      map[d.deviceId] = {
        x: MESH_CENTER.x + MESH_RADIUS * Math.cos(angle),
        y: MESH_CENTER.y + MESH_RADIUS * Math.sin(angle),
      }
    })
    return map
  }, [devices])

  // Keep the "before" packet counts current so gossip animation can diff.
  useEffect(() => {
    if (!meshState) return
    const counts: Record<string, number> = {}
    for (const d of meshState.devices) counts[d.deviceId] = d.packetCount
    prevCountsRef.current = counts
  }, [meshState])

  useEffect(() => {
    if (!lastEvent) return
    const spawnDots = (newDots: FlyingDot[]) => {
      if (newDots.length === 0) return
      setDots((prev) => [...prev, ...newDots])
      const keys = new Set(newDots.map((d) => d.key))
      const maxDur = Math.max(...newDots.map((d) => d.dur))
      setTimeout(() => setDots((prev) => prev.filter((d) => !keys.has(d.key))), maxDur + 100)
    }
    const spawnPulse = (at: Point, color: string, delay = 0) => {
      const key = `pulse-${++dotSeq.current}`
      setTimeout(() => {
        setPulses((prev) => [...prev, { key, at, color }])
        setTimeout(() => setPulses((prev) => prev.filter((p) => p.key !== key)), 950)
      }, delay)
    }

    if (lastEvent.name === 'injected') {
      const device = String(lastEvent.data.device ?? '')
      const at = positions[device]
      if (at) spawnPulse(at, C.accent)
    } else if (lastEvent.name === 'gossip') {
      const after = (lastEvent.data.deviceCounts ?? {}) as Record<string, number>
      const before = prevCountsRef.current
      const sources = Object.keys(before).filter((id) => (before[id] ?? 0) > 0)
      const targets = Object.keys(after).filter((id) => (after[id] ?? 0) > (before[id] ?? 0))
      const newDots: FlyingDot[] = []
      for (const src of sources) {
        for (const dst of targets) {
          if (src === dst || !positions[src] || !positions[dst]) continue
          newDots.push({
            key: `dot-${++dotSeq.current}`,
            from: positions[src],
            to: positions[dst],
            color: C.accent,
            dur: 700,
          })
        }
      }
      spawnDots(newDots)
      prevCountsRef.current = after
    } else if (lastEvent.name === 'settlement') {
      const bridge = String(lastEvent.data.bridgeNode ?? '')
      const outcome = String(lastEvent.data.outcome ?? '')
      const from = positions[bridge]
      const color =
        outcome === 'SETTLED' ? C.ok : outcome === 'DUPLICATE_DROPPED' ? C.warn : C.danger
      if (from) {
        spawnDots([
          { key: `dot-${++dotSeq.current}`, from, to: CLOUD, color, dur: 900 },
        ])
        spawnPulse(CLOUD, color, 900)
      }
    } else if (lastEvent.name === 'reset') {
      setDots([])
      setPulses([])
    }
    // positions is stable for a given device set; lastEvent.seq drives reruns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent?.seq])

  const pairs = useMemo(() => {
    const out: [Point, Point][] = []
    for (let i = 0; i < devices.length; i++) {
      for (let j = i + 1; j < devices.length; j++) {
        out.push([positions[devices[i].deviceId], positions[devices[j].deviceId]])
      }
    }
    return out
  }, [devices, positions])

  const bridgePos = devices.find((d) => d.hasInternet)
    ? positions[devices.find((d) => d.hasInternet)!.deviceId]
    : null

  return (
    <div className="card h-full p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink">Live mesh</h3>
        <span className="text-xs text-muted">
          idempotency cache: {meshState?.idempotencyCacheSize ?? 0} hash
          {(meshState?.idempotencyCacheSize ?? 0) === 1 ? '' : 'es'}
        </span>
      </div>

      <svg viewBox="0 0 680 420" className="w-full" role="img" aria-label="Mesh network diagram">
        {/* Faint all-to-all mesh edges */}
        {pairs.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.edge} strokeOpacity={0.45} />
        ))}

        {/* Bridge → backend uplink */}
        {bridgePos && (
          <line
            x1={bridgePos.x}
            y1={bridgePos.y}
            x2={CLOUD.x - 62}
            y2={CLOUD.y}
            stroke={C.okDeep}
            strokeDasharray="6 5"
            strokeOpacity={0.7}
          />
        )}

        {/* Backend node */}
        <g>
          <rect
            x={CLOUD.x - 62}
            y={CLOUD.y - 46}
            width={124}
            height={92}
            rx={12}
            fill={C.surface2}
            stroke={C.edge}
          />
          <Landmark x={CLOUD.x - 12} y={CLOUD.y - 38} width={24} height={24} color={C.accent} />
          <text x={CLOUD.x} y={CLOUD.y + 6} textAnchor="middle" fontSize={13} fontWeight={600} fill={C.ink}>
            Backend
          </text>
          <text x={CLOUD.x} y={CLOUD.y + 24} textAnchor="middle" fontSize={10} fill={C.muted}>
            decrypt · dedupe · settle
          </text>
          <text x={CLOUD.x} y={CLOUD.y + 62} textAnchor="middle" fontSize={10} fill={C.muted}>
            reachable only via 4G
          </text>
        </g>

        {/* Device nodes */}
        {devices.map((d) => {
          const p = positions[d.deviceId]
          const label = d.deviceId.replace(/^phone-/, '')
          const Glyph = d.hasInternet ? Radio : Smartphone
          return (
            <g key={d.deviceId}>
              <circle
                cx={p.x}
                cy={p.y}
                r={34}
                fill={d.hasInternet ? 'color-mix(in srgb, var(--ok) 16%, transparent)' : C.surface2}
                stroke={d.hasInternet ? C.okDeep : C.edge}
                strokeWidth={d.hasInternet ? 2 : 1}
              />
              <Glyph
                x={p.x - 12}
                y={p.y - 12}
                width={24}
                height={24}
                color={d.hasInternet ? C.ok : C.muted}
              />
              <text x={p.x} y={p.y + 50} textAnchor="middle" fontSize={12} fontWeight={600} fill={C.ink}>
                {label}
              </text>
              {d.hasInternet && (
                <text x={p.x} y={p.y + 64} textAnchor="middle" fontSize={9} fill={C.ok}>
                  has internet
                </text>
              )}
              {d.packetCount > 0 && (
                <g>
                  <circle cx={p.x + 26} cy={p.y - 26} r={11} fill={C.accent} />
                  <text
                    x={p.x + 26}
                    y={p.y - 22}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill="var(--bg)"
                  >
                    {d.packetCount}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Transient pulses */}
        {pulses.map((p) => (
          <circle
            key={p.key}
            cx={p.at.x}
            cy={p.at.y}
            r={34}
            fill="none"
            stroke={p.color}
            strokeWidth={2}
            className="pulse-ring"
          />
        ))}

        {/* Flying packet dots */}
        {dots.map((d) => (
          <circle
            key={d.key}
            r={5}
            fill={d.color}
            className="fly-dot"
            style={
              {
                '--fly-x1': `${d.from.x}px`,
                '--fly-y1': `${d.from.y}px`,
                '--fly-x2': `${d.to.x}px`,
                '--fly-y2': `${d.to.y}px`,
                '--fly-dur': `${d.dur}ms`,
              } as CSSProperties
            }
          />
        ))}
      </svg>

      <p className="mt-1 text-xs leading-relaxed text-muted">
        Five simulated phones in a basement. Only <span className="text-ok">bridge</span> can reach
        the internet — everyone else relays encrypted packets they cannot read.
      </p>
    </div>
  )
}
