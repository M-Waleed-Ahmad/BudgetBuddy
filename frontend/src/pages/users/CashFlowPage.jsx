import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { usePdfExport } from '../../hooks/usePdfExport';
import CashFlowPdf from '../../features/pdf/CashFlowPdf.jsx';
import ShareButtons from '../../features/pdf/ShareButtons';
import '../../styles/pricing.css';
import { fetchCashFlowReport } from '../../features/reports/reportsSlice.js';

const CashFlowPage = () => {
  const dispatch = useDispatch();
  const { cashFlowSummary: data, cashflowStatus, error } = useSelector((state) => state.reports);
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return { from: `${yyyy}-${mm}-01`, to: `${yyyy}-${mm}-${dd}`, account: '' };
  });
  const pdfRef = useRef(null);
  const { exportPdf } = usePdfExport();

  const loading = cashflowStatus === 'loading';

  const fetchReport = () => {
    dispatch(fetchCashFlowReport(filters));
  };

  useEffect(() => { fetchReport(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const chartOptions = useMemo(() => {
    if (!data?.runningBalance) return {};
    return {
      tooltip: { trigger: 'axis', valueFormatter: (val) => `Rs ${val?.toLocaleString?.() || val}` },
      xAxis: { type: 'category', data: data.runningBalance.map((r) => new Date(r.date).toLocaleDateString()) },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: data.runningBalance.map((r) => r.balance), smooth: true }],
    };
  }, [data]);

  const exportCsv = () => {
    if (!data?.runningBalance) return;
    const rows = [
      ['Date', 'Type', 'Account', 'Category', 'Description', 'Amount', 'Balance'],
      ...data.runningBalance.map((r) => [
        new Date(r.date).toISOString(),
        r.type,
        r.account || '',
        r.category || '',
        r.description || '',
        r.amount,
        r.balance,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cashflow.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!pdfRef.current || !data) return;
    await exportPdf({ element: pdfRef.current, filename: 'cashflow.pdf', title: 'Cash Flow Statement' });
  };

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <div className="dashboard-grid">
          <div className="recent-expenses-column">
            <h2>Cash Flow</h2>
            <div className="filters-row">
              <div className="form-control">
                <label>From</label>
                <input type="date" name="from" value={filters.from} onChange={onChange} />
              </div>
              <div className="form-control">
                <label>To</label>
                <input type="date" name="to" value={filters.to} onChange={onChange} />
              </div>
              <div className="form-control">
                <label>Account</label>
                <input type="text" name="account" value={filters.account} onChange={onChange} placeholder="Optional" />
              </div>
              <button className="link-button" onClick={fetchReport} disabled={loading}>Apply</button>
            </div>
            {loading && <p className="loading-text">Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            {data && !loading && (
              <div className="cashflow-summary">
                <div className="summary-card info"><span>Inflow</span><strong>Rs {data.inflow?.toLocaleString?.() || 0}</strong></div>
                <div className="summary-card warning"><span>Outflow</span><strong>Rs {data.outflow?.toLocaleString?.() || 0}</strong></div>
                <div className="summary-card success"><span>Net</span><strong>Rs {data.net?.toLocaleString?.() || 0}</strong></div>
              </div>
            )}
          </div>

          <div className="line-chart-column">
            <h2>Running Balance</h2>
            {data?.runningBalance?.length ? (
              <ReactECharts option={chartOptions} style={{ height: '300px', width: '100%' }} notMerge lazyUpdate />
            ) : <p className="no-data-message">No data for selected range.</p>}
          </div>
        </div>

        {data?.runningBalance?.length ? (
          <section className="budget-section-dash">
            <div className="table-actions">
              <div>
                <button className="link-button" onClick={exportCsv}>Export CSV</button>
                <button className="link-button" onClick={handleExportPdf}>Export PDF</button>
                <ShareButtons url={window.location.href} title="Cash Flow Statement" />
              </div>
            </div>
            <table className="cashflow-table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Account</th><th>Category</th><th>Description</th><th>Amount</th><th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.runningBalance.map((row, idx) => (
                  <tr key={idx}>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>{row.type}</td>
                    <td>{row.account}</td>
                    <td>{row.category}</td>
                    <td>{row.description}</td>
                    <td>Rs {row.amount?.toLocaleString?.() || 0}</td>
                    <td>Rs {row.balance?.toLocaleString?.() || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
      {/* Hidden render target for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CashFlowPdf
          ref={pdfRef}
          summary={{ inflow: data?.inflow, outflow: data?.outflow, net: data?.net }}
          runningBalance={data?.runningBalance || []}
        />
      </div>
      <Footer />
    </div>
  );
};

export default CashFlowPage;
