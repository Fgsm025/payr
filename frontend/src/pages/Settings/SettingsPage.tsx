import { useState } from 'react'
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAppStore } from '../../store/useAppStore'

const countries = ['Argentina', 'Uruguay', 'Chile', 'United States', 'Brazil']
const currencies = ['USD', 'ARS', 'UYU', 'CLP', 'BRL']

export default function SettingsPage() {
  const authUser = useAppStore((state) => state.authUser)
  const legalEntities = useAppStore((state) => state.legalEntities)
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId)
  const addLegalEntity = useAppStore((state) => state.addLegalEntity)
  const updateAuthProfile = useAppStore((state) => state.updateAuthProfile)
  const setDefaultLegalEntity = useAppStore(
    (state) => state.setDefaultLegalEntity,
  )
  const deleteLegalEntity = useAppStore((state) => state.deleteLegalEntity)
  const paymentMethods = useAppStore((state) => state.paymentMethods)
  const addPaymentMethod = useAppStore((state) => state.addPaymentMethod)
  const deletePaymentMethod = useAppStore((state) => state.deletePaymentMethod)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(authUser?.name ?? 'Admin User')
  const [profileEmail, setProfileEmail] = useState(
    authUser?.email ?? 'admin@payr.co',
  )
  const [workspaceName, setWorkspaceName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [country, setCountry] = useState(countries[0])
  const [baseCurrency, setBaseCurrency] = useState(currencies[0])
  const [error, setError] = useState('')
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard'>('visa')
  const [cardLast4, setCardLast4] = useState('')
  const [cardHolderName, setCardHolderName] = useState(authUser?.name ?? 'Admin User')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardError, setCardError] = useState('')

  const onCreateWorkspace = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nameValue = workspaceName.trim()
    const taxIdValue = taxId.trim()
    if (!nameValue || !taxIdValue) {
      setError('Name and Tax ID are required.')
      return
    }
    addLegalEntity({
      name: nameValue,
      taxId: taxIdValue,
      country,
      baseCurrency,
    })
    setWorkspaceName('')
    setTaxId('')
    setCountry(countries[0])
    setBaseCurrency(currencies[0])
    setError('')
    setIsCompanyModalOpen(false)
  }

  const onSaveProfile = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateAuthProfile({ name: profileName, email: profileEmail })
    setIsEditingProfile(false)
  }

  const onCancelProfileEdit = () => {
    setProfileName(authUser?.name ?? 'Admin User')
    setProfileEmail(authUser?.email ?? 'admin@payr.co')
    setIsEditingProfile(false)
  }

  const resetCardForm = () => {
    setCardBrand('visa')
    setCardLast4('')
    setCardHolderName(authUser?.name ?? 'Admin User')
    setCardExpiry('')
    setCardError('')
  }

  const onSubmitCard = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const last4 = cardLast4.trim()
    const holder = cardHolderName.trim()
    const expiry = cardExpiry.trim()
    if (!/^\d{4}$/.test(last4) || !holder || !expiry) {
      setCardError('Brand, 4 digits, cardholder, and expiry are required.')
      return
    }
    addPaymentMethod({
      brand: cardBrand,
      last4,
      holderName: holder,
      expiry,
    })
    setIsCardModalOpen(false)
    resetCardForm()
  }

  const onExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) {
      setCardExpiry(digits)
      return
    }
    setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`)
  }

  return (
    <section className='space-y-6'>
      <div className='rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-xl font-semibold text-slate-900'>
              Account settings
            </h2>
            <p className='mt-1 text-sm text-slate-500'>
              Manage your profile and companies access.
            </p>
          </div>
          {!isEditingProfile && (
            <button
              type='button'
              onClick={() => setIsEditingProfile(true)}
              className='rounded-lg border border-[var(--color-border)] p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700'
              aria-label='Edit account profile'
              title='Edit profile'
            >
              <Pencil size={16} />
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={onSaveProfile} className='mt-6 space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder='Full name'
                className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
              />
              <input
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                placeholder='Email'
                className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
              />
            </div>
            <div className='flex items-center justify-end gap-2'>
              <Button
                type='button'
                variant='secondary'
                onClick={onCancelProfileEdit}
              >
                Cancel
              </Button>
              <Button type='submit'>Save changes</Button>
            </div>
          </form>
        ) : (
          <div className='mt-6 grid gap-4 md:grid-cols-2'>
            <div>
              <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                Name
              </p>
              <p className='mt-1 text-sm font-medium text-slate-900'>
                {authUser?.name ?? 'Admin User'}
              </p>
            </div>
            <div>
              <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                Email
              </p>
              <p className='mt-1 text-sm font-medium text-slate-900'>
                {authUser?.email ?? 'user@payr.co'}
              </p>
            </div>
            <div>
              <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                Role
              </p>
              <p className='mt-1 text-sm font-medium capitalize text-slate-900'>
                {authUser?.role ?? 'admin'}
              </p>
            </div>
            <div>
              <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                Status
              </p>
              <p className='mt-1 text-sm font-medium text-emerald-600'>
                Active
              </p>
            </div>
          </div>
        )}
      </div>

      <div className='rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h3 className='text-lg font-semibold text-slate-900'>Payment Methods</h3>
            <p className='mt-1 text-sm text-slate-500'>Cards used to fund outgoing bill payments.</p>
          </div>
          <Button
            onClick={() => {
              resetCardForm()
              setIsCardModalOpen(true)
            }}
            className='flex items-center gap-1.5'
          >
            <Plus size={14} /> Add Card
          </Button>
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className='rounded-xl border border-[var(--color-border)] bg-slate-50 p-4'
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <CreditCard size={16} className='text-slate-600' />
                  <p className='text-sm font-semibold uppercase text-slate-800'>
                    {method.brand === 'visa' ? 'VISA' : 'MASTERCARD'}
                  </p>
                </div>
                <span className='rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600'>
                  **** {method.last4}
                </span>
              </div>
              <div className='mt-3 flex items-end justify-between gap-3'>
                <div>
                  <p className='text-sm text-slate-700'>{method.holderName}</p>
                  <p className='text-xs text-slate-500'>Expires {method.expiry}</p>
                </div>
                <button
                  type='button'
                  onClick={() => deletePaymentMethod(method.id)}
                  className='rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600'
                  aria-label={`Delete card ending in ${method.last4}`}
                  title='Delete card'
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h3 className='text-lg font-semibold text-slate-900'>Companies</h3>
            <p className='mt-1 text-sm text-slate-500'>
              Create and manage sub-companies for your finance team.
            </p>
          </div>
          <Button
            onClick={() => {
              setError('')
              setIsCompanyModalOpen(true)
            }}
            className='flex items-center gap-1.5'
          >
            <Plus size={14} /> Create company
          </Button>
        </div>

        <div className='space-y-2'>
          {legalEntities.map((entity) => (
            <div
              key={entity.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                entity.id === activeWorkspaceId
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)] bg-slate-50'
              }`}
            >
              <div>
                <p className='text-sm font-medium text-slate-800'>
                  {entity.name}
                </p>
                <p className='text-xs text-slate-500'>
                  {entity.country} · {entity.taxId} · {entity.baseCurrency}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                {entity.id === activeWorkspaceId && (
                  <span className='rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]'>
                    Active
                  </span>
                )}
                {entity.isDefault ? (
                  <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700'>
                    Default
                  </span>
                ) : (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setDefaultLegalEntity(entity.id)}
                  >
                    Set default
                  </Button>
                )}
                <button
                  type='button'
                  onClick={() => deleteLegalEntity(entity.id)}
                  disabled={legalEntities.length <= 1}
                  className='rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label={`Delete ${entity.name}`}
                  title='Delete company'
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <Modal
        title='Add card'
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      >
        <form onSubmit={onSubmitCard} className='grid gap-3 md:grid-cols-2'>
          <select
            value={cardBrand}
            onChange={(event) => setCardBrand(event.target.value as 'visa' | 'mastercard')}
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          >
            <option value='visa'>Visa</option>
            <option value='mastercard'>Mastercard</option>
          </select>
          <input
            value={cardLast4}
            onChange={(event) => setCardLast4(event.target.value)}
            placeholder='Last 4 digits'
            maxLength={4}
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          />
          <input
            value={cardHolderName}
            onChange={(event) => setCardHolderName(event.target.value)}
            placeholder='Cardholder name'
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          />
          <input
            value={cardExpiry}
            onChange={(event) => onExpiryChange(event.target.value)}
            placeholder='Expiry (MM/YY)'
            inputMode='numeric'
            maxLength={5}
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          />
          {cardError && <p className='text-sm text-red-600 md:col-span-2'>{cardError}</p>}
          <div className='md:col-span-2 flex justify-end gap-2 pt-1'>
            <Button type='button' variant='secondary' onClick={() => setIsCardModalOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Add card</Button>
          </div>
        </form>
      </Modal>

      <Modal
        title='Create company'
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      >
        <form onSubmit={onCreateWorkspace} className='grid gap-3 md:grid-cols-2'>
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder='New company name'
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          />
          <input
            value={taxId}
            onChange={(event) => setTaxId(event.target.value)}
            placeholder='Tax ID / RUT / CUIT'
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          />
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          >
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={baseCurrency}
            onChange={(event) => setBaseCurrency(event.target.value)}
            className='w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          >
            {currencies.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {error && <p className='text-sm text-red-600 md:col-span-2'>{error}</p>}
          <div className='md:col-span-2 flex justify-end gap-2 pt-1'>
            <Button type='button' variant='secondary' onClick={() => setIsCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Create company</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
