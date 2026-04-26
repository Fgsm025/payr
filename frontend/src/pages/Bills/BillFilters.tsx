import { useTranslation } from '../../i18n/useI18n'

type BillFiltersProps = {
  search: string
  vendorFilter: string
  vendors: Array<{ id: string; name: string }>
  dateFrom: string
  dateTo: string
  onChange: (key: 'search' | 'vendorFilter' | 'dateFrom' | 'dateTo', value: string) => void
}

export default function BillFilters({ search, vendorFilter, vendors, dateFrom, dateTo, onChange }: Readonly<BillFiltersProps>) {
  const { t } = useTranslation()
  return (
    <div className="mb-4 grid gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_minmax(220px,1fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)]">
      <input
        type="text"
        placeholder={t('bills.filters.searchPlaceholder')}
        value={search}
        onChange={(e) => onChange('search', e.target.value)}
        className="min-w-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <select
        value={vendorFilter}
        onChange={(e) => onChange('vendorFilter', e.target.value)}
        className="min-w-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
      >
        <option value="all">{t('bills.filters.allVendors')}</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onChange('dateFrom', e.target.value)}
        className="min-w-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onChange('dateTo', e.target.value)}
        className="min-w-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
      />
    </div>
  )
}
