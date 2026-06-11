import { useQuery } from '@tanstack/react-query';

const GATEWAY_URL = 'http://localhost:8085';

export interface KPIType {
  total_orders: number;
  total_revenue: number;
  total_delivered_orders: number;
  total_cancelled_orders: number;
  payment_success_rate: number;
  avg_delivery_seconds: number;
}

export function useKPIs() {
  const { data: kpis, isLoading: loading, error, refetch } = useQuery<KPIType, Error>({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await fetch(`${GATEWAY_URL}/admin/kpis`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch platform KPIs');
      }
      return res.json();
    },
    refetchInterval: 10000,
  });

  return { kpis: kpis || null, loading, error: error?.message || null, refetch };
}
