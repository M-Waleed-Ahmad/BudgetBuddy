import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EChart from '../../components/EChart';
import AppLayout from '../../components/AppLayout';
import SectionState from '../../components/SectionState';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  getCurrentMonthBudget,
  getCurrentMonthSpendingTotal,
  getRecentExpenses,
  getSpendingTrends,
} from '../../api';
import { formatDate, formatMonthShort } from '../../utils/format';
import '../../styles/DashboardPage.css';

const CHART_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
const TREND_MONTHS = 6;

const loadRecentExpenses = () => getRecentExpenses(5);
const loadTrends = () => getSpendingTrends(TREND_MONTHS);
const loadBudgetStatus = async () => {
  const [budget, total] = await Promise.all([getCurrentMonthBudget(), getCurrentMonthSpendingTotal()]);
  return { budget, totalSpent: Number(total?.totalSpent) || 0 };
};

const RecentExpenses = ({ formatMoney }) => {
  const { data, loading, error, reload } = useAsyncData(loadRecentExpenses, { initialData: [] });
  const expenses = data || [];

  return (
    <section className="card dashboard-page__recent" aria-labelledby="dashboard-recent-title">
      <div className="dashboard-page__card-header">
        <h2 id="dashboard-recent-title" className="card-title">
          Recent expenses
        </h2>
        <Link to="/expense-management" className="ghost-button small-button">
          View all
        </Link>
      </div>
      <SectionState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={expenses.length === 0}
        emptyMessage={
          <>
            <p>No expenses recorded yet.</p>
            <Link to="/expense-management" className="primary-button small-button">
              Add an expense
            </Link>
          </>
        }
      >
        <ul className="dashboard-page__expense-list">
          {expenses.map((expense) => (
            <li className="dashboard-page__expense" key={expense._id}>
              <div>
                <p className="dashboard-page__expense-description">{expense.description || 'Expense'}</p>
                <p className="dashboard-page__expense-meta">
                  {formatDate(expense.expense_date)} · {expense.category_id?.name || 'Uncategorized'}
                </p>
              </div>
              <span className="dashboard-page__expense-amount">{formatMoney(expense.amount)}</span>
            </li>
          ))}
        </ul>
      </SectionState>
    </section>
  );
};

const SpendingTrends = ({ formatMoney }) => {
  const { data, loading, error, reload } = useAsyncData(loadTrends);
  const months = useMemo(() => data?.months || [], [data]);
  const categories = useMemo(() => data?.categories || [], [data]);
  const [hidden, setHidden] = useState({});

  // Reset the legend whenever new data arrives.
  useEffect(() => {
    setHidden({});
  }, [data]);

  const hasSpending = categories.some((series) => (series.data || []).some((value) => Number(value) > 0));

  const options = useMemo(
    () => ({
      color: CHART_COLORS,
      tooltip: { trigger: 'axis', valueFormatter: (value) => formatMoney(value) },
      legend: { show: false },
      grid: { left: 8, right: 16, bottom: 8, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months.map(formatMonthShort),
        axisLine: { lineStyle: { color: '#ccc' } },
        axisTick: { show: false },
        axisLabel: { color: '#666' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
        axisLabel: { color: '#666', formatter: (value) => formatMoney(value) },
      },
      // Keep every series (so colours stay stable) and blank out the hidden ones.
      series: categories.map((series) => ({
        name: series.name,
        type: 'line',
        smooth: true,
        showSymbol: true,
        data: hidden[series.name] ? [] : series.data,
      })),
    }),
    [months, categories, hidden, formatMoney]
  );

  return (
    <section className="card dashboard-page__trends" aria-labelledby="dashboard-trends-title">
      <h2 id="dashboard-trends-title" className="card-title">
        Spending trends <span className="dashboard-page__muted">(last {TREND_MONTHS} months)</span>
      </h2>
      <SectionState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!hasSpending}
        emptyMessage="Your spending trends will appear here once you add expenses."
      >
        <div className="dashboard-page__legend" role="group" aria-label="Show or hide categories">
          {categories.map((series, index) => {
            const isVisible = !hidden[series.name];
            return (
              <button
                type="button"
                key={series.name}
                className={`dashboard-page__legend-item${isVisible ? '' : ' is-inactive'}`}
                aria-pressed={isVisible}
                onClick={() => setHidden((prev) => ({ ...prev, [series.name]: !prev[series.name] }))}
              >
                <span
                  className="dashboard-page__legend-swatch"
                  style={{ backgroundColor: isVisible ? CHART_COLORS[index % CHART_COLORS.length] : '#ccc' }}
                  aria-hidden="true"
                />
                {series.name}
              </button>
            );
          })}
        </div>
        <EChart option={options} style={{ height: 340, width: '100%' }} notMerge lazyUpdate />
      </SectionState>
    </section>
  );
};

