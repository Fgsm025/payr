import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

type LineItem = { description: string; amount: string; category: string }

const today = new Date().toISOString().slice(0, 10)

function suggestInvoiceNumber() {
  const year = new Date().getFullYear()
  const serial = String(Math.floor(Math.random() * 900) + 100)
  return `INV-${year}-${serial}`
}

export default function BillFormPage() {
  const vendors = useAppStore((state) => state.vendors)
  const addBill = useAppStore((state) => state.addBill)
  const navigate = useNavigate()

  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState(suggestInvoiceNumber())
  const [invoiceDate, setInvoiceDate] = useState(today)
  const [dueDate, setDueDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', amount: '', category: '' }])
  const [error, setError] = useState('')

  const parsedAmount = useMemo(() => Number(amount), [amount])

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { description: '', amount: '', category: '' }])
  }

  const updateLineItem = (index: number, key: keyof LineItem, value: string) => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!vendorId || !invoiceNumber || !dueDate || !parsedAmount) {
      setError('Vendor, invoice number, due date and amount are required.')
      return
    }

    addBill({
      vendorId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount: parsedAmount,
      notes,
      lineItems: lineItems
        .filter((item) => item.description || item.amount || item.category)
        .map((item) => ({
          description: item.description,
          amount: Number(item.amount || 0),
          category: item.category || 'General',
        })),
    })
    navigate('/bills', { replace: true })
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900">New Bill</h3>
      <p className="mt-1 text-sm text-slate-500">Create a draft bill for approval workflow.</p>

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
          <Button type="submit">Save Draft</Button>
          <Button variant="secondary" onClick={() => navigate('/bills')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
