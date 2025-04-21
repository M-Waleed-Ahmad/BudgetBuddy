import React from "react";
import ReactECharts from "echarts-for-react";

const CategoryAnalyticsChart = () => {
  const option = {
    title: {
      text: "Expense Category Breakdown",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      textStyle: { color: "#fff" },
    },
    legend: {
      data: ["Rent", "Utilities", "Groceries", "Transport"],
      bottom: 0,
      textStyle: { fontSize: 12 },
    },
    xAxis: {
      type: "category",
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      axisLine: { lineStyle: { color: "#ccc" } },
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", color: "#ddd" } },
    },
    series: [
      {
        name: "Rent",
        type: "line",
        data: [200, 500, 300, 700, 400, 800, 900, 650, 780],
        color: "#6f42c1", // Purple
        smooth: true,
        lineStyle: { width: 2 },
      },
      {
        name: "Utilities",
        type: "line",
        data: [500, 200, 600, 400, 900, 350, 300, 500, 450],
        color: "#ff4d4d", // Red
        smooth: true,
        lineStyle: { width: 2 },
      },
      {
        name: "Groceries",
        type: "line",
        data: [100, 450, 600, 250, 300, 750, 620, 410, 380],
        color: "#28a745", // Green
        smooth: true,
        lineStyle: { width: 2 },
      },
      {
        name: "Transport",
        type: "line",
        data: [300, 700, 400, 600, 200, 500, 750, 350, 480],
        color: "#00bcd4", // Cyan
        smooth: true,
        lineStyle: { width: 2 },
      },
    ],
  };

  return (
    <div style={{ display:"block", width: "100%", maxWidth: "400px", margin: "auto", padding: "10px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Category Analytics</h3>
      <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <ReactECharts option={option} style={{ height: "300px", width: "100%" }} />
      </div>
    </div>
  );
};

export default CategoryAnalyticsChart;
