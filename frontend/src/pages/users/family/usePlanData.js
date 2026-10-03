import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPlanCategories, getPlanDetails, getPlanExpenses, getPlanMembers, getUserFamilyPlans } from '../../../api';

const FETCHERS = {
  details: (planId) => getPlanDetails(planId),
  members: (planId) => getPlanMembers(planId),
  categories: (planId) => getPlanCategories(planId),
  expenses: (planId) => getPlanExpenses(planId),
  myExpenses: (planId) => getPlanExpenses(planId, { mine: true }),
};

export const ALL_SECTIONS = Object.keys(FETCHERS);
export const EXPENSE_SECTIONS = ['expenses', 'myExpenses'];

const emptySection = { data: null, loading: false, error: null };
const emptySections = () => Object.fromEntries(ALL_SECTIONS.map((key) => [key, emptySection]));

/**
 * Loads the user's family plans and, for the selected plan, its details, members,
 * categories, all expenses and the user's own expenses. Each section keeps its own
 * loading/error state and keeps showing its previous data while it reloads.
 *
 * The selected plan lives in the `?plan=<id>` query parameter so notification links
 * can deep-link to a plan and the URL stays in sync when the user switches plans.
 */
export function usePlanData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const planParam = searchParams.get('plan');

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [plansError, setPlansError] = useState(null);
  // The ?plan value that was current when the plans list was last fetched.
  const [verifiedParam, setVerifiedParam] = useState(null);
  const [sections, setSections] = useState(emptySections);

  const planParamRef = useRef(planParam);
  const activePlanRef = useRef('');

  useEffect(() => {
    planParamRef.current = planParam;
  }, [planParam]);

  const setPlanParam = useCallback(
    (planId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (planId) next.set('plan', planId);
          else next.delete('plan');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const loadPlans = useCallback(async () => {
    const paramAtFetch = planParamRef.current;
    setPlansLoading(true);
    setPlansError(null);
    try {
      const list = await getUserFamilyPlans();
      setPlans(Array.isArray(list) ? list : []);
      setVerifiedParam(paramAtFetch);
      setPlansLoaded(true);
    } catch (err) {
      setPlansError(err.message || 'Could not load your plans.');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const selectedPlanId = planParam && plans.some((plan) => plan._id === planParam) ? planParam : '';

  // Keep ?plan pointing at a plan the user can actually see.
  useEffect(() => {
    if (!plansLoaded || plansLoading || plansError) return;
    if (!planParam && plans.length === 0) return;
    if (planParam && plans.some((plan) => plan._id === planParam)) return;

    if (planParam && verifiedParam !== planParam) {
      // The link may point at a plan joined after the list was fetched.
      loadPlans();
      return;
    }
    if (planParam) toast.error('That plan is no longer available to you.', { id: 'plan-unavailable' });
    setPlanParam(plans[0]?._id || null);
  }, [plans, plansLoaded, plansLoading, plansError, planParam, verifiedParam, loadPlans, setPlanParam]);

  const reload = useCallback(async (keys = ALL_SECTIONS) => {
    const planId = activePlanRef.current;
    if (!planId) return;

    setSections((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = { ...prev[key], loading: true, error: null };
      });
      return next;
    });

    await Promise.all(
      keys.map(async (key) => {
        try {
          const data = await FETCHERS[key](planId);
          if (activePlanRef.current !== planId) return;
          setSections((prev) => ({ ...prev, [key]: { data, loading: false, error: null } }));
        } catch (err) {
          if (activePlanRef.current !== planId) return;
          setSections((prev) => ({
            ...prev,
            [key]: { ...prev[key], loading: false, error: err.message || 'Something went wrong.' },
          }));
        }
      })
    );
  }, []);

  useEffect(() => {
    activePlanRef.current = selectedPlanId;
    setSections(emptySections());
    if (selectedPlanId) reload();
  }, [selectedPlanId, reload]);

  /** Stores PlanDetails returned by a mutation and mirrors name/currency into the plans list. */
  const applyDetails = useCallback((details) => {
    if (!details?._id) return;
    if (activePlanRef.current === details._id) {
      setSections((prev) => ({ ...prev, details: { data: details, loading: false, error: null } }));
    }
    setPlans((prev) =>
      prev.map((plan) =>
        plan._id === details._id ? { ...plan, plan_name: details.plan_name, currency: details.currency } : plan
      )
    );
  }, []);

  /** Drops a plan the user deleted or left, then refreshes the list from the server. */
  const forgetPlan = useCallback(
    async (planId) => {
      setPlans((prev) => prev.filter((plan) => plan._id !== planId));
      if (planParamRef.current === planId) setPlanParam(null);
      await loadPlans();
    },
    [loadPlans, setPlanParam]
  );

  const selectedSummary = useMemo(
    () => plans.find((plan) => plan._id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  return {
    plans,
    plansLoading,
    plansLoaded,
    plansError,
    reloadPlans: loadPlans,
    selectedPlanId,
    selectedSummary,
    selectPlan: setPlanParam,
    forgetPlan,
    applyDetails,
    reload,
    ...sections,
  };
}
