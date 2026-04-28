import { useRef, useState } from 'react'
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useI18n'
import { useAppStore } from '../../store/useAppStore'

const countries = ['Argentina', 'Uruguay', 'Chile', 'United States', 'Brazil']
const currencies = ['USD', 'ARS', 'UYU', 'CLP', 'BRL']
const MAX_AVATAR_BYTES = 600_000

function nameToInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const authUser = useAppStore((state) => state.authUser)
  const legalEntities = useAppStore((state) => state.legalEntities)
  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId)
  const addLegalEntity = useAppStore((state) => state.addLegalEntity)
  const updateAuthProfile = useAppStore((state) => state.updateAuthProfile)
  const setDefaultLegalEntity = useAppStore((state) => state.setDefaultLegalEntity)
  const deleteLegalEntity = useAppStore((state) => state.deleteLegalEntity)
  const paymentMethods = useAppStore((state) => state.paymentMethods)
  const addPaymentMethod = useAppStore((state) => state.addPaymentMethod)
  const deletePaymentMethod = useAppStore((state) => state.deletePaymentMethod)
  const erpAutoSyncEnabled = useAppStore((state) => state.erpAutoSyncEnabled)
  const setErpAutoSyncEnabled = useAppStore((state) => state.setErpAutoSyncEnabled)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(authUser?.name ?? 'Admin User')
  const [profileEmail, setProfileEmail] = useState(authUser?.email ?? 'admin@payr.co')
  const [profileAvatarDraft, setProfileAvatarDraft] = useState<string | null>(authUser?.avatarDataUrl ?? null)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)
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
      setError(t('settings.error.companyRequired'))
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
    updateAuthProfile({ name: profileName, email: profileEmail, avatarDataUrl: profileAvatarDraft })
    setIsEditingProfile(false)
    setAvatarError('')
  }

  const onCancelProfileEdit = () => {
    setProfileName(authUser?.name ?? 'Admin User')
    setProfileEmail(authUser?.email ?? 'admin@payr.co')
    setProfileAvatarDraft(authUser?.avatarDataUrl ?? null)
    setAvatarError('')
    setIsEditingProfile(false)
  }

  const onAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      setAvatarError(t('settings.error.avatarType'))
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t('settings.error.avatarTooLarge'))
      return
    }
    setAvatarError('')
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') setProfileAvatarDraft(result)
    }
    reader.readAsDataURL(file)
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
      setCardError(t('settings.error.cardRequired'))
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
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t('settings.account.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('settings.account.subtitle')}</p>
          </div>
          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => {
                setProfileAvatarDraft(authUser?.avatarDataUrl ?? null)
                setAvatarError('')
                setIsEditingProfile(true)
              }}
              className="rounded-lg border border-[var(--color-border)] p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label={t('settings.account.editAria')}
              title={t('settings.account.editTitle')}
            >
              <Pencil size={16} />
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={onSaveProfile} className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.profile.avatarLabel')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-slate-100 text-lg font-bold text-slate-600">
                  {profileAvatarDraft ? (
                    <img src={profileAvatarDraft} alt="" className="h-full w-full object-cover" />
                  ) : (
                    nameToInitials(profileName || 'A')
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={onAvatarFileChange}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {t('settings.profile.avatarChoose')}
                    </Button>
                    {profileAvatarDraft ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setProfileAvatarDraft(null)}>
                        {t('settings.profile.avatarRemove')}
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{t('settings.profile.avatarHint')}</p>
                  {avatarError ? <p className="text-xs text-red-600">{avatarError}</p> : null}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder={t('settings.profile.fullNamePlaceholder')}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <input
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                placeholder={t('settings.profile.emailPlaceholder')}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onCancelProfileEdit}>
                {t('settings.action.cancel')}
              </Button>
              <Button type="submit">{t('settings.action.save')}</Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-slate-200 text-sm font-bold text-slate-700">
                {authUser?.avatarDataUrl ? (
                  <img src={authUser.avatarDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  nameToInitials(authUser?.name ?? 'Admin User')
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('settings.profile.avatarLabel')}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {authUser?.avatarDataUrl
                    ? t('settings.profile.avatarCustom')
                    : t('settings.profile.avatarUsingInitials')}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.profile.name')}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{authUser?.name ?? 'Admin User'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.profile.email')}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{authUser?.email ?? 'user@payr.co'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.profile.role')}
              </p>
              <p className="mt-1 text-sm font-medium capitalize text-slate-900">{authUser?.role ?? 'admin'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.profile.status')}
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-600">{t('settings.profile.active')}</p>
            </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{t('settings.integrations.title')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('settings.integrations.subtitle')}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{t('settings.integrations.erpSync')}</p>
            <p className="text-xs text-slate-500">{t('settings.integrations.erpSyncHint')}</p>
          </div>
          <input
            type="checkbox"
            checked={erpAutoSyncEnabled}
            onChange={(e) => setErpAutoSyncEnabled(e.target.checked)}
            aria-label={t('settings.integrations.erpSync')}
            className="h-4 w-4"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('settings.payment.title')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('settings.payment.subtitle')}</p>
          </div>
          <Button
            onClick={() => {
              resetCardForm()
              setIsCardModalOpen(true)
            }}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} /> {t('settings.payment.addCard')}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-slate-600" />
                  <p className="text-sm font-semibold uppercase text-slate-800">
                    {method.brand === 'visa' ? 'VISA' : 'MASTERCARD'}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                  **** {method.last4}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-700">{method.holderName}</p>
                  <p className="text-xs text-slate-500">
                    {t('settings.payment.expires', { expiry: method.expiry })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deletePaymentMethod(method.id)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={t('settings.payment.deleteCardAria', { last4: method.last4 })}
                  title={t('settings.payment.deleteCardTitle')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('settings.companies.title')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('settings.companies.subtitle')}</p>
          </div>
          <Button
            onClick={() => {
              setError('')
              setIsCompanyModalOpen(true)
            }}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} /> {t('settings.companies.create')}
          </Button>
        </div>

        <div className="space-y-2">
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
                <p className="text-sm font-medium text-slate-800">{entity.name}</p>
                <p className="text-xs text-slate-500">
                  {entity.country} · {entity.taxId} · {entity.baseCurrency}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {entity.id === activeWorkspaceId && (
                  <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                    {t('settings.companies.active')}
                  </span>
                )}
                {entity.isDefault ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {t('settings.companies.default')}
                  </span>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setDefaultLegalEntity(entity.id)}>
                    {t('settings.companies.setDefault')}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => deleteLegalEntity(entity.id)}
                  disabled={legalEntities.length <= 1}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t('settings.companies.deleteAria', { name: entity.name })}
                  title={t('settings.companies.deleteTitle')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal title={t('settings.cardModal.title')} isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)}>
        <form onSubmit={onSubmitCard} className="grid gap-3 md:grid-cols-2">
          <select
            value={cardBrand}
            onChange={(event) => setCardBrand(event.target.value as 'visa' | 'mastercard')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          >
            <option value="visa">{t('settings.cardModal.visa')}</option>
            <option value="mastercard">{t('settings.cardModal.mastercard')}</option>
          </select>
          <input
            value={cardLast4}
            onChange={(event) => setCardLast4(event.target.value)}
            placeholder={t('settings.cardModal.last4Placeholder')}
            maxLength={4}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            value={cardHolderName}
            onChange={(event) => setCardHolderName(event.target.value)}
            placeholder={t('settings.cardModal.holderPlaceholder')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            value={cardExpiry}
            onChange={(event) => onExpiryChange(event.target.value)}
            placeholder={t('settings.cardModal.expiryPlaceholder')}
            inputMode="numeric"
            maxLength={5}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          {cardError && <p className="text-sm text-red-600 md:col-span-2">{cardError}</p>}
          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setIsCardModalOpen(false)}>
              {t('settings.cardModal.cancel')}
            </Button>
            <Button type="submit">{t('settings.cardModal.submit')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={t('settings.companyModal.title')}
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      >
        <form onSubmit={onCreateWorkspace} className="grid gap-3 md:grid-cols-2">
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder={t('settings.companyModal.namePlaceholder')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <input
            value={taxId}
            onChange={(event) => setTaxId(event.target.value)}
            placeholder={t('settings.companyModal.taxPlaceholder')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
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
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          >
            {currencies.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setIsCompanyModalOpen(false)}>
              {t('settings.companyModal.cancel')}
            </Button>
            <Button type="submit">{t('settings.companyModal.submit')}</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
