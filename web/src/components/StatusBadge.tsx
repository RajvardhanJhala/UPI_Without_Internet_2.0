import { Check, X, Layers, Ban } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Outcome } from '../lib/api'

const STYLES: Record<Outcome, { label: string; Icon: LucideIcon; className: string }> = {
  SETTLED: { label: 'Settled', Icon: Check, className: 'text-ok border-ok/40 bg-ok/10' },
  REJECTED: { label: 'Rejected', Icon: Ban, className: 'text-danger border-danger/40 bg-danger/10' },
  DUPLICATE_DROPPED: {
    label: 'Duplicate dropped',
    Icon: Layers,
    className: 'text-warn border-warn/40 bg-warn/10',
  },
  INVALID: { label: 'Invalid', Icon: X, className: 'text-danger border-danger/40 bg-danger/10' },
}

/** Outcome chip: icon + text label always together, never color alone. */
export function StatusBadge({ outcome }: { outcome: Outcome }) {
  const { label, Icon, className } = STYLES[outcome]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${className}`}
    >
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  )
}
