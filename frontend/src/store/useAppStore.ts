import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { bills as initialBills, vendors as initialVendors, type Bill, type BillStatus, type Vendor } from '../data/mockData'

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

type AppState = {
  vendors: Vendor[]
  bills: Bill[]
  addBill: (input: Omit<Bill, 'id' | 'status' | 'history'>) => void
  addBillFromApi: (input: {
    id: string
    vendorId: string
    invoiceNumber: string
    invoiceDate: string
    dueDate: string
    amount: number
    notes?: string
    status: BillStatus
  }) => void
  transitionBill: (billId: string, action: BillAction, comment?: string) => void

  legalEntities: LegalEntity[]
  selectedEntityId: string
  setSelectedEntityId: (id: string) => void
  addLegalEntity: (input: { name: string; taxId: string; country: string; baseCurrency: string }) => void
  setDefaultLegalEntity: (id: string) => void
  deleteLegalEntity: (id: string) => void

  theme: 'light' | 'dark'
  toggleTheme: () => void

  isCreateBillModalOpen: boolean
  openCreateBillModal: () => void
  closeCreateBillModal: () => void

  isAuthenticated: boolean
  authToken: string | null
  authUser: AuthUser | null
  authExpiresAt: number | null
  login: (input: { email: string; password: string }) => Promise<boolean>
  logout: () => void
  bootstrapAuth: () => void
}

let autoLogoutTimer: number | null = null

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
      vendors: initialVendors,
      bills: initialBills,
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
      addBillFromApi: (input) =>
        set((state) => {
          const exists = state.bills.some((bill) => bill.id === input.id)
          if (exists) return { bills: state.bills }
          const bill: Bill = {
            ...input,
            history: [{ status: input.status, date: new Date().toISOString() }],
          }
          return { bills: [bill, ...state.bills] }
        }),
      transitionBill: (billId, action, comment) =>
        set((state) => {
          const transitionMap: Record<BillStatus, Partial<Record<BillAction, BillStatus>>> = {
            draft: { submit: 'pending_approval', archive: 'archived' },
            pending_approval: { approve: 'approved', reject: 'rejected', archive: 'archived' },
            approved: { pay: 'paid', archive: 'archived' },
            scheduled: { pay: 'paid', archive: 'archived' },
            paid: {},
            rejected: {},
            archived: {},
          }

          const bills = state.bills.map((bill) => {
            if (bill.id !== billId) return bill
            const nextStatus = transitionMap[bill.status]?.[action]
            if (!nextStatus) return bill
            return {
              ...bill,
              status: nextStatus,
              paidDate: action === 'pay' ? new Date().toISOString().slice(0, 10) : bill.paidDate,
              history: [
                ...(bill.history ?? [{ status: 'draft', date: bill.invoiceDate }]),
                { status: nextStatus, date: new Date().toISOString(), comment },
              ],
            }
          })
          return { bills }
        }),

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
      selectedEntityId: 'xyz-ar',
      setSelectedEntityId: (id) => set({ selectedEntityId: id }),
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
            state.selectedEntityId === id ? legalEntities[0]?.id ?? state.selectedEntityId : state.selectedEntityId

          return {
            legalEntities,
            selectedEntityId: nextSelectedId,
          }
        }),

      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      isCreateBillModalOpen: false,
      openCreateBillModal: () => set({ isCreateBillModalOpen: true }),
      closeCreateBillModal: () => set({ isCreateBillModalOpen: false }),

      isAuthenticated: false,
      authToken: null,
      authUser: null,
      authExpiresAt: null,
      login: async ({ email, password }) => {
        try {
          const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
          const response = await fetch(`${apiBase}/auth/login`, {
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
      logout: () => {
        if (autoLogoutTimer) {
          globalThis.clearTimeout(autoLogoutTimer)
          autoLogoutTimer = null
        }
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
      partialize: (state) => ({
        selectedEntityId: state.selectedEntityId,
        legalEntities: state.legalEntities,
        theme: state.theme,
        authToken: state.authToken,
        authUser: state.authUser,
        authExpiresAt: state.authExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
