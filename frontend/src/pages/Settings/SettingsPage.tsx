import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'

const countries = ['Argentina', 'Uruguay', 'Chile', 'United States', 'Brazil']
const currencies = ['USD', 'ARS', 'UYU', 'CLP', 'BRL']

export default function SettingsPage() {
  const authUser = useAppStore((state) => state.authUser)
  const legalEntities = useAppStore((state) => state.legalEntities)
  const selectedEntityId = useAppStore((state) => state.selectedEntityId)
  const addLegalEntity = useAppStore((state) => state.addLegalEntity)
  const updateAuthProfile = useAppStore((state) => state.updateAuthProfile)
  const setDefaultLegalEntity = useAppStore(
    (state) => state.setDefaultLegalEntity,
  )
  const deleteLegalEntity = useAppStore((state) => state.deleteLegalEntity)
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
        <h3 className='text-lg font-semibold text-slate-900'>Companies</h3>
        <p className='mt-1 text-sm text-slate-500'>
          Create and manage sub-companies for your finance team.
        </p>

        <div className='mt-5 space-y-2'>
          {legalEntities.map((entity) => (
            <div
              key={entity.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                entity.id === selectedEntityId
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
                {entity.id === selectedEntityId && (
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

        <form
          onSubmit={onCreateWorkspace}
          className='mt-5 grid gap-3 md:grid-cols-2'
        >
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
          <Button type='submit' className='md:col-span-2'>
            Create company
          </Button>
        </form>
        {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}
      </div>
    </section>
  )
}
