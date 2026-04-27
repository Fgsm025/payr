import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { workspaceQk } from '@/lib/workspaceQueryKeys'
import { API_BASE_URL } from '@/lib/apiBaseUrl'
import { workspaceFetchHeaders } from '@/lib/workspaceApi'

export function useCreateVendorMutation() {
  const qc = useQueryClient()
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const logout = useAppStore((s) => s.logout)

  return useMutation({
    mutationFn: async (body: {
      name: string
      email: string
      taxId?: string
      paymentTerms: number
      defaultCurrency: string
      category: string
    }) => {
      if (!authToken) throw new Error('Not authenticated')
      const res = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...workspaceFetchHeaders(authToken, activeWorkspaceId) },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        logout()
        throw new Error('Unauthorized')
      }
      if (!res.ok) throw new Error('Failed to create vendor')
      return res.json()
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workspaceQk.vendors(activeWorkspaceId) })
    },
  })
}

export function useUpdateVendorMutation() {
  const qc = useQueryClient()
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const logout = useAppStore((s) => s.logout)

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: {
        name: string
        email: string
        taxId?: string
        paymentTerms: number
        defaultCurrency: string
        category: string
      }
    }) => {
      if (!authToken) throw new Error('Not authenticated')
      const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...workspaceFetchHeaders(authToken, activeWorkspaceId) },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        logout()
        throw new Error('Unauthorized')
      }
      if (!res.ok) throw new Error('Failed to update vendor')
      return res.json()
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workspaceQk.vendors(activeWorkspaceId) })
    },
  })
}

export function useDeleteVendorMutation() {
  const qc = useQueryClient()
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const logout = useAppStore((s) => s.logout)

  return useMutation({
    mutationFn: async (id: string) => {
      if (!authToken) throw new Error('Not authenticated')
      const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers: workspaceFetchHeaders(authToken, activeWorkspaceId),
      })
      if (res.status === 401) {
        logout()
        throw new Error('Unauthorized')
      }
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Failed to delete vendor')
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workspaceQk.vendors(activeWorkspaceId) })
    },
  })
}
