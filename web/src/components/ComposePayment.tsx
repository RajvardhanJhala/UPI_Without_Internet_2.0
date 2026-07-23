import { useState } from 'react'
import { Send } from 'lucide-react'
import { api, type Account } from '../lib/api'

interface Props {
  accounts: Account[]
  busy: boolean
  setBusy: (b: boolean) => void
  onDone: (message: string) => void
  onError: (message: string) => void
}

/**
 * Step 1 — build an encrypted payment packet on the (simulated) sender phone
 * and drop it into the mesh at phone-alice.
 */
export function ComposePayment({ accounts, busy, setBusy, onDone, onError }: Props) {
  const [sender, setSender] = useState('alice@demo')
  const [receiver, setReceiver] = useState('bob@demo')
  const [amount, setAmount] = useState('500')
  const [pin, setPin] = useState('1234')

  const inject = async () => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      onError('Amount must be a positive number')
      return
    }
    if (sender === receiver) {
      onError('Sender and receiver must differ')
      return
    }
    setBusy(true)
    try {
      const r = await api.send({ senderVpa: sender, receiverVpa: receiver, amount: value, pin })
      onDone(`Packet ${r.packetId.slice(0, 8)} encrypted and injected at ${r.injectedAt} (TTL ${r.ttl})`)
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const selectClass =
    'w-full rounded-md border border-edge bg-bg px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none'

  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          1
        </span>
        Compose a payment (offline)
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          Sender
          <select value={sender} onChange={(e) => setSender(e.target.value)} className={selectClass}>
            {accounts.map((a) => (
              <option key={a.vpa} value={a.vpa}>
                {a.holderName} ({a.vpa})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Receiver
          <select value={receiver} onChange={(e) => setReceiver(e.target.value)} className={selectClass}>
            {accounts.map((a) => (
              <option key={a.vpa} value={a.vpa}>
                {a.holderName} ({a.vpa})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Amount (₹)
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={selectClass}
          />
        </label>
        <label className="text-xs text-muted">
          UPI PIN
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={selectClass}
            autoComplete="off"
          />
        </label>
      </div>
      <button
        onClick={inject}
        disabled={busy || accounts.length === 0}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-deep hover:shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <Send size={15} aria-hidden="true" />
        Encrypt &amp; inject into mesh
      </button>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        The payment is encrypted with the server's RSA public key (hybrid RSA-OAEP + AES-256-GCM)
        before it ever leaves the phone. Intermediates only see ciphertext.
      </p>
    </div>
  )
}
