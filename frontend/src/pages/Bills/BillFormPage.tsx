import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { queryClient } from '@/lib/queryClient'
import { useWorkspaceBillQuery, useWorkspaceVendorsQuery } from '@/hooks/useWorkspaceQueries'
import { mapApiBillToStore } from '@/utils/mapApiBillToStore'
import { useTranslation } from '../../i18n/useI18n'

type LineItem = { description: string; amount: string; category: string }

const today = new Date().toISOString().slice(0, 10)

function suggestInvoiceNumber() {
  const year = new Date().getFullYear()
  const serial = String(Math.floor(Math.random() * 900) + 100)
  return `INV-${year}-${serial}`
}

export default function BillFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const vendorsQuery = useWorkspaceVendorsQuery()
  const billQuery = useWorkspaceBillQuery(id)
  const vendors = vendorsQuery.data ?? []
  const authToken = useAppStore((state) => state.authToken)
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId)
  const logout = useAppStore((state) => state.logout)
  const navigate = useNavigate()

  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState(isEditMode ? '' : suggestInvoiceNumber())
  const [invoiceDate, setInvoiceDate] = useState(today)
  const [dueDate, setDueDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', amount: '', category: '' }])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const bill = useMemo(() => (billQuery.data ? mapApiBillToStore(billQuery.data) : undefined), [billQuery.data])
  const rejectedReason = useMemo(
    () =>
      bill?.status === 'rejected'
        ? [...(bill.history ?? [])].reverse().find((entry) => entry.status === 'rejected')?.comment ?? ''
        : '',
    [bill],
  )

  const parsedAmount = useMemo(() => Number(amount), [amount])

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { description: '', amount: '', category: '' }])
  }

  const updateLineItem = (index: number, key: keyof LineItem, value: string) => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  useEffect(() => {
    if (!isEditMode || !bill || !id) return
    setVendorId(bill.vendorId)
    setInvoiceNumber(bill.invoiceNumber)
    setInvoiceDate(bill.invoiceDate)
    setDueDate(bill.dueDate)
    setAmount(String(bill.amount))
    setNotes(bill.notes ?? '')
    setLineItems(
      bill.lineItems?.length
        ? bill.lineItems.map((li) => ({
            description: li.description,
            amount: String(li.amount),
            category: li.category,
          }))
        : [{ description: '', amount: '', category: '' }],
    )
  }, [bill, id, isEditMode])

  const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!vendorId || !invoiceNumber || !dueDate || !parsedAmount) {
      setError('Vendor, invoice number, due date and amount are required.')
      return
    }

    if (!authToken) {
      setError('Sign in to create a bill.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      let endpoint = `${API_BASE_URL}/bills`
      if (isEditMode && id) {
        endpoint =
          bill?.status === 'rejected'
            ? `${API_BASE_URL}/bills/${id}/resubmit`
            : `${API_BASE_URL}/bills/${id}/edit-draft`
      }
      const response = await fetch(endpoint, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Entity-Id': activeWorkspaceId,
        },
        body: JSON.stringify({
          vendorId,
          invoiceNumber,
          invoiceDate,
          dueDate,
          amount: parsedAmount,
          currency: 'USD',
          notes,
          line_items: lineItems
            .filter((item) => item.description || item.amount || item.category)
            .map((item) => ({
              description: item.description || 'Line item',
              amount: Number(item.amount || 0),
              category: item.category || 'General',
            })),
        }),
      })
      if (response.status === 401) {
        logout()
        return
      }
      if (!response.ok) throw new Error('Failed to save bill')
      await queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId] })
      navigate('/bills', { replace: true })
    } catch {
      setError('Could not save bill. Check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && billQuery.isPending) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <p className="text-sm text-slate-500">Loading bill...</p>
      </div>
    )
  }
  if (isEditMode && billQuery.isError) return <Navigate to="/bills" replace />
  if (isEditMode && bill && !['draft', 'rejected'].includes(bill.status)) return <Navigate to="/bills" replace />

  let submitLabel = 'Save Draft'
  if (isEditMode) submitLabel = bill?.status === 'rejected' ? 'Resubmit for Approval' : 'Save Changes'
  if (isSubmitting) submitLabel = 'Saving…'
  const editTitle = bill?.status === 'rejected' ? 'Edit Rejected Bill' : 'Edit Draft Bill'
  const editSubtitle =
    bill?.status === 'rejected'
      ? 'Fix details and resubmit for approval.'
      : 'Update the draft details before submitting for approval.'

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900">{isEditMode ? editTitle : 'New Bill'}</h3>
      <p className="mt-1 text-sm text-slate-500">
        {isEditMode ? editSubtitle : 'Create a draft bill for approval workflow.'}
      </p>
      {isEditMode && bill?.status === 'rejected' && rejectedReason ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">{t('bills.reject.bannerTitle')}</p>
          <p className="mt-1">
            {t('bills.reject.reasonPrefix')}: {rejectedReason}
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Vendor</span>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2">
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Invoice Number</span>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Invoice Date</span>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Due Date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Amount</span>
            <div className="flex items-center rounded-xl border border-[var(--color-border)] px-3">
              <span className="text-slate-500">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border-0 px-2 py-2 outline-none" />
            </div>
          </label>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2" rows={3} />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Line Items (optional)</p>
            <Button variant="secondary" size="sm" onClick={addLineItem}>Add Row</Button>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={`${index}-${item.description}`} className="grid gap-2 md:grid-cols-3">
                <input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
                <input placeholder="Amount" type="number" value={item.amount} onChange={(e) => updateLineItem(index, 'amount', e.target.value)} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
                <input placeholder="Category" value={item.category} onChange={(e) => updateLineItem(index, 'category', e.target.value)} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(isEditMode && id ? `/bills/${id}` : '/bills')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
