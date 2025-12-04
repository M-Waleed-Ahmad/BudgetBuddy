import React from 'react';
import '../../styles/dashboard.css';

const SmartInsightsCard = ({ data, isLoading, error, onOpen }) => {
  const tips = data?.budgetTips || [];
  const hasData = tips.length > 0 || (data?.anomalies?.length || data?.forecast);

  return (
    <div className="smart-insights-card">
      <div className="smart-insights-header">
        <h2>Smart Insights</h2>
        <button className="link-button" onClick={onOpen} disabled={isLoading || !hasData}>View all</button>
      </div>
      {isLoading && <p className="loading-text small">Analyzing your spend...</p>}
      {error && <p className="error-message small">{error}</p>}
      {!isLoading && !error && (
        <>
          {tips.length === 0 && <p className="no-data-message">No tips yet. Add expenses and a budget to unlock insights.</p>}
          <ul className="insights-list">
            {tips.slice(0, 2).map((tip, idx) => (
              <li key={idx} className={`insight-pill ${tip.type || 'info'}`}>
                <span className="insight-title">{tip.title}</span>
                <span className="insight-detail">{tip.detail}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default SmartInsightsCard;
