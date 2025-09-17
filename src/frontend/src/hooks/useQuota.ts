import { useState, useEffect, useCallback } from 'react';
import { logicService, QuotaStatus } from '../services/logic.service';
import { useAuth } from '../core/providers/auth-provider';

export const useQuota = () => {
  const { isAuthenticated } = useAuth();
  const [quota, setQuota] = useState<QuotaStatus>({
    remaining: 0,
    total: 0,
    resets_at: null,
    tier: 'guest'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const quotaStatus = await logicService.getQuotaStatus();
      setQuota(quotaStatus);
      
      console.log('📊 Quota status updated:', quotaStatus);
    } catch (err) {
      console.error('❌ Failed to fetch quota:', err);
      setError('Failed to fetch quota information');
      
      // Set default values on error
      setQuota({
        remaining: 0,
        total: 0,
        resets_at: null,
        tier: 'guest'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch quota on component mount and when authentication state changes
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota, isAuthenticated]);

  // Auto-refresh quota every 30 seconds when component is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchQuota();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchQuota, loading]);

  const refreshQuota = useCallback(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    loading,
    error,
    refreshQuota
  };
};
