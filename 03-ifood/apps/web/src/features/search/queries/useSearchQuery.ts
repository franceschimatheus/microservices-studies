import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SearchResultsType } from '../schemas/searchSchema';
import { searchClient } from '../api/searchClient';

export function useSearchQuery(query: string) {
  return useQuery<SearchResultsType>({
    queryKey: ['search', query],
    queryFn: async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        return { restaurants: [], menu_items: [] };
      }
      return await searchClient.search(trimmed);
    },
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
  });
}
