import { useState, useEffect } from 'react';

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
  const [kpis, setKpis] = useState<KPIType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
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
      const data = await res.json();
      setKpis(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
    const interval = setInterval(fetchKPIs, 10000);
    return () => clearInterval(interval);
  }, []);

  return { kpis, loading, error, refetch: fetchKPIs };
}
