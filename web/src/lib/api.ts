/**
 * Thin typed wrapper over the Spring Boot backend.
 *
 * Local dev: VITE_API_BASE_URL is unset, so requests go same-origin and the
 * Vite dev server proxies /api to localhost:8080 (see vite.config.ts).
 * Production: VITE_API_BASE_URL points at the deployed backend (Render).
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export interface Account {
  vpa: string
  holderName: string
  balance: number
  version: number
}

export interface Transaction {
  id: number
  packetHash: string
  senderVpa: string
  receiverVpa: string
  amount: number
  signedAt: string
  settledAt: string
  bridgeNodeId: string
  hopCount: number
  status: 'SETTLED' | 'REJECTED'
}

export interface DeviceState {
  deviceId: string
  hasInternet: boolean
  packetCount: number
  packetIds: string[]
}

export interface MeshState {
  devices: DeviceState[]
  idempotencyCacheSize: number
}

export interface Stats {
  outcomes: {
    settled: number
    rejected: number
    duplicateDropped: number
    invalid: number
  }
  total: number
}

export type Outcome = 'SETTLED' | 'REJECTED' | 'DUPLICATE_DROPPED' | 'INVALID'

export interface FlushUploadResult {
  bridgeNode: string
  packetId: string
  outcome: Outcome
  reason: string
  transactionId: number
}

export interface FlushResult {
  uploadsAttempted: number
  results: FlushUploadResult[]
}

export interface GossipResult {
  transfers: number
  deviceCounts: Record<string, number>
}

export interface SendRequest {
  senderVpa: string
  receiverVpa: string
  amount: number
  pin: string
  ttl?: number
}

export interface SendResult {
  packetId: string
  ciphertextPreview: string
  ttl: number
  injectedAt: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} → HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  accounts: () => request<Account[]>('/api/accounts'),
  transactions: () => request<Transaction[]>('/api/transactions'),
  meshState: () => request<MeshState>('/api/mesh/state'),
  stats: () => request<Stats>('/api/stats'),
  send: (body: SendRequest) =>
    request<SendResult>('/api/demo/send', { method: 'POST', body: JSON.stringify(body) }),
  gossip: () => request<GossipResult>('/api/mesh/gossip', { method: 'POST' }),
  flush: () => request<FlushResult>('/api/mesh/flush', { method: 'POST' }),
  reset: () => request<{ status: string }>('/api/mesh/reset', { method: 'POST' }),
}
