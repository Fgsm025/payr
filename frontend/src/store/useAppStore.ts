import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bill, BillStatus, Vendor } from '../data/mockData'
import { detectBrowserLocale, type Locale } from '../i18n/translations'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { queryClient } from '@/lib/queryClient'
import { workspaceQk } from '@/lib/workspaceQueryKeys'
import { trackEvent } from '@/lib/analytics'

export const DEFAULT_WORKSPACE_ID = 'company-x'

type BillAction = 'submit' | 'approve' | 'reject' | 'pay' | 'archive' | 'restore'
type SnackTone = 'success' | 'error' | 'info'

type Snack = {
  id: number
  message: string
  tone: SnackTone
}

type AuthUser = {
  id: string
  email: string
  name: string
  role: string
  /** Local-only profile photo (data URL), not synced with the API. */
  avatarDataUrl?: string
}

type LegalEntity = {
  id: string
  name: string
  taxId: string
  country: string
  baseCurrency: string
  isDefault: boolean
}

/** Matches the default seeded workspace (`company-x`) — first company in the app. */
const DEFAULT_LEGAL_ENTITY: LegalEntity = {
  id: DEFAULT_WORKSPACE_ID,
  name: 'Company X',
  taxId: '12-3456789',
  country: 'United States',
  baseCurrency: 'USD',
  isDefault: true,
}

const LEGACY_WORKSPACE_IDS = new Set(['xyz-ar', 'xyz-cl', 'xyz-uy'])

type PaymentMethod = {
  id: string
  brand: 'visa' | 'mastercard'
  last4: string
  holderName: string
  expiry: string
}

const billEventByAction: Partial<Record<BillAction, 'bill_submitted' | 'bill_approved' | 'bill_rejected' | 'bill_paid'>> = {
  submit: 'bill_submitted',
  approve: 'bill_approved',
  reject: 'bill_rejected',
  pay: 'bill_paid',
}

function workspaceHeaders(token: string, workspaceId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'X-Entity-Id': workspaceId,
  }
}

function invalidateWorkspaceQueries(workspaceId: string) {
  void queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
}

function syncCompanyXFromSeed(entities: LegalEntity[]): LegalEntity[] {
  return entities.map((e) =>
    e.id === DEFAULT_WORKSPACE_ID
      ? {
          ...e,
          name: DEFAULT_LEGAL_ENTITY.name,
          taxId: DEFAULT_LEGAL_ENTITY.taxId,
          country: DEFAULT_LEGAL_ENTITY.country,
          baseCurrency: DEFAULT_LEGAL_ENTITY.baseCurrency,
        }
      : e,
  )
}

function normalizePersistedWorkspace(raw: Record<string, unknown>) {
  const prev: LegalEntity[] = Array.isArray(raw.legalEntities) ? (raw.legalEntities as LegalEntity[]) : []
  const stripped = prev.filter((e) => !LEGACY_WORKSPACE_IDS.has(e.id))
  const hasCompanyX = stripped.some((e) => e.id === DEFAULT_WORKSPACE_ID)
  let next: LegalEntity[] = hasCompanyX ? stripped : [{ ...DEFAULT_LEGAL_ENTITY }, ...stripped]

  const defaultId = next.find((e) => e.isDefault)?.id ?? next[0]?.id ?? DEFAULT_WORKSPACE_ID
  next = next.map((e) => ({ ...e, isDefault: e.id === defaultId }))

  let wid = (raw.activeWorkspaceId as string) ?? (raw.selectedEntityId as string) ?? DEFAULT_WORKSPACE_ID
  if (LEGACY_WORKSPACE_IDS.has(wid)) wid = DEFAULT_WORKSPACE_ID
  if (!next.some((e) => e.id === wid)) wid = next[0]?.id ?? DEFAULT_WORKSPACE_ID

  raw.legalEntities = syncCompanyXFromSeed(next)
  raw.activeWorkspaceId = wid
}

const actionSnackCopy: Record<BillAction, { message: string; tone: SnackTone }> = {
  submit: { message: 'Bill submitted for approval.', tone: 'success' },
  approve: { message: 'Bill approved successfully.', tone: 'success' },
  reject: { message: 'Bill rejected and sent back to Drafts.', tone: 'info' },
  pay: { message: 'Payment recorded successfully.', tone: 'success' },
  archive: { message: 'Bill archived.', tone: 'info' },
  restore: { message: 'Bill restored to Drafts.', tone: 'success' },
}

