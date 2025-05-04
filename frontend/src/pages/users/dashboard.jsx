import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer.jsx'; // Ensure correct extension if applicable
import Modal from '../../components/Modal'; // Keep if any modals are added later
import '../../styles/dashboard.css';

// Import Actual/Placeholder API Functions
import {
    getMyProfile,
    getRecentExpenses,
    getCurrentMonthSpendingTotal,
    getCurrentMonthBudget,
    getSpendingTrends
    // Ensure these functions exist in your api/api.js file
} from '../../api/api'; // Adjust path if needed

// --- Helper Function ---
const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Add UTC context if only date part is provided
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            dateString += 'T00:00:00Z';
        }
        return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { console.error("Date Format Error:", dateString, e); return 'Invalid Date'; }
};

// ==========================================================================
// Dashboard Component
// ==========================================================================
const Dashboard = () => {
    // --- State ---
    const [userName, setUserName] = useState('');
    const [recentExpenses, setRecentExpenses] = useState([]); // Fetched data
    const [totalBudget, setTotalBudget] = useState(0); // Fetched current month's target
    const [currentSpending, setCurrentSpending] = useState(0); // Fetched current month's total spent
    const [spendingTrendData, setSpendingTrendData] = useState({ months: [], categories: [] }); // Fetched data for line chart
    const [seriesVisibility, setSeriesVisibility] = useState({}); // Visibility state for line chart series { categoryName: true/false }

    // Loading and Error States
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
    const [isLoadingBudget, setIsLoadingBudget] = useState(true);
    const [isLoadingTrends, setIsLoadingTrends] = useState(true);
    const [error, setError] = useState(null); // Combined error state for simplicity

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoadingProfile(true); setIsLoadingExpenses(true); setIsLoadingBudget(true); setIsLoadingTrends(true);
        setError(null); // Clear previous errors

        try {
            const [profile, recent, spendingTotal, budgetInfo, trends] = await Promise.allSettled([
                getMyProfile(),
                getRecentExpenses(5), // Fetch last 5 recent expenses
                getCurrentMonthSpendingTotal(),
                getCurrentMonthBudget(), // Fetches target like { _id, total_budget_amount }
                getSpendingTrends(9) // Fetch last 9 months trends
            ]);

            // Process results - set state or throw error if critical fetch failed
            if (profile.status === 'fulfilled' && profile.value) setUserName(profile.value.name || 'User');
            else console.error("Profile fetch error:", profile.reason); // Log non-critical errors
            setIsLoadingProfile(false);

            if (recent.status === 'fulfilled' && recent.value) setRecentExpenses(recent.value || []);
            else console.error("Recent expenses fetch error:", recent.reason);
            setIsLoadingExpenses(false);

            if (budgetInfo.status === 'fulfilled' && budgetInfo.value) setTotalBudget(budgetInfo.value.total_budget_amount || 0);
            else setTotalBudget(0); // Default to 0 if no budget set or fetch failed
            if (spendingTotal.status === 'fulfilled') setCurrentSpending(spendingTotal.value || 0);
            else console.error("Spending total fetch error:", spendingTotal.reason); // Log error but allow component to render
            setIsLoadingBudget(false);

            if (trends.status === 'fulfilled' && trends.value) {
                setSpendingTrendData(trends.value || { months: [], categories: [] });
                const initialVisibility = (trends.value?.categories || []).reduce((acc, cat) => { acc[cat.name] = true; return acc; }, {});
                setSeriesVisibility(initialVisibility);
            } else {
                console.error("Spending trends fetch error:", trends.reason);
                setSpendingTrendData({ months: [], categories: [] }); // Reset on error
            }
            setIsLoadingTrends(false);

        } catch (err) { // Catch any synchronous errors in setup or re-thrown errors
            console.error("Dashboard data fetch setup error:", err);
            setError(err.message || "Failed to load dashboard data.");
            setIsLoadingProfile(false); setIsLoadingExpenses(false); setIsLoadingBudget(false); setIsLoadingTrends(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Chart Logic ---
    const toggleSeriesVisibility = (categoryName) => {
        setSeriesVisibility(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
    };

    // Prepare series data for line chart based on visibility state
    const visibleTrendSeries = useMemo(() => {
        return (spendingTrendData.categories || [])
            .filter(series => seriesVisibility[series.name]) // Filter based on visibility state
            .map(series => ({
                name: series.name,
                type: 'line', smooth: true, showSymbol: true,
                data: series.data,
                // TODO: Assign distinct colors if API doesn't provide them
                // lineStyle: { color: series.color }, itemStyle: { color: series.color }
            }));
    }, [spendingTrendData.categories, seriesVisibility]);

    // Options for the spending trends line chart
    const lineChartOptions = useMemo(() => ({
        tooltip: { trigger: 'axis', valueFormatter: val => `Rs ${val?.toLocaleString() ?? 0}` }, // Added safe formatting
        legend: { show: false }, // Custom buttons act as legend
        xAxis: { type: 'category', boundaryGap: false, data: spendingTrendData.months || [], axisLine: { lineStyle: { color: '#ccc' } }, axisTick: { show: false }, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLine: { show: true, lineStyle: { color: '#ccc'} }, splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }, axisLabel: { color: '#666', formatter: 'Rs {value}' } },
        grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true }, // Adjusted grid
        series: visibleTrendSeries,
    }), [spendingTrendData.months, visibleTrendSeries]);

    // Options for the budget usage donut chart
    const budgetChartOptions = useMemo(() => {
        const spent = currentSpending || 0;
        const budget = totalBudget || 0;
        const remaining = Math.max(0, budget - spent);
        const chartData = [];

        if (spent > 0) chartData.push({ value: spent, name: 'Spent', itemStyle: { color: '#ff3b30' } });
        if (remaining > 0) chartData.push({ value: remaining, name: 'Remaining', itemStyle: { color: '#34c759' } });
        if (budget <= 0 && spent <= 0) chartData.push({ value: 1, name: 'No Budget/Spending', itemStyle: { color: '#cccccc'} }); // Placeholder if empty

        return {
            tooltip: { trigger: 'item', formatter: '{b}: Rs {c} ({d}%)' },
            legend: { show: false },
            series: [{
                name: 'Budget Usage', type: 'pie', radius: ['65%', '85%'], avoidLabelOverlap: false,
                label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
                data: chartData,
                animationType: 'scale', animationEasing: 'elasticOut',
            }]
        };
    }, [currentSpending, totalBudget]);

    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    // --- Combined Loading State ---
    const isLoading = isLoadingProfile || isLoadingExpenses || isLoadingBudget || isLoadingTrends;

    return (
        <div className="page-container">
            <Navbar />
            <motion.main className="dashboard-content" variants={pageVariants} initial="hidden" animate="visible">
                <motion.h1 className="welcome-message" variants={itemVariants}>
                    {isLoadingProfile ? "Loading..." : `Welcome Back, ${userName}`}
                </motion.h1>

                {/* Display general error if any fetch failed critically */}
                {error && <motion.p variants={itemVariants} className="error-message centered-error">{error}</motion.p>}

                {/* Show loading indicator while any core data is loading */}
                {isLoading && <p className='loading-text'>Loading Dashboard Data...</p>}

                {/* Render content only when not loading and no critical error */}
                {!isLoading && !error && (
                    <>
                        <div className="dashboard-grid">
                            {/* Recent Expenses Column */}
                            <motion.div className="recent-expenses-column" variants={itemVariants}>
                                <h2>Recent Expenses</h2>
                                <div className="expense-cards-list">
                                    {/* Handle loading state specifically for expenses */}
                                    {isLoadingExpenses ? <p className="loading-text small">Loading...</p> :
                                        recentExpenses.length === 0 ? <p className="no-data-message">No recent expenses.</p> :
                                        recentExpenses.map((expense) => (
                                            <motion.div className="expense-card" key={expense._id} variants={itemVariants}>
                                                <p className="expense-date">{formatDateForDisplay(expense.expense_date)}</p>
                                                {/* Use category name from populated data or map */}
                                                {expense.category_id?.name && <p className="expense-category">{expense.category_id.name}</p>}
                                                <p className="expense-description">{expense.description}</p>
                                                <p className="expense-amount">Rs. {expense.amount.toLocaleString()}</p>
                                            </motion.div>
                                        ))
                                    }
                                </div>
                            </motion.div>

                            {/* Spending Trends Line Chart Column */}
                            <motion.div className="line-chart-column" variants={itemVariants}>
                                <h2>Spending Trends</h2>
                                {/* Legend Filters */}
                                <div className="chart-legend-filters">
                                    {isLoadingTrends ? <p className="loading-text small">Loading trends...</p> :
                                        (spendingTrendData.categories || []).length === 0 ? <p className="no-data-message">No trend data.</p> :
                                        (spendingTrendData.categories || []).map((series, index) => (
                                            <motion.button
                                                key={series.name}
                                                onClick={() => toggleSeriesVisibility(series.name)}
                                                className={`legend-filter-item ${!seriesVisibility[series.name] ? 'inactive' : ''}`}
                                                whileHover={{ opacity: 0.8 }} aria-pressed={seriesVisibility[series.name]}
                                            >
                                                <span className="legend-color-indicator" style={{ backgroundColor: seriesVisibility[series.name] ? (series.color || ECHARTS_DEFAULT_COLORS[index % ECHARTS_DEFAULT_COLORS.length]) : '#cccccc' }}></span>
                                                <span className="legend-text">{series.name}</span>
                                            </motion.button>
                                        ))
                                    }
                                </div>
                                {/* Line Chart */}
                                {isLoadingTrends ? null : (spendingTrendData.categories || []).length === 0 ? null : (
                                     <ReactECharts option={lineChartOptions} style={{ height: '350px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                                 )}
                            </motion.div>
                        </div>

                        {/* Budget Section */}
                        <motion.section className="budget-section-dash" variants={itemVariants}>
                             {isLoadingBudget ? <p className='loading-text small'>Loading budget...</p> : (
                                <>
                                    <div className="donut-chart-area">
                                        <div className="chart-text">
                                            <h4>Monthly Budget Status</h4>
                                            <p>Rs {currentSpending.toLocaleString()} Spent of Rs {totalBudget.toLocaleString()}</p>
                                        </div>
                                        <ReactECharts option={budgetChartOptions} style={{ height: '180px', width: '100%' }} notMerge={true} lazyUpdate={true} key={`${currentSpending}-${totalBudget}`} />
                                        <span className="chart-side-text-dash left">Spent</span>
                                        <span className="chart-side-text-dash right">Target</span>
                                    </div>
                                    <div className="budget-remaining-text">
                                         Remaining: Rs {Math.max(0, totalBudget - currentSpending).toLocaleString()}
                                    </div>
                                </>
                             )}
                        </motion.section>
                    </>
                )}

            </motion.main>
            <Footer />
        </div>
    );
};

// Default colors if API doesn't provide them for trends
const ECHARTS_DEFAULT_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

export default Dashboard;