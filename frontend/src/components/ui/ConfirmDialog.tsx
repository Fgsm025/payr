import Button from './Button'
import Modal from './Modal'

type ConfirmDialogProps = Readonly<{
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  confirmFirst?: boolean
  onConfirm: () => void
  onCancel: () => void
}>

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  confirmFirst = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onCancel}>
      <div className='space-y-5'>
        <p className='text-sm text-slate-600'>{description}</p>
        <div className='flex items-center justify-end gap-2'>
          {confirmFirst ? (
            <>
              <Button
                type='button'
                variant={confirmVariant}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
              <Button type='button' variant='secondary' onClick={onCancel}>
                {cancelLabel}
              </Button>
            </>
          ) : (
            <>
              <Button
                type='button'
                variant={confirmVariant}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
              <Button type='button' variant='secondary' onClick={onCancel}>
                {cancelLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
