import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer.jsx';
import SmartInsightsCard from '../../features/insights/SmartInsightsCard';
import SmartInsightsDrawer from '../../features/insights/SmartInsightsDrawer';
import '../../styles/dashboard.css';
import { loadCurrentUser } from '../../features/auth/authSlice.js';
import { fetchSummaryReport } from '../../features/reports/reportsSlice.js';

const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      dateString += 'T00:00:00Z';
    }
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch (e) { console.error("Date Format Error:", dateString, e); return 'Invalid Date'; }
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { chartsData, status, error } = useSelector((state) => state.reports);

  const [seriesVisibility, setSeriesVisibility] = useState({});
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  useEffect(() => {
    dispatch(loadCurrentUser());
    dispatch(fetchSummaryReport());
  }, [dispatch]);

  useEffect(() => {
    if (chartsData?.trends?.categories) {
      const initialVisibility = (chartsData.trends.categories || []).reduce((acc, cat) => {
        acc[cat.name] = true;
        return acc;
      }, {});
      setSeriesVisibility((prev) => Object.keys(prev).length ? prev : initialVisibility);
    }
  }, [chartsData?.trends?.categories]);

  const userName = user?.name || 'User';
  const recentExpenses = chartsData?.recentExpenses || [];
  const totalBudget = chartsData?.budget?.total_budget_amount || 0;
  const currentSpending = chartsData?.spendingTotal || 0;
  const spendingTrendData = chartsData?.trends || { months: [], categories: [] };
  const insightsData = chartsData?.recommendations;
  const isLoading = status === 'loading';

  const toggleSeriesVisibility = (categoryName) => {
    setSeriesVisibility((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const lineChartOption = useMemo(() => {
    if (!spendingTrendData?.months?.length) return {};
    const visibleCategories = spendingTrendData.categories?.filter((cat) => seriesVisibility[cat.name] !== false) || [];
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: spendingTrendData.categories?.map((cat) => cat.name) || [] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: spendingTrendData.months },
      yAxis: { type: 'value' },
      series: (visibleCategories || []).map((cat) => ({
        name: cat.name,
        type: 'line',
        data: cat.data || [],
        smooth: true,
      })),
    };
  }, [spendingTrendData, seriesVisibility]);

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <p className="welcome-text">Welcome back,</p>
            <h1 className="user-name">{userName}</h1>
          </div>
          {isLoading && <span className="loading-text">Loading...</span>}
          {error && <span className="error-message">{error}</span>}
        </div>

        <section className="stat-grid">
          <div className="stat-card primary">
            <p>Total Budget (This Month)</p>
            <h3>{totalBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</h3>
            <small>Budget target for the current month</small>
          </div>
          <div className="stat-card warning">
            <p>Current Spending</p>
            <h3>{currentSpending.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</h3>
            <small>{totalBudget ? `${Math.round((currentSpending / totalBudget) * 100)}% of budget` : 'No budget set'}</small>
          </div>
        </section>

        <div className="dashboard-grid">
          <div className="recent-expenses-column">
            <div className="section-header">
              <h2>Recent Expenses</h2>
            </div>
            {recentExpenses?.length ? (
              <ul className="recent-expenses-list">
                {recentExpenses.map((expense) => (
                  <li key={expense._id || expense.id} className="expense-item">
                    <div>
                      <p className="expense-description">{expense.description || 'Expense'}</p>
                      <p className="expense-meta">
                        {expense.category?.name || expense.category || 'General'} • {formatDateForDisplay(expense.expense_date || expense.date)}
                      </p>
                    </div>
                    <span className="expense-amount">
                      {(Number(expense.amount) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No recent expenses.</p>
            )}
          </div>

          <div className="line-chart-column">
            <div className="section-header">
              <h2>Spending Trends</h2>
            </div>
            {spendingTrendData?.months?.length ? (
              <ReactECharts option={lineChartOption} style={{ height: '360px', width: '100%' }} notMerge lazyUpdate />
            ) : (
              <p className="empty-state">No trend data available.</p>
            )}
            <div className="legend-controls">
              {(spendingTrendData.categories || []).map((cat) => (
                <button
                  key={cat.name}
                  className={`legend-button ${seriesVisibility[cat.name] === false ? 'inactive' : ''}`}
                  onClick={() => toggleSeriesVisibility(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="insights-section">
          <div className="section-header">
            <h2>Smart Insights</h2>
            <button className="link-button" onClick={() => setIsInsightsOpen(true)}>Open Drawer</button>
          </div>
          {insightsData ? (
            <div className="insights-grid">
              <SmartInsightsCard insights={insightsData} onOpenDrawer={() => setIsInsightsOpen(true)} />
            </div>
          ) : (
            <p className="empty-state">No insights available yet.</p>
          )}
        </section>
      </main>

      <SmartInsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        insights={insightsData}
      />
      <Footer />
    </div>
  );
};

export default Dashboard;