type AppState = {
  vendors: Vendor[]
  addVendor: (input: { name: string; email: string; paymentTerms: number }) => void
  updateVendor: (vendorId: string, input: { name: string; email: string; paymentTerms: number }) => void
  deleteVendor: (vendorId: string) => void
  bills: Bill[]
  addBill: (input: Omit<Bill, 'id' | 'status' | 'history'>) => void
  transitionBill: (billId: string, action: BillAction, comment?: string) => Promise<boolean>
  snack: Snack | null
  showSnack: (message: string, tone?: SnackTone) => void
  clearSnack: () => void

  legalEntities: LegalEntity[]
  activeWorkspaceId: string
  setActiveWorkspaceId: (id: string) => void
  addLegalEntity: (input: { name: string; taxId: string; country: string; baseCurrency: string }) => void
  setDefaultLegalEntity: (id: string) => void
  deleteLegalEntity: (id: string) => void

  paymentMethods: PaymentMethod[]
  addMockPaymentMethod: () => void
  addPaymentMethod: (input: {
    brand: 'visa' | 'mastercard'
    last4: string
    holderName: string
    expiry: string
  }) => void
  deletePaymentMethod: (id: string) => void

  theme: 'light' | 'dark'
  toggleTheme: () => void
  erpAutoSyncEnabled: boolean
  setErpAutoSyncEnabled: (enabled: boolean) => void
  locale: Locale
  setLocale: (locale: Locale) => void

  layoutPageTitleOverride: string | null
  setLayoutPageTitleOverride: (title: string | null) => void

  isCreateBillModalOpen: boolean
  openCreateBillModal: () => void
  closeCreateBillModal: () => void

  isAuthenticated: boolean
  authToken: string | null
  authUser: AuthUser | null
  authExpiresAt: number | null
  login: (input: { email: string; password: string }) => Promise<boolean>
  updateAuthProfile: (input: { name: string; email: string; avatarDataUrl?: string | null }) => void
  logout: () => void
  bootstrapAuth: () => void
}

let autoLogoutTimer: ReturnType<typeof globalThis.setTimeout> | null = null

