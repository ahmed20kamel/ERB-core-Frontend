import { useQueries } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

async function fetchCount(url: string, params: Record<string, unknown>): Promise<number> {
  const res = await apiClient.get(url, { params: { ...params, page: 1, page_size: 1 } });
  return res.data?.count ?? 0;
}

export interface PendingCounts {
  pr:        number;
  po:        number;
  quotation: number;
  invoice:   number;
}

export function usePendingCounts(): PendingCounts {
  const results = useQueries({
    queries: [
      {
        queryKey: ['pending-count', 'pr'],
        queryFn: () => fetchCount('/purchase-requests/', { status: 'pending' }),
        staleTime: 0,
        refetchInterval: 60_000,
      },
      {
        queryKey: ['pending-count', 'po'],
        queryFn: () => fetchCount('/purchase-orders/', { status: 'pending' }),
        staleTime: 0,
        refetchInterval: 60_000,
      },
      {
        queryKey: ['pending-count', 'quotation'],
        queryFn: () => fetchCount('/purchase-quotations/', { status: 'pending' }),
        staleTime: 0,
        refetchInterval: 60_000,
      },
      {
        queryKey: ['pending-count', 'invoice'],
        queryFn: () => fetchCount('/purchase-invoices/', { status: 'pending' }),
        staleTime: 0,
        refetchInterval: 60_000,
      },
    ],
  });

  return {
    pr:        results[0].data ?? 0,
    po:        results[1].data ?? 0,
    quotation: results[2].data ?? 0,
    invoice:   results[3].data ?? 0,
  };
}
