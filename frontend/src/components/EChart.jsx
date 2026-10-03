// Minimal, tree-shaken ECharts wrapper. Only the chart types and components the app uses are
// registered, which keeps the charting chunk far smaller than the full `echarts` build.
// Usage: <EChart option={...} style={{ height: 300 }} />
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const EChart = ({ option, style, className, notMerge = true, lazyUpdate = true }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  // Create the chart once and keep it sized to its container.
  useEffect(() => {
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (option) chartRef.current?.setOption(option, { notMerge, lazyUpdate });
  }, [option, notMerge, lazyUpdate]);

  return <div ref={containerRef} className={className} style={style} />;
};

export default EChart;
