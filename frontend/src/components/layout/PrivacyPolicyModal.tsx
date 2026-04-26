import Modal from '../ui/Modal'

type PrivacyPolicyModalProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  title: string
}>

export default function PrivacyPolicyModal({ isOpen, onClose, title }: PrivacyPolicyModalProps) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 text-sm text-slate-600">
        <p className="text-xs text-slate-500">Last updated: April 26, 2026</p>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">What we collect</h4>
          <p>
            Payr processes information you provide when using the product—such as account details,
            company and workspace data, vendor records, bill and payment information, and files you
            upload for invoice processing (including content sent to our extraction service when you
            enable real AI mode).
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">How we use it</h4>
          <p>
            We use this data to operate the service: display your workspace, run workflows
            (approvals, payments history), improve reliability, and provide support. We do not sell
            your personal information.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">Security & retention</h4>
          <p>
            We apply reasonable technical and organizational measures to protect your data. Retention
            depends on your account and legal requirements; contact us if you need export or deletion
            of workspace data.
          </p>
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">Contact</h4>
          <p>
            Questions about this policy:{' '}
            <a href="mailto:privacy@payr.co" className="font-medium text-[var(--color-primary)] hover:underline">
              privacy@payr.co
            </a>
          </p>
        </section>
      </div>
    </Modal>
  )
}
