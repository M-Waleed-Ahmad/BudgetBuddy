import React from 'react';
import '../../styles/dashboard.css';

const SmartInsightsCard = ({ insights, data, isLoading, error, onOpen }) => {
  const payload = insights || data;
  const tips = payload?.budgetTips || [];
  const overspend = payload?.categoryInsights?.topOverspend || [];
  const hasData = tips.length > 0 || (payload?.anomalies?.length || payload?.forecast) || overspend.length > 0;

  return (
    <div className="smart-insights-card">
      <div className="smart-insights-header">
        <div className="smart-insights-meta">
          <h2>Smart Insights</h2>
          {payload?.mode === 'family' && <span className="badge">Family</span>}
        </div>
        <button className="link-button" onClick={onOpen} disabled={isLoading || !hasData}>View all</button>
      </div>
      {isLoading && <p className="loading-text small">Analyzing your spend...</p>}
      {error && <p className="error-message small">{error}</p>}
      {!isLoading && !error && (
        <>
          {tips.length === 0 && overspend.length === 0 && <p className="no-data-message">No tips yet. Add expenses and a budget to unlock insights.</p>}
          <ul className="insights-list">
            {tips.slice(0, 2).map((tip, idx) => (
              <li key={idx} className={`insight-pill ${tip.type || 'info'}`}>
                <span className="insight-title">{tip.title}</span>
                <span className="insight-detail">{tip.detail}</span>
              </li>
            ))}
          </ul>
          {overspend.length > 0 && (
            <div className="insight-pill warning">
              <span className="insight-title">Top overspend</span>
              <span className="insight-detail">{overspend[0].category}: Rs {Math.round(overspend[0].amount).toLocaleString()} vs typical Rs {Math.round(overspend[0].typical || 0).toLocaleString()}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SmartInsightsCard;
