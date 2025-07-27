import { useState, useCallback } from 'react';
import { apiService, Contact } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function useContactSearch() {
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setQuery('');
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(searchQuery);

    try {
      const data = await apiService.searchContacts(searchQuery);
      setResults(data.results);
      
      toast({
        title: "Search completed",
        description: `Found ${data.results.length} results for "${searchQuery}"`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setResults([]);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    query,
    search,
    clearResults,
    hasResults: results.length > 0
  };
}