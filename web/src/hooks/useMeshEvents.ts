import { useEffect, useRef } from 'react'
import { API_BASE } from '../lib/api'

export type MeshEventName = 'injected' | 'gossip' | 'settlement' | 'reset'

export interface MeshEvent {
  seq: number
  name: MeshEventName
  data: Record<string, unknown>
}

const EVENT_NAMES: MeshEventName[] = ['injected', 'gossip', 'settlement', 'reset']

/**
 * Subscribes to the backend's SSE stream (/api/mesh/events). EventSource
 * auto-reconnects on drops, so a backend restart heals on its own.
 */
export function useMeshEvents(onEvent: (event: MeshEvent) => void) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/mesh/events`)
    const seqRef = { current: 0 }

    const listeners = EVENT_NAMES.map((name) => {
      const listener = (e: MessageEvent) => {
        let data: Record<string, unknown> = {}
        try {
          data = JSON.parse(e.data)
        } catch {
          // keep empty payload — event name alone is still meaningful
        }
        handlerRef.current({ seq: ++seqRef.current, name, data })
      }
      source.addEventListener(name, listener)
      return { name, listener }
    })

    return () => {
      listeners.forEach(({ name, listener }) => source.removeEventListener(name, listener))
      source.close()
    }
  }, [])
}
