import React from 'react';
import Modal from '../../components/Modal';
import '../../styles/dashboard.css';

const SmartInsightsDrawer = ({ isOpen, onClose, data }) => {
  const tips = data?.budgetTips || [];
  const anomalies = data?.anomalies || [];
  const forecast = data?.forecast;
  const summary = data?.summary || {};
  const categoryInsights = data?.categoryInsights || {};
  const overspend = categoryInsights.topOverspend || [];
  const underspend = categoryInsights.topUnderspend || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Smart Insights">
      <div className="insights-modal">
        {data?.mode === 'family' && <p className="info-message small">Insights include shared plan activity.</p>}
        <p className="muted-text small">Period: {data?.period || 'this-month'}</p>
        <section className="insights-section">
          <h4>Budget Tips</h4>
          {tips.length === 0 ? <p className="muted-text">No tips yet.</p> : (
            <ul className="insights-list">
              {tips.map((tip, idx) => (
                <li key={idx} className={`insight-pill ${tip.type || 'info'}`}>
                  <span className="insight-title">{tip.title}</span>
                  <span className="insight-detail">{tip.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="insights-section">
          <h4>Daily Anomalies</h4>
          {anomalies.length === 0 ? <p className="muted-text">No spending anomalies detected this period.</p> : (
            <ul className="insights-list">
              {anomalies.map((item) => (
                <li key={item.date} className="insight-pill warning">
                  <span className="insight-title">{item.date}</span>
                  <span className="insight-detail">Spent Rs {item.amount.toLocaleString()} (threshold Rs {Math.round(item.threshold).toLocaleString()})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="insights-section">
          <h4>Forecast</h4>
          {forecast ? (
            <div className="insight-pill info">
              <span className="insight-title">Next month projection</span>
              {forecast.notEnoughData ? (
                <span className="insight-detail">Not enough data to forecast yet.</span>
              ) : (
                <span className="insight-detail">Based on the last {forecast.monthsUsed || 0} months, expected spend is Rs {Math.round(forecast.projection || 0).toLocaleString()}.</span>
              )}
              {summary?.budgetTarget > 0 && (
                <span className="insight-detail">Current budget: Rs {summary.budgetTarget.toLocaleString()} - adjust if needed.</span>
              )}
            </div>
          ) : <p className="muted-text">Not enough data yet.</p>}
        </section>

        <section className="insights-section">
          <h4>Category Insights</h4>
          {overspend.length === 0 && underspend.length === 0 ? (
            <p className="muted-text">Add more expenses to see category-level trends.</p>
          ) : (
            <div className="category-insights">
              {overspend.length > 0 && (
                <div>
                  <h5>Top Overspend</h5>
                  <ul className="insights-list">
                    {overspend.map((c) => (
                      <li key={c.category} className="insight-pill warning">
                        <span className="insight-title">{c.category}</span>
                        <span className="insight-detail">Spent Rs {Math.round(c.amount).toLocaleString()} vs typical Rs {Math.round(c.typical || 0).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {underspend.length > 0 && (
                <div>
                  <h5>Top Underspend</h5>
                  <ul className="insights-list">
                    {underspend.map((c) => (
                      <li key={c.category} className="insight-pill info">
                        <span className="insight-title">{c.category}</span>
                        <span className="insight-detail">Spent Rs {Math.round(c.amount).toLocaleString()} vs typical Rs {Math.round(c.typical || 0).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

export default SmartInsightsDrawer;
