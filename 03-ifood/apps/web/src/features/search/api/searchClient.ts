import { _get } from '@/services/api';
import { searchResultsSchema, SearchResultsType } from '../schemas/searchSchema';

export const searchClient = {
  search: async (query: string): Promise<SearchResultsType> => {
    const res = await _get(`/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error('Search failed');
    }
    const data = await res.json();
    return searchResultsSchema.parse(data || { restaurants: [], menu_items: [] });
  },
};
