import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantApi } from '@/features/tenant/api/tenant-api'

export function useRestoreTenant() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => tenantApi.restore(tenantId),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
