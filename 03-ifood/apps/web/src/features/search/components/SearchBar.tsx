import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  searchLoading: boolean;
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  searchLoading,
  onSearch,
}) => {
  return (
    <div className="mb-10 max-w-2xl">
      <div className="relative">
        <input
          type="text"
          placeholder="Search restaurants or dishes (e.g. Pizza, Burger)..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800/80 focus:border-red-500/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 shadow-lg"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        {searchLoading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
};
