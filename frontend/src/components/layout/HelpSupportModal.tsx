import { Mail } from 'lucide-react'
import Modal from '../ui/Modal'
import { useTranslation } from '../../i18n/useI18n'

type HelpSupportModalProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  title: string
}>

export default function HelpSupportModal({ isOpen, onClose, title }: HelpSupportModalProps) {
  const { t } = useTranslation()
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 text-sm text-slate-600">
        <p>{t('help.p1')}</p>
        <p>{t('help.p2')}</p>
        <a
          href="mailto:support@payr.co"
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-3 font-medium text-[var(--color-primary)] transition hover:bg-slate-100"
        >
          <Mail size={18} className="shrink-0" />
          support@payr.co
        </a>
        <p className="text-xs text-slate-500">{t('help.responseNote')}</p>
      </div>
    </Modal>
  )
}
