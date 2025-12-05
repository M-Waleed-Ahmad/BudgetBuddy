import { useEffect, useState } from 'react';
import { getMyProfile } from '../api/api';

export const useEntitlement = (feature) => {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyProfile();
        const entitlements = profile?.entitlements || [];
        setAllowed(entitlements.some((e) => e.feature === feature && e.active));
        setError(null);
      } catch (err) {
        setAllowed(false);
        setError(err?.message || 'Unable to load entitlements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [feature]);

  return { allowed, loading, error };
};

export default useEntitlement;
