import { useEffect, useState } from 'react';
import { getMyProfile } from '../api/api';

export const useEntitlement = (feature) => {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyProfile();
        const entitlements = profile?.entitlements || [];
        setAllowed(entitlements.some((e) => e.feature === feature && e.active));
      } catch (err) {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [feature]);

  return { allowed, loading };
};

export default useEntitlement;
