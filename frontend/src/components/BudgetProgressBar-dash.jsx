import React from "react";
import ReactECharts from "echarts-for-react";

const BudgetProgressBars = ({ totalBudget, spent }) => {
  const remaining = Math.max(0, totalBudget - spent);

  const option = {
    backgroundColor: "transparent",
    title: {
      text: `Budget Usage (${spent} / ${totalBudget})`,
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold", color: "#e6e8ec" },
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15,18,28,0.9)",
      borderColor: "rgba(255,255,255,0.08)",
      textStyle: { color: "#f7f9fc" },
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#c7cede" },
      icon: "circle",
    },
    series: [
      {
        type: "pie",
        radius: ["55%", "75%"],
        avoidLabelOverlap: false,
        data: [
          { value: spent, name: "Spent", itemStyle: { color: "#ff7b8a" } },
          { value: remaining, name: "Remaining", itemStyle: { color: "#3ad6a0" } },
        ],
        label: {
          show: true,
          formatter: "{b}: {d}%",
          fontSize: 12,
          color: "#e6e8ec",
        },
        labelLine: { length: 10, length2: 8, lineStyle: { color: "#3a4760" } },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowOffsetX: 0,
            shadowColor: "rgba(0,0,0,0.35)",
          },
        },
      },
    ],
  };

  return (
    <div style={{ maxWidth: "320px", margin: "auto", textAlign: "center" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#e6e8ec" }}>Monthly Budget</h3>
      <div style={{
        background: "linear-gradient(145deg, rgba(18,24,38,0.95), rgba(12,16,26,0.9))",
        borderRadius: "12px",
        padding: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.05)"
      }}>
        <ReactECharts option={option} style={{ height: "260px" }} />
      </div>
    </div>
  );
};

export default BudgetProgressBars;
