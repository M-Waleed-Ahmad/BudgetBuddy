import React from "react";
import ReactECharts from "echarts-for-react";

const BudgetProgressBars = ({ totalBudget, spent }) => {
  const remaining = totalBudget - spent;
  
  const option = {
    title: {
      text: `Budget Usage (${spent} / ${totalBudget})`,
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold" },
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "70%"], // Donut shape
        data: [
          { value: spent, name: "Spent", itemStyle: { color: "#ff4d4d" } }, // Red for spent
          { value: remaining, name: "Remaining", itemStyle: { color: "#28a745" } }, // Green for remaining
        ],
        label: {
          show: true,
          formatter: "{d}%", // Show percentage
          fontSize: 12,
        },
      },
    ],
  };

  return (
    <div style={{ maxWidth: "300px", margin: "auto", textAlign: "center" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>Monthly Budget</h3>
      <ReactECharts option={option} style={{ height: "250px" }} />
    </div>
  );
};

export default BudgetProgressBars;
