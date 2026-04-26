import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { workspaceQk } from '@/lib/workspaceQueryKeys'
import {
  fetchBillByIdApi,
  fetchBillsApi,
  fetchDashboardApAgingApi,
  fetchDashboardSummaryApi,
  fetchPaymentsApi,
  fetchVendorsApi,
} from '@/lib/workspaceApi'

export function useWorkspaceBillsQuery() {
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)

  return useQuery({
    queryKey: workspaceQk.bills(activeWorkspaceId),
    queryFn: async () => {
      const list = await fetchBillsApi(authToken!, activeWorkspaceId)
      return list
    },
    enabled: Boolean(authToken && activeWorkspaceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useWorkspaceVendorsQuery() {
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)

  return useQuery({
    queryKey: workspaceQk.vendors(activeWorkspaceId),
    queryFn: () => fetchVendorsApi(authToken!, activeWorkspaceId),
    enabled: Boolean(authToken && activeWorkspaceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useWorkspaceBillQuery(billId: string | undefined) {
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)

  return useQuery({
    queryKey: workspaceQk.bill(activeWorkspaceId, billId ?? ''),
    queryFn: () => fetchBillByIdApi(authToken!, activeWorkspaceId, billId!),
    enabled: Boolean(authToken && activeWorkspaceId && billId),
    staleTime: 15_000,
  })
}

export function useDashboardSummaryQuery() {
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)

  return useQuery({
    queryKey: workspaceQk.dashboardSummary(activeWorkspaceId),
    queryFn: () => fetchDashboardSummaryApi(authToken!, activeWorkspaceId),
    enabled: Boolean(authToken && activeWorkspaceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useDashboardApAgingQuery() {
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)

  return useQuery({
    queryKey: workspaceQk.dashboardApAging(activeWorkspaceId),
    queryFn: () => fetchDashboardApAgingApi(authToken!, activeWorkspaceId),
    enabled: Boolean(authToken && activeWorkspaceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function usePaymentsQuery() {
  const authToken = useAppStore((s) => s.authToken)
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)

  return useQuery({
    queryKey: workspaceQk.payments(activeWorkspaceId),
    queryFn: () => fetchPaymentsApi(authToken!, activeWorkspaceId),
    enabled: Boolean(authToken && activeWorkspaceId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
