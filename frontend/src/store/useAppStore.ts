import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bill, BillStatus, Vendor } from '../data/mockData'
import type { Locale } from '../i18n/translations'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { queryClient } from '@/lib/queryClient'
import { workspaceQk } from '@/lib/workspaceQueryKeys'

type BillAction = 'submit' | 'approve' | 'reject' | 'pay' | 'archive'

type AuthUser = {
  id: string
  email: string
  name: string
  role: string
}

type LegalEntity = {
  id: string
  name: string
  taxId: string
  country: string
  baseCurrency: string
  isDefault: boolean
}

type PaymentMethod = {
  id: string
  brand: 'visa' | 'mastercard'
  last4: string
  holderName: string
  expiry: string
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

type AppState = {
  vendors: Vendor[]
  addVendor: (input: { name: string; email: string; paymentTerms: number }) => void
  updateVendor: (vendorId: string, input: { name: string; email: string; paymentTerms: number }) => void
  deleteVendor: (vendorId: string) => void
  bills: Bill[]
  addBill: (input: Omit<Bill, 'id' | 'status' | 'history'>) => void
  transitionBill: (billId: string, action: BillAction, comment?: string) => Promise<void>

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
  locale: Locale
  setLocale: (locale: Locale) => void

  isCreateBillModalOpen: boolean
  openCreateBillModal: () => void
  closeCreateBillModal: () => void

  isAuthenticated: boolean
  authToken: string | null
  authUser: AuthUser | null
  authExpiresAt: number | null
  login: (input: { email: string; password: string }) => Promise<boolean>
  updateAuthProfile: (input: { name: string; email: string }) => void
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
      transitionBill: async (billId, action, comment) => {
        const transitionMap: Record<BillStatus, Partial<Record<BillAction, BillStatus>>> = {
          draft: { submit: 'pending_approval', archive: 'archived' },
          pending_approval: { approve: 'approved', reject: 'rejected', archive: 'archived' },
          approved: { pay: 'paid', archive: 'archived' },
          scheduled: { pay: 'paid', archive: 'archived' },
          paid: {},
          rejected: {},
          archived: {},
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
              return
            }
            if (response.ok) {
              invalidateWorkspaceQueries(activeWorkspaceId)
              return
            }
          } catch {
            /* fall back to local transition */
          }
        }

        set((state) => {
          const bills = state.bills.map((bill) => {
            if (bill.id !== billId) return bill
            const nextStatus = transitionMap[bill.status]?.[action]
            if (!nextStatus) return bill
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
      },

      legalEntities: [
        {
          id: 'xyz-ar',
          name: 'XYZ Argentina S.A.',
          taxId: '30-12345678-9',
          country: 'Argentina',
          baseCurrency: 'ARS',
          isDefault: true,
        },
        {
          id: 'xyz-cl',
          name: 'XYZ Chile SpA',
          taxId: '76.123.456-7',
          country: 'Chile',
          baseCurrency: 'CLP',
          isDefault: false,
        },
        {
          id: 'xyz-uy',
          name: 'XYZ Uruguay S.A.',
          taxId: '218765430019',
          country: 'Uruguay',
          baseCurrency: 'UYU',
          isDefault: false,
        },
      ],
      activeWorkspaceId: 'xyz-ar',
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      addLegalEntity: (input) =>
        set((state) => {
          const trimmed = input.name.trim()
          if (!trimmed) return state
          const exists = state.legalEntities.some((entity) => entity.name.toLowerCase() === trimmed.toLowerCase())
          if (exists) return state
          return {
            legalEntities: [
              ...state.legalEntities,
              {
                id: `entity-${Date.now()}`,
                name: trimmed,
                taxId: input.taxId.trim(),
                country: input.country,
                baseCurrency: input.baseCurrency,
                isDefault: false,
              },
            ],
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
      locale: 'en',
      setLocale: (locale) => set({ locale }),

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

          set({
            isAuthenticated: true,
            authToken: data.accessToken,
            authUser: data.user,
            authExpiresAt: expiresAt,
          })

          scheduleAutoLogout(expiresAt, get().logout)
          return true
        } catch {
          return false
        }
      },
      updateAuthProfile: ({ name, email }) =>
        set((state) => {
          if (!state.authUser) return state
          return {
            authUser: {
              ...state.authUser,
              name: name.trim() || state.authUser.name,
              email: email.trim() || state.authUser.email,
            },
          }
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
      version: 1,
      migrate: (persisted, version) => {
        if (version < 1 && persisted && typeof persisted === 'object') {
          const p = persisted as { activeWorkspaceId?: string; selectedEntityId?: string }
          return {
            ...persisted,
            activeWorkspaceId: p.activeWorkspaceId ?? p.selectedEntityId ?? 'xyz-ar',
          }
        }
        return persisted
      },
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        legalEntities: state.legalEntities,
        paymentMethods: state.paymentMethods,
        theme: state.theme,
        locale: state.locale,
        authToken: state.authToken,
        authUser: state.authUser,
        authExpiresAt: state.authExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
