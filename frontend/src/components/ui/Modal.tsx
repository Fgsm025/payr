import { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = Readonly<{
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Defaults to `max-w-lg` when omitted; set e.g. `max-w-2xl` for a wider panel. */
  panelClassName?: string
}>

export default function Modal({ title, isOpen, onClose, children, panelClassName = 'max-w-lg' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 z-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl ${panelClassName}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
