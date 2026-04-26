export const workspaceQk = {
  all: ['workspace'] as const,
  bills: (workspaceId: string) => ['workspace', workspaceId, 'bills'] as const,
  vendors: (workspaceId: string) => ['workspace', workspaceId, 'vendors'] as const,
  bill: (workspaceId: string, billId: string) => ['workspace', workspaceId, 'bill', billId] as const,
  dashboardSummary: (workspaceId: string) => ['workspace', workspaceId, 'dashboard', 'summary'] as const,
  dashboardApAging: (workspaceId: string) => ['workspace', workspaceId, 'dashboard', 'ap-aging'] as const,
  payments: (workspaceId: string) => ['workspace', workspaceId, 'payments'] as const,
}
