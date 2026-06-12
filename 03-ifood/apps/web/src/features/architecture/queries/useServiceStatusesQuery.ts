import { useQuery } from '@tanstack/react-query';
import { architectureClient } from '../api/architectureClient';

export function useServiceStatusesQuery() {
  return useQuery<Record<string, string>>({
    queryKey: ['serviceStatuses'],
    queryFn: async () => {
      return await architectureClient.getServiceStatuses();
    },
    refetchInterval: 5000, // Poll every 5s to keep UI updated
  });
}
