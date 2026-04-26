import Modal from '../ui/Modal'
import { useTranslation } from '../../i18n/useI18n'

type PrivacyPolicyModalProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  title: string
}>

export default function PrivacyPolicyModal({ isOpen, onClose, title }: PrivacyPolicyModalProps) {
  const { t } = useTranslation()
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 text-sm text-slate-600">
        <p className="text-xs text-slate-500">{t('privacy.lastUpdated')}</p>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">{t('privacy.collectTitle')}</h4>
          <p>{t('privacy.collectBody')}</p>
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">{t('privacy.useTitle')}</h4>
          <p>{t('privacy.useBody')}</p>
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">{t('privacy.securityTitle')}</h4>
          <p>{t('privacy.securityBody')}</p>
        </section>
        <section className="space-y-2">
          <h4 className="font-semibold text-slate-900">{t('privacy.contactTitle')}</h4>
          <p>
            {t('privacy.contactIntro')}{' '}
            <a href="mailto:privacy@payr.co" className="font-medium text-[var(--color-primary)] hover:underline">
              privacy@payr.co
            </a>
          </p>
        </section>
      </div>
    </Modal>
  )
}
