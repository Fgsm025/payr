import { API_BASE_URL } from '@/lib/apiBaseUrl'
import type { ApiBillPayload } from '@/utils/mapApiBillToStore'

export function workspaceFetchHeaders(token: string, workspaceId: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'X-Entity-Id': workspaceId,
  }
}

export async function fetchBillsApi(token: string, workspaceId: string): Promise<ApiBillPayload[]> {
  const res = await fetch(`${API_BASE_URL}/bills`, {
    headers: workspaceFetchHeaders(token, workspaceId),
  })
  if (!res.ok) throw new Error('Failed to load bills')
  return res.json() as Promise<ApiBillPayload[]>
}

export type ApiVendorPayload = {
  id: string
  name: string
  email: string
  taxId?: string | null
  paymentTerms: number
  defaultCurrency?: string | null
  category?: string | null
}

export async function fetchVendorsApi(token: string, workspaceId: string): Promise<ApiVendorPayload[]> {
  const res = await fetch(`${API_BASE_URL}/vendors`, {
    headers: workspaceFetchHeaders(token, workspaceId),
  })
  if (!res.ok) throw new Error('Failed to load vendors')
  return res.json() as Promise<ApiVendorPayload[]>
}

export type DashboardSummary = {
  totalPayable: number
  pendingApproval: number
  overdue: number
  paidThisMonth: number
}

export async function fetchDashboardSummaryApi(token: string, workspaceId: string): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: workspaceFetchHeaders(token, workspaceId),
  })
  if (!res.ok) throw new Error('Failed to load dashboard summary')
  return res.json() as Promise<DashboardSummary>
}

export type ApAgingApiRow = {
  vendor: string
  current: number
  bucket_0_30: number
  bucket_31_60: number
  bucket_61_90: number
  bucket_90_plus: number
  total: number
}

export async function fetchDashboardApAgingApi(token: string, workspaceId: string): Promise<ApAgingApiRow[]> {
  const res = await fetch(`${API_BASE_URL}/dashboard/ap-aging`, {
    headers: workspaceFetchHeaders(token, workspaceId),
  })
  if (!res.ok) throw new Error('Failed to load AP aging')
  return res.json() as Promise<ApAgingApiRow[]>
}

export type ApiPayment = {
  id: string
  amount: number
  paymentDate: string
  method: string
  reference: string | null
  bill: { invoiceNumber: string; vendor: { name: string } }
}

export async function fetchPaymentsApi(token: string, workspaceId: string): Promise<ApiPayment[]> {
  const res = await fetch(`${API_BASE_URL}/payments`, {
    headers: workspaceFetchHeaders(token, workspaceId),
  })
  if (!res.ok) throw new Error('Failed to load payments')
  return res.json() as Promise<ApiPayment[]>
}

export async function fetchBillByIdApi(
  token: string,
  workspaceId: string,
  billId: string,
): Promise<ApiBillPayload> {
  const res = await fetch(`${API_BASE_URL}/bills/${billId}`, {
    headers: workspaceFetchHeaders(token, workspaceId),
  })
  if (!res.ok) throw new Error('Failed to load bill')
  return res.json() as Promise<ApiBillPayload>
}
