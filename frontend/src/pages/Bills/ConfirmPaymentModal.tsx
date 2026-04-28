import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { useTranslation } from '../../i18n/useI18n'

type ConfirmPaymentModalProps = Readonly<{
  isOpen: boolean
  amount: number
  dueDate: string
  paymentMethods: Array<{ id: string; brand: string; last4: string }>
  onClose: () => void
  onConfirm: (input: { paymentMethodId: string; scheduledDate: string }) => Promise<void> | void
}>

export default function ConfirmPaymentModal({
  isOpen,
  amount,
  dueDate,
  paymentMethods,
  onClose,
  onConfirm,
}: ConfirmPaymentModalProps) {
  const { t } = useTranslation()
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(dueDate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setPaymentMethodId(paymentMethods[0]?.id ?? '')
    setScheduledDate(dueDate)
    setIsSubmitting(false)
    setIsSuccess(false)
  }, [dueDate, isOpen, paymentMethods])

  const handleConfirm = async () => {
    if (!paymentMethodId) return
    setIsSubmitting(true)
    await onConfirm({ paymentMethodId, scheduledDate })
    setIsSubmitting(false)
    setIsSuccess(true)
  }

  return (
    <Modal title={t('bills.payment.confirmTitle')} isOpen={isOpen} onClose={onClose}>
      {isSuccess ? (
        <div className='flex flex-col items-center justify-center gap-3 py-4 text-center'>
          <CheckCircle2 size={58} className='text-emerald-500' />
          <p className='text-xl font-semibold text-slate-900'>{t('bills.payment.successTitle')}</p>
          <p className='max-w-sm text-sm text-slate-500'>
            {t('bills.payment.successBody')}
          </p>
          <Button type='button' className='mt-2' onClick={onClose}>
            {t('bills.payment.done')}
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-xl border border-[var(--color-border)] bg-slate-50 p-4'>
            <p className='text-xs uppercase tracking-wide text-slate-500'>{t('bills.payment.amountToPay')}</p>
            <p className='mt-1 text-2xl font-semibold text-slate-900'>
              ${amount.toLocaleString()}
            </p>
          </div>

          <label className='block space-y-1'>
            <span className='text-sm font-medium text-slate-700'>{t('bills.payment.payWithCard')}</span>
            <select
              value={paymentMethodId}
              onChange={(event) => setPaymentMethodId(event.target.value)}
              className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
            >
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.brand.toUpperCase()} **** {method.last4}
                </option>
              ))}
            </select>
          </label>

          <label className='block space-y-1'>
            <span className='text-sm font-medium text-slate-700'>{t('bills.payment.scheduledDate')}</span>
            <input
              type='date'
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
            />
          </label>

          <div className='flex justify-end gap-2 pt-1'>
            <Button type='button' variant='secondary' onClick={onClose} disabled={isSubmitting}>
              {t('bills.payment.cancel')}
            </Button>
            <Button type='button' onClick={handleConfirm} disabled={isSubmitting || !paymentMethodId}>
              {isSubmitting ? t('bills.payment.processing') : t('bills.payment.confirmCta')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
