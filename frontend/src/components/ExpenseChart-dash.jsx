import React from "react";
import ReactECharts from "echarts-for-react";

// Dark-friendly line chart for category analytics
const CategoryAnalyticsChart = () => {
  const option = {
    backgroundColor: "transparent",
    title: {
      text: "Expense Category Breakdown",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#e6e8ec",
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 18, 28, 0.9)",
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f7f9fc" },
    },
    legend: {
      data: ["Rent", "Utilities", "Groceries", "Transport"],
      bottom: 0,
      textStyle: { fontSize: 12, color: "#c7cede" },
      icon: "roundRect",
      itemGap: 12,
    },
    grid: { left: 40, right: 20, top: 60, bottom: 50 },
    xAxis: {
      type: "category",
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      axisLine: { lineStyle: { color: "#2f3c52" } },
      axisLabel: { fontSize: 12, color: "#c7cede" },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#c7cede" },
      splitLine: { lineStyle: { type: "dashed", color: "#263349" } },
    },
    series: [
      {
        name: "Rent",
        type: "line",
        data: [200, 500, 300, 700, 400, 800, 900, 650, 780],
        color: "#7b61ff",
        smooth: true,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.08 },
        symbolSize: 6,
      },
      {
        name: "Utilities",
        type: "line",
        data: [500, 200, 600, 400, 900, 350, 300, 500, 450],
        color: "#ff7b8a",
        smooth: true,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.08 },
        symbolSize: 6,
      },
      {
        name: "Groceries",
        type: "line",
        data: [100, 450, 600, 250, 300, 750, 620, 410, 380],
        color: "#3ad6a0",
        smooth: true,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.08 },
        symbolSize: 6,
      },
      {
        name: "Transport",
        type: "line",
        data: [300, 700, 400, 600, 200, 500, 750, 350, 480],
        color: "#53c7ff",
        smooth: true,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.08 },
        symbolSize: 6,
      },
    ],
  };

  return (
    <div style={{ width: "100%", maxWidth: "520px", margin: "auto", padding: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#e6e8ec" }}>Category Analytics</h3>
      <div style={{
        background: "linear-gradient(145deg, rgba(18,24,38,0.95), rgba(12,16,26,0.9))",
        padding: "12px",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.05)"
      }}>
        <ReactECharts option={option} style={{ height: "320px", width: "100%" }} />
      </div>
    </div>
  );
};

export default CategoryAnalyticsChart;
