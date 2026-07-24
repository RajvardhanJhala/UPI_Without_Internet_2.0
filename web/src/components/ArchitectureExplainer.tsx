import {
  ShieldCheck,
  Zap,
  History,
  ChevronRight,
  Music,
  ShoppingBag,
  TramFront,
  MountainSnow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const SCENARIOS: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: Music,
    title: 'Packed concerts & stadiums',
    body: 'Fifty thousand phones hammer one cell tower and mobile data grinds to nothing. You still want a drink or a T-shirt. Pay the vendor face to face — your encrypted payment hops through the phones around you and settles the moment anyone near an exit gets a bar of signal.',
  },
  {
    Icon: ShoppingBag,
    title: 'Crowded markets & festivals',
    body: 'A dense bazaar or a basement food court where neither you nor the stall owner has a usable connection. The payment relays outward through nearby shoppers instead of waiting on a signal that never comes.',
  },
  {
    Icon: TramFront,
    title: 'Metros, garages & basements',
    body: 'Underground platforms, parking levels and elevators are connectivity dead zones. Pay now; the packet rides along with the crowd and uploads itself once someone carries it back above ground.',
  },
  {
    Icon: MountainSnow,
    title: 'Remote areas & outages',
    body: 'A rural shop on one flaky tower, or a city-wide network outage. As long as some phone in the chain eventually reaches the internet, the payment gets through — it never depends on your own phone having signal at the instant you pay.',
  },
]

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
    body: 'Three phones deliver the same packet within milliseconds. The backend claims SHA-256(ciphertext) with an atomic compare-and-set before doing any work — exactly one claimer settles, the rest are dropped. A unique DB index on the hash backs it up.',
  },
  {
    Icon: History,
    title: 'Replay attacks',
    body: 'The encrypted payload carries a signed timestamp and a nonce. A packet older than 24h is refused; a byte-identical replay hits the idempotency cache. Neither can be forged without breaking the GCM tag.',
  },
]

export function ArchitectureExplainer() {
  return (
    <section className="space-y-8">
      {/* Real-life framing first */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Where this helps</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            We assume there's always a signal — until there isn't. In exactly the places crowds
            gather, the network is the first thing to buckle. Mesh-routed settlement lets a payment
            leave your phone the instant you make it and find its own way to the bank through the
            people around you, so a dead connection no longer means a declined payment.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map(({ Icon, title, body }) => (
            <div key={title} className="card p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon size={17} aria-hidden="true" />
                </span>
                {title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical depth below */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Under the hood</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Your phone encrypts the payment and broadcasts it over Bluetooth. It hops device to
            device until one phone reaches the internet and quietly uploads it. The backend then
            decrypts, deduplicates and settles it — exactly once — through this pipeline:
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
      </div>
    </section>
  )
}
