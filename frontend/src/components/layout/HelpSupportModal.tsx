import { Mail } from 'lucide-react'
import Modal from '../ui/Modal'

type HelpSupportModalProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  title: string
}>

export default function HelpSupportModal({ isOpen, onClose, title }: HelpSupportModalProps) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 text-sm text-slate-600">
        <p>
          Payr helps you manage bills, vendors, approvals, and payments in one workspace. If something
          does not look right—especially after AI invoice extraction—double-check the extracted fields
          before submitting.
        </p>
        <p>
          For account access, workspace setup, or payment issues, contact our team and include your
          company name and a short description of what you were trying to do.
        </p>
        <a
          href="mailto:support@payr.co"
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-3 font-medium text-[var(--color-primary)] transition hover:bg-slate-100"
        >
          <Mail size={18} className="shrink-0" />
          support@payr.co
        </a>
        <p className="text-xs text-slate-500">We typically respond within one business day.</p>
      </div>
    </Modal>
  )
}
