import { useState, useEffect, useCallback } from 'react';
import { apiService, Contact } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getContacts();
      setContacts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contacts';
      setError(errorMessage);
      toast({
        title: "Error loading contacts",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshContacts = useCallback(() => {
    return loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    refreshContacts,
    contactCount: contacts.length
  };
}