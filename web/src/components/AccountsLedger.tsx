import { Wallet, ReceiptText } from 'lucide-react'
import type { Account, Transaction } from '../lib/api'
import { StatusBadge } from './StatusBadge'

const inr = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

export function AccountsCard({ accounts }: { accounts: Account[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Wallet size={14} className="text-accent" aria-hidden="true" />
        Account balances
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wide text-muted uppercase">
            <th className="pb-2 font-semibold">Holder</th>
            <th className="pb-2 font-semibold">VPA</th>
            <th className="pb-2 text-right font-semibold">Balance</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.vpa} className="border-t border-edge">
              <td className="py-2 text-ink">{a.holderName}</td>
              <td className="py-2 font-mono text-xs text-muted">{a.vpa}</td>
              <td className="py-2 text-right font-mono text-ok tabular-nums">{inr(a.balance)}</td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-xs text-muted">
                Waiting for backend…
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function LedgerCard({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <ReceiptText size={14} className="text-accent" aria-hidden="true" />
        Transaction ledger
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted uppercase">
              <th className="pr-3 pb-2 font-semibold">#</th>
              <th className="pr-3 pb-2 font-semibold">From → To</th>
              <th className="pr-4 pb-2 text-right font-semibold">Amount</th>
              <th className="pr-4 pb-2 font-semibold">Status</th>
              <th className="pr-4 pb-2 text-right font-semibold">Hops</th>
              <th className="pb-2 font-semibold">Via bridge</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-edge">
                <td className="py-2 pr-3 font-mono text-xs text-muted tabular-nums">{t.id}</td>
                <td className="py-2 pr-3 text-ink">
                  {t.senderVpa.split('@')[0]} → {t.receiverVpa.split('@')[0]}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-ink tabular-nums">
                  {inr(t.amount)}
                </td>
                <td className="py-2 pr-4">
                  <StatusBadge outcome={t.status} />
                </td>
                <td className="py-2 pr-4 text-right font-mono text-xs text-muted tabular-nums">
                  {t.hopCount}
                </td>
                <td className="py-2 font-mono text-xs text-muted">{t.bridgeNodeId}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-xs text-muted">
                  Nothing settled yet — run the demo pipeline on the left.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