function scheduleAutoLogout(expMillis: number | null, logoutFn: () => void) {
  if (autoLogoutTimer) {
    globalThis.clearTimeout(autoLogoutTimer)
    autoLogoutTimer = null
  }
  if (!expMillis) return
  const msLeft = expMillis - Date.now()
  if (msLeft <= 0) {
    logoutFn()
    return
  }
  autoLogoutTimer = globalThis.setTimeout(() => logoutFn(), msLeft)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      vendors: [] as Vendor[],
      addVendor: (input) =>
        set((state) => {
          const vendor: Vendor = {
            id: `ven-${Date.now()}`,
            name: input.name.trim(),
            email: input.email.trim(),
            paymentTerms: input.paymentTerms,
          }
          return { vendors: [vendor, ...state.vendors] }
        }),
      updateVendor: (vendorId, input) =>
        set((state) => ({
          vendors: state.vendors.map((vendor) =>
            vendor.id === vendorId
              ? {
                  ...vendor,
                  name: input.name.trim(),
                  email: input.email.trim(),
                  paymentTerms: input.paymentTerms,
                }
              : vendor,
          ),
        })),
      deleteVendor: (vendorId) =>
        set((state) => ({
          vendors: state.vendors.filter((vendor) => vendor.id !== vendorId),
        })),
      bills: [] as Bill[],
      addBill: (input) =>
        set((state) => {
          const nextId = `bill-${state.bills.length + 1}`
          const bill: Bill = {
            ...input,
            id: nextId,
            status: 'draft',
            history: [{ status: 'draft', date: new Date().toISOString() }],
          }
          return { bills: [bill, ...state.bills] }
        }),
      snack: null,
      showSnack: (message, tone = 'success') =>
        set({
          snack: {
            id: Date.now(),
            message,
            tone,
          },
        }),
      clearSnack: () => set({ snack: null }),
      transitionBill: async (billId, action, comment) => {
        const transitionMap: Record<BillStatus, Partial<Record<BillAction, BillStatus>>> = {
          draft: { submit: 'pending_approval', archive: 'archived' },
          pending_approval: { approve: 'approved', reject: 'rejected', archive: 'archived' },
          approved: { pay: 'paid', archive: 'archived' },
          scheduled: { pay: 'paid', archive: 'archived' },
          paid: {},
          rejected: { submit: 'pending_approval', archive: 'archived' },
          archived: { restore: 'draft' },
        }

        const { authToken, logout, activeWorkspaceId } = get()
        if (authToken) {
          try {
            const response = await fetch(`${API_BASE_URL}/bills/${billId}/status`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...workspaceHeaders(authToken, activeWorkspaceId),
              },
              body: JSON.stringify({ action, comment }),
            })
            if (response.status === 401) {
              logout()
              return false
            }
            if (response.ok) {
              const eventName = billEventByAction[action]
              if (eventName) {
                trackEvent(eventName, {
                  bill_id: billId,
                  workspace_id: activeWorkspaceId,
                })
              }
              invalidateWorkspaceQueries(activeWorkspaceId)
              const nextSnack = actionSnackCopy[action]
              get().showSnack(nextSnack.message, nextSnack.tone)
              return true
            }
            return false
          } catch {
            return false
          }
        }

        let didChange = false
        set((state) => {
          const bills = state.bills.map((bill) => {
            if (bill.id !== billId) return bill
            const nextStatus = transitionMap[bill.status]?.[action]
            if (!nextStatus) return bill
            didChange = true
            return {
              ...bill,
              status: nextStatus,
              paidDate: action === 'pay' ? new Date().toISOString().slice(0, 10) : bill.paidDate,
              history: [
                ...(bill.history ?? [{ status: 'draft' as const, date: bill.invoiceDate }]),
                { status: nextStatus, date: new Date().toISOString(), comment },
              ],
            }
          })
          return { bills }
        })
        if (didChange) {
          const eventName = billEventByAction[action]
          if (eventName) {
            trackEvent(eventName, {
              bill_id: billId,
              workspace_id: activeWorkspaceId,
            })
          }
          const nextSnack = actionSnackCopy[action]
          get().showSnack(nextSnack.message, nextSnack.tone)
        }
        return didChange
      },

      legalEntities: [{ ...DEFAULT_LEGAL_ENTITY }],
      activeWorkspaceId: DEFAULT_WORKSPACE_ID,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      addLegalEntity: (input) =>
        set((state) => {
          const trimmed = input.name.trim()
          if (!trimmed) return state
          const exists = state.legalEntities.some((entity) => entity.name.toLowerCase() === trimmed.toLowerCase())
          if (exists) return state
          const id = `entity-${Date.now()}`
          return {
            legalEntities: [
              ...state.legalEntities,
              {
                id,
                name: trimmed,
                taxId: input.taxId.trim(),
                country: input.country,
                baseCurrency: input.baseCurrency,
                isDefault: false,
              },
            ],
            activeWorkspaceId: id,
          }
        }),
      setDefaultLegalEntity: (id) =>
        set((state) => ({
          legalEntities: state.legalEntities.map((entity) => ({
            ...entity,
            isDefault: entity.id === id,
          })),
        })),
      deleteLegalEntity: (id) =>
        set((state) => {
          if (state.legalEntities.length <= 1) return state

          const nextEntities = state.legalEntities.filter((entity) => entity.id !== id)
          if (nextEntities.length === state.legalEntities.length) return state

          const hasDefault = nextEntities.some((entity) => entity.isDefault)
          const legalEntities = hasDefault
            ? nextEntities
            : nextEntities.map((entity, index) => ({
                ...entity,
                isDefault: index === 0,
              }))

          const nextSelectedId =
            state.activeWorkspaceId === id ? legalEntities[0]?.id ?? state.activeWorkspaceId : state.activeWorkspaceId

          return {
            legalEntities,
            activeWorkspaceId: nextSelectedId,
          }
        }),

      paymentMethods: [
        {
          id: 'pm-visa-4242',
          brand: 'visa',
          last4: '4242',
          holderName: 'Admin User',
          expiry: '12/29',
        },
        {
          id: 'pm-mc-5454',
          brand: 'mastercard',
          last4: '5454',
          holderName: 'Admin User',
          expiry: '08/30',
        },
      ],
      addMockPaymentMethod: () =>
        set((state) => {
          const randomLast4 = String(Math.floor(1000 + Math.random() * 9000))
          const brand: 'visa' | 'mastercard' = Math.random() > 0.5 ? 'visa' : 'mastercard'
          return {
            paymentMethods: [
              ...state.paymentMethods,
              {
                id: `pm-${brand}-${Date.now()}`,
                brand,
                last4: randomLast4,
                holderName: state.authUser?.name ?? 'Admin User',
                expiry: '10/31',
              },
            ],
          }
        }),
      addPaymentMethod: (input) =>
        set((state) => ({
          paymentMethods: [
            ...state.paymentMethods,
            {
              id: `pm-${input.brand}-${Date.now()}`,
              brand: input.brand,
              last4: input.last4,
              holderName: input.holderName.trim(),
              expiry: input.expiry.trim(),
            },
          ],
        })),
      deletePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((method) => method.id !== id),
        })),

      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      erpAutoSyncEnabled: false,
      setErpAutoSyncEnabled: (enabled) => set({ erpAutoSyncEnabled: enabled }),
      locale: detectBrowserLocale(),
      setLocale: (locale) => set({ locale }),

      layoutPageTitleOverride: null,
      setLayoutPageTitleOverride: (title) => set({ layoutPageTitleOverride: title }),

      isCreateBillModalOpen: false,
      openCreateBillModal: () => set({ isCreateBillModalOpen: true }),
      closeCreateBillModal: () => set({ isCreateBillModalOpen: false }),

      isAuthenticated: false,
      authToken: null,
      authUser: null,
      authExpiresAt: null,
      login: async ({ email, password }) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          if (!response.ok) return false

          const data = await response.json()
          const expiresAt = Date.now() + Number(data.expiresIn ?? 0) * 1000
          const prev = get().authUser
          const authUser =
            prev && prev.id === data.user.id && prev.avatarDataUrl
              ? { ...data.user, avatarDataUrl: prev.avatarDataUrl }
              : data.user

          set({
            isAuthenticated: true,
            authToken: data.accessToken,
            authUser,
            authExpiresAt: expiresAt,
          })

          scheduleAutoLogout(expiresAt, get().logout)
          return true
        } catch {
          return false
        }
      },
      updateAuthProfile: ({ name, email, avatarDataUrl }) =>
        set((state) => {
          if (!state.authUser) return state
          const next: AuthUser = {
            ...state.authUser,
            name: name.trim() || state.authUser.name,
            email: email.trim() || state.authUser.email,
          }
          if (avatarDataUrl !== undefined) {
            next.avatarDataUrl = avatarDataUrl ?? undefined
          }
          return { authUser: next }
        }),
      logout: () => {
        if (autoLogoutTimer) {
          globalThis.clearTimeout(autoLogoutTimer)
          autoLogoutTimer = null
        }
        queryClient.removeQueries({ queryKey: workspaceQk.all })
        set({
          isAuthenticated: false,
          authToken: null,
          authUser: null,
          authExpiresAt: null,
          isCreateBillModalOpen: false,
          layoutPageTitleOverride: null,
        })
      },
      bootstrapAuth: () => {
        const state = get()
        if (!state.authToken || !state.authExpiresAt || state.authExpiresAt <= Date.now()) {
          state.logout()
          return
        }
        set({ isAuthenticated: true })
        scheduleAutoLogout(state.authExpiresAt, state.logout)
      },
    }),
    {
      name: 'billpay-store',
      version: 5,
      migrate: (persisted, fromVersion = 0) => {
        if (!persisted || typeof persisted !== 'object') return persisted
        const raw = { ...(persisted as Record<string, unknown>) }
        const v = fromVersion
        if (v < 1) {
          const p = raw as { activeWorkspaceId?: string; selectedEntityId?: string }
          raw.activeWorkspaceId = p.activeWorkspaceId ?? p.selectedEntityId ?? DEFAULT_WORKSPACE_ID
        }
        if (v < 2) {
          normalizePersistedWorkspace(raw)
        }
        if (v < 3 && Array.isArray(raw.legalEntities)) {
          raw.legalEntities = syncCompanyXFromSeed(raw.legalEntities as LegalEntity[])
        }
        if (v < 4) {
          const loc = raw.locale
          raw.locale =
            loc === 'en' || loc === 'es' ? loc : detectBrowserLocale()
        }
        if (v < 5) {
          raw.erpAutoSyncEnabled = false
        }
        if (typeof raw.erpAutoSyncEnabled !== 'boolean') {
          raw.erpAutoSyncEnabled = false
        }
        return raw
      },
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        legalEntities: state.legalEntities,
        paymentMethods: state.paymentMethods,
        theme: state.theme,
        erpAutoSyncEnabled: state.erpAutoSyncEnabled,
        locale: state.locale,
        authToken: state.authToken,
        authUser: state.authUser,
        authExpiresAt: state.authExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
