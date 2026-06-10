import { useQuery } from '@tanstack/react-query';
import { SearchResultsData, searchResultsSchema } from '../schemas/searchSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useSearchQuery(query: string) {
  return useQuery<SearchResultsData>({
    queryKey: ['search', query],
    queryFn: async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        return { restaurants: [], menu_items: [] };
      }
      const res = await fetch(`${GATEWAY_URL}/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data = await res.json();
      return searchResultsSchema.parse(data || { restaurants: [], menu_items: [] });
    },
    enabled: query.trim().length > 0,
  });
}