const BudgetStatus = ({ formatMoney }) => {
  const { data, loading, error, reload } = useAsyncData(loadBudgetStatus);
  const budget = data?.budget;
  const spent = data?.totalSpent || 0;
  const target = Number(budget?.total_budget_amount) || 0;
  const remaining = target - spent;

  const donutOptions = useMemo(() => {
    const segments = [];
    if (spent > 0) segments.push({ value: Math.min(spent, target || spent), name: 'Spent', itemStyle: { color: '#ee6666' } });
    if (remaining > 0) segments.push({ value: remaining, name: 'Remaining', itemStyle: { color: '#3ba272' } });
    if (segments.length === 0) segments.push({ value: 1, name: 'No spending yet', itemStyle: { color: '#e5e7eb' } });
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => (params.name === 'No spending yet' ? params.name : `${params.name}: ${formatMoney(params.value)}`),
      },
      series: [
        {
          name: 'Budget usage',
          type: 'pie',
          radius: ['65%', '85%'],
          label: { show: false },
          labelLine: { show: false },
          data: segments,
        },
      ],
    };
  }, [spent, target, remaining, formatMoney]);

  return (
    <section className="card dashboard-page__budget" aria-labelledby="dashboard-budget-title">
      <h2 id="dashboard-budget-title" className="card-title">
        This month&apos;s budget
      </h2>
      <SectionState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!budget}
        emptyMessage={
          <>
            <p>
              You haven&apos;t set a budget for this month yet. So far you&apos;ve spent{' '}
              <strong>{formatMoney(spent)}</strong>.
            </p>
            <Link to="/budget-management" className="primary-button small-button">
              Set a monthly budget
            </Link>
          </>
        }
      >
        <div className="dashboard-page__budget-body">
          <div className="dashboard-page__donut">
            <EChart option={donutOptions} style={{ height: 180, width: '100%' }} notMerge lazyUpdate />
          </div>
          <div className="dashboard-page__budget-stats">
            <p className="dashboard-page__muted">
              {formatDate(budget?.start_date)} – {formatDate(budget?.end_date)}
            </p>
            <dl>
              <div>
                <dt>Spent</dt>
                <dd>{formatMoney(spent)}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{formatMoney(target)}</dd>
              </div>
              <div>
                <dt>{remaining >= 0 ? 'Remaining' : 'Over budget'}</dt>
                <dd className={remaining < 0 ? 'is-negative' : ''}>{formatMoney(Math.abs(remaining))}</dd>
              </div>
            </dl>
            <ProgressBar used={spent} total={target} />
          </div>
        </div>
      </SectionState>
    </section>
  );
};

const DashboardPage = () => {
  const { user, formatMoney } = useAuth();
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <AppLayout className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</h1>
          <p className="page-subtitle">Here&apos;s an overview of your spending.</p>
        </div>
      </div>

      <BudgetStatus formatMoney={formatMoney} />

      <div className="dashboard-page__grid">
        <RecentExpenses formatMoney={formatMoney} />
        <SpendingTrends formatMoney={formatMoney} />
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
