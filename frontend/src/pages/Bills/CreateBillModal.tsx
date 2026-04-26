import React, { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudUpload, FileText, Loader2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAppStore } from '../../store/useAppStore'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { queryClient } from '@/lib/queryClient'
import { useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'

type Step = 'upload' | 'extracting' | 'form'
type LineItem = { description: string; amount: string }

type CreateBillModalProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}>

const today = new Date().toISOString().slice(0, 10)

function invoiceSuggestion() {
  const year = new Date().getFullYear()
  const serial = String(Math.floor(Math.random() * 900) + 100)
  return `INV-${year}-${serial}`
}

function normalizeVendorName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9]/g, '')
}

export default function CreateBillModal({ isOpen, onClose, onCreated }: CreateBillModalProps) {
  const vendorsQuery = useWorkspaceVendorsQuery()
  const vendors = vendorsQuery.data ?? []
  const authToken = useAppStore((state) => state.authToken)
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId)
  const logout = useAppStore((state) => state.logout)

  const [step, setStep] = useState<Step>('upload')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isManual, setIsManual] = useState(false)

  const [form, setForm] = useState({
    vendorId: vendors[0]?.id ?? '',
    invoiceNumber: invoiceSuggestion(),
    amount: '',
    currency: 'USD',
    invoiceDate: today,
    dueDate: today,
    notes: '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', amount: '' }])

  const requiredValid = useMemo(
    () => Boolean(form.vendorId && Number(form.amount) > 0 && form.dueDate),
    [form],
  )

  const resetState = () => {
    setStep('upload')
    setError('')
    setIsSubmitting(false)
    setIsManual(false)
    setForm({
      vendorId: vendors[0]?.id ?? '',
      invoiceNumber: invoiceSuggestion(),
      amount: '',
      currency: 'USD',
      invoiceDate: today,
      dueDate: today,
      notes: '',
    })
    setLineItems([{ description: '', amount: '' }])
  }

  const closeModal = () => {
    resetState()
    onClose()
  }

  const onDropAccepted = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setError('')
    setStep('extracting')
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(`${API_BASE_URL}/bills/extract`, {
        method: 'POST',
        headers: authToken
          ? { Authorization: `Bearer ${authToken}`, 'X-Entity-Id': activeWorkspaceId }
          : {},
        body,
      })

      if (response.status === 401) {
        logout()
        throw new Error('Session expired')
      }

      if (!response.ok) {
        throw new Error('Failed to extract invoice')
      }

      const data = await response.json()
      const extractedVendor = data.vendorName ? normalizeVendorName(String(data.vendorName).trim()) : ''
      const vendorId =
        vendors.find((v) => {
          const vendorName = normalizeVendorName(v.name)
          return vendorName === extractedVendor || vendorName.includes(extractedVendor) || extractedVendor.includes(vendorName)
        })?.id ?? ''

      setIsManual(false)
      setForm((prev) => ({
        ...prev,
        vendorId,
        invoiceNumber: prev.invoiceNumber || invoiceSuggestion(),
        amount: data.totalAmount ? String(data.totalAmount) : '',
        currency: data.currency ?? 'USD',
        invoiceDate: data.invoiceDate ? String(data.invoiceDate).slice(0, 10) : today,
        dueDate: data.dueDate ? String(data.dueDate).slice(0, 10) : '',
      }))
      setStep('form')
    } catch {
      setError('AI extraction failed. You can continue with manual entry.')
      onManualEntry()
    }
  }

  const onDropRejected = () => {
    setError('Only PDF files up to 5MB are allowed.')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    onDropAccepted,
    onDropRejected,
  })

  const onManualEntry = () => {
    setIsManual(true)
    setForm({
      vendorId: '',
      invoiceNumber: '',
      amount: '',
      currency: 'USD',
      invoiceDate: today,
      dueDate: '',
      notes: '',
    })
    setLineItems([{ description: '', amount: '' }])
    setStep('form')
    setError('')
  }

  const dropzoneStateClass = (() => {
    if (error) return 'border-red-400 bg-red-50'
    if (isDragActive) return 'border-[var(--color-primary)] bg-cyan-50'
    return 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-cyan-50/40'
  })()

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateLineItem = (index: number, key: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    )
  }

  const addLineItemRow = () => {
    setLineItems((prev) => [...prev, { description: '', amount: '' }])
  }

  const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!requiredValid) return
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken
            ? { Authorization: `Bearer ${authToken}`, 'X-Entity-Id': activeWorkspaceId }
            : {}),
        },
        body: JSON.stringify({
          vendorId: form.vendorId,
          invoiceNumber: form.invoiceNumber,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate,
          amount: Number(form.amount),
          currency: form.currency,
          notes: form.notes,
          line_items: lineItems
            .filter((item) => item.description || item.amount)
            .map((item) => ({
              description: item.description || 'Line item',
              amount: Number(item.amount || 0),
              category: 'General',
            })),
        }),
      })

      if (response.status === 401) {
        logout()
        throw new Error('Session expired')
      }
      if (!response.ok) throw new Error('Failed to create bill')

      await response.json()
      await queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId] })

      setIsSubmitting(false)
      onCreated?.()
      closeModal()
    } catch {
      setIsSubmitting(false)
      setError('Could not create bill. Check backend connection.')
    }
  }

  return (
    <Modal title="Create New Bill" isOpen={isOpen} onClose={closeModal}>
      {step === 'upload' && (
        <div className="space-y-5">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${dropzoneStateClass}`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-3 w-fit rounded-full bg-cyan-100 p-3 text-cyan-600">
              <CloudUpload size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">Drag & drop your invoice</p>
            <p className="mt-1 text-xs text-slate-500">PDF up to 5MB</p>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400">OR</span>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={onManualEntry}>
            Manual Entry
          </Button>
        </div>
      )}

      {step === 'extracting' && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
          <p className="mt-3 text-sm text-slate-600">AI is analyzing your invoice...</p>
        </div>
      )}

      {step === 'form' && (
        <form className="space-y-4" onSubmit={onSubmit}>
          {!isManual && (
            <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700">
              <FileText size={14} />
              Data pre-filled from uploaded PDF
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-slate-600">Vendor</span>
              <select value={form.vendorId} onChange={(e) => updateForm('vendorId', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2">
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Invoice Number</span>
              <input value={form.invoiceNumber} onChange={(e) => updateForm('invoiceNumber', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Amount</span>
              <div className="flex items-center rounded-xl border border-[var(--color-border)] px-3">
                <span className="text-slate-500">$</span>
                <input type="number" value={form.amount} onChange={(e) => updateForm('amount', e.target.value)} className="w-full border-0 px-2 py-2 outline-none" />
              </div>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Currency</span>
              <select value={form.currency} onChange={(e) => updateForm('currency', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2">
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Invoice Date</span>
              <input type="date" value={form.invoiceDate} onChange={(e) => updateForm('invoiceDate', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Due Date</span>
              <input type="date" value={form.dueDate} onChange={(e) => updateForm('dueDate', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-slate-600">Notes</span>
              <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" rows={2} />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Line Items (optional)</p>
              <Button variant="secondary" size="sm" onClick={addLineItemRow}>
                Add Row
              </Button>
            </div>
            {lineItems.map((item, index) => (
              <div key={`${index}-${item.description}`} className="grid gap-2 md:grid-cols-2">
                <input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
                <input placeholder="Price" type="number" value={item.amount} onChange={(e) => updateLineItem(index, 'amount', e.target.value)} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button type="submit" disabled={!requiredValid || isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Bill'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
