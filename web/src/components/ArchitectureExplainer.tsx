import { ShieldCheck, Zap, History, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const PIPELINE = [
  { step: 'hash', detail: 'SHA-256 of the ciphertext' },
  { step: 'claim', detail: 'atomic putIfAbsent — duplicates die here' },
  { step: 'decrypt', detail: 'RSA-OAEP unwraps the AES-GCM key' },
  { step: 'freshness', detail: 'signedAt within 24h, else replay' },
  { step: 'settle', detail: 'debit + credit in one DB transaction' },
]

const PROBLEMS: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: ShieldCheck,
    title: 'Untrusted couriers',
    body: "A stranger's phone carries your payment. Hybrid encryption (RSA-OAEP + AES-256-GCM) means intermediates see only opaque ciphertext — and the GCM auth tag turns any single-bit tamper into a rejected packet. Same scheme TLS uses.",
  },
  {
    Icon: Zap,
    title: 'The duplicate storm',
    body: 'Three bridges deliver the same packet within milliseconds. The backend claims SHA-256(ciphertext) with an atomic compare-and-set before doing any work — exactly one claimer settles, the rest are dropped. A unique DB index on the hash backs it up.',
  },
  {
    Icon: History,
    title: 'Replay attacks',
    body: 'The encrypted payload carries a signed timestamp and a nonce. A packet older than 24h is refused; a byte-identical replay hits the idempotency cache. Neither can be forged without breaking the GCM tag.',
  },
]

export function ArchitectureExplainer() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">How it works</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          You're in a basement with zero connectivity. Your phone encrypts the payment, broadcasts
          it over Bluetooth, and the packet hops device-to-device until someone walks outside, gets
          4G, and silently uploads it. The backend decrypts, deduplicates, and settles — exactly
          once.
        </p>
      </div>

      <div className="flex flex-wrap items-stretch gap-2">
        {PIPELINE.map((p, i) => (
          <div key={p.step} className="flex items-center gap-2">
            <div className="card px-3 py-2">
              <div className="font-mono text-xs font-semibold text-accent">{p.step}</div>
              <div className="mt-0.5 text-xs text-muted">{p.detail}</div>
            </div>
            {i < PIPELINE.length - 1 && (
              <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PROBLEMS.map(({ Icon, title, body }) => (
          <div key={title} className="card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon size={16} aria-hidden="true" />
              </span>
              {title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-muted">
        Honest scope: this is <em>mesh-routed deferred settlement</em>, not real-time offline UPI —
        the receiver holds an IOU until a bridge reaches the internet, and offline double-spends
        resolve first-writer-wins at the backend. The cryptography and exactly-once settlement are
        the real engineering here.
      </p>
    </section>
  )
}
