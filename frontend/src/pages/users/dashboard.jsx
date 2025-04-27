import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ReactECharts from 'echarts-for-react';
import Navbar from "../../components/navbar";
import Footer from "../../components/Footer.jsx";
import "../../styles/dashboard.css";

const Dashboard = () => {
    const [spendingValue, setSpendingValue] = useState(5000);
    const totalBudget = 10000;

    const recentExpenses = [
        { date: "March 12, 2025", store: "Food Store", amount: "Rs.2400" },
        { date: "March 12, 2025", store: "Food Store", amount: "Rs.2400" },
        { date: "March 12, 2025", store: "Food Store", amount: "Rs.2400" },
    ];

    const allSeriesData = [
        { name: 'Food', type: 'line', smooth: true, showSymbol: true, data: [100, 450, 300, 550, 250, 750, 650, 400, 500], color: '#ff7f0e' }, // Orange
        { name: 'Travel', type: 'line', smooth: true, showSymbol: true, data: [300, 200, 600, 400, 700, 600, 800, 600, 780], color: '#1f77b4' }, // Blue
        { name: 'Utilities', type: 'line', smooth: true, showSymbol: true, data: [500, 550, 450, 650, 300, 500, 700, 680, 450], color: '#2ca02c' }, // Green
        { name: 'Entertainment', type: 'line', smooth: true, showSymbol: true, data: [200, 300, 700, 500, 900, 400, 600, 640, 820], color: '#9467bd' }, // Purple
    ];

    const [seriesVisibility, setSeriesVisibility] = useState(
        allSeriesData.map(() => true)
    );

    const toggleSeriesVisibility = (index) => {
        setSeriesVisibility(prevVisibility => {
            const newVisibility = [...prevVisibility];
            newVisibility[index] = !newVisibility[index];
            return newVisibility;
        });
    };

    const visibleSeries = useMemo(() => {
        return allSeriesData
            .filter((_, index) => seriesVisibility[index])
            .map(series => ({
                name: series.name, type: series.type, smooth: series.smooth,
                showSymbol: series.showSymbol, data: series.data,
                lineStyle: { color: series.color }, itemStyle: { color: series.color }
            }));
    }, [seriesVisibility]);

    const lineChartOptions = {
        tooltip: { trigger: 'axis' }, legend: { show: false },
        xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], axisLine: { lineStyle: { color: '#ccc' } }, axisTick: { show: false }, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', max: 1000, splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }, axisLabel: { color: '#666' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        series: visibleSeries,
    };

    const budgetChartOptions = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' }, legend: { show: false },
        series: [{
            name: 'Budget Usage', type: 'pie', radius: ['65%', '85%'], avoidLabelOverlap: false,
            label: { show: false, position: 'center' }, emphasis: { label: { show: false } }, labelLine: { show: false },
            data: [
                { value: spendingValue, name: 'Used', itemStyle: { color: '#34c759' } },
                { value: Math.max(0, totalBudget - spendingValue), name: 'Remaining', itemStyle: { color: '#ff3b30' } }
            ],
            animationType: 'scale', animationEasing: 'elasticOut',
        }]
    };

    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="page-container">
            <Navbar />
            <motion.main
                className="dashboard-content"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h1 className="welcome-message" variants={itemVariants}>
                    Welcome Back, Mr Waleed Ahmad
                </motion.h1>

                <div className="dashboard-grid">
                    {/* Recent Expenses Column */}
                    <motion.div className="recent-expenses-column" variants={itemVariants}>
                        <h2>Recent Expenses</h2>
                        <div className="expense-cards-list">
                            {recentExpenses.map((expense, index) => (
                                <motion.div className="expense-card" key={index} variants={itemVariants}>
                                    <p className="expense-date">{expense.date}</p>
                                    <p className="expense-store">{expense.store}</p>
                                    <p className="expense-amount">{expense.amount}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Line Chart Column */}
                    <motion.div className="line-chart-column" variants={itemVariants}>
                        {/* --- NEW Legend-Style Filter Buttons --- */}
                        <div className="chart-legend-filters">
                            {allSeriesData.map((series, index) => (
                                <motion.button
                                    key={series.name}
                                    onClick={() => toggleSeriesVisibility(index)}
                                    className={`legend-filter-item ${!seriesVisibility[index] ? 'inactive' : ''}`}
                                    whileHover={{ opacity: 0.8 }} // Simple hover effect
                                    aria-pressed={seriesVisibility[index]}
                                >
                                    <span
                                        className="legend-color-indicator"
                                        style={{ backgroundColor: seriesVisibility[index] ? series.color : '#cccccc' }} // Use color if active, grey if inactive
                                    ></span>
                                    <span className="legend-text">
                                        {series.name}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                        {/* --- Line Chart --- */}
                        <ReactECharts
                            option={lineChartOptions}
                            style={{ height: '350px', width: '100%' }}
                            notMerge={true}
                            lazyUpdate={true}
                        />
                    </motion.div>
                </div>

                {/* Budget Section */}
                <motion.section className="budget-section-dash" variants={itemVariants}>
                    <div className="donut-chart-area">
                        <div className="chart-text">
                            <h4>Monthly Budget</h4>
                            <p>Budget Usage ({spendingValue} / {totalBudget})</p>
                        </div>
                        <ReactECharts
                            option={budgetChartOptions}
                            style={{ height: '180px', width: '100%' }}
                            notMerge={true}
                            lazyUpdate={true}
                            key={spendingValue}
                        />
                        <span className="chart-side-text-dash left">50%</span>
                        <span className="chart-side-text-dash right">50%</span>
                    </div>

                    <div className="slider-area">
                        <input
                            type="range" min="0" max={totalBudget} value={spendingValue}
                            onChange={(e) => setSpendingValue(parseInt(e.target.value, 10))}
                            className="spending-slider"
                        />
                        <p className="slider-label">Adjust spending: {spendingValue}</p>
                    </div>
                </motion.section>

            </motion.main>
            <Footer />
        </div>
    );
};

export default Dashboard;