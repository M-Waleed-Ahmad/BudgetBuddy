import { percentOf } from '../utils/format';

/** Returns 'ok' below 80 %, 'warning' from 80 % up to the limit, and 'danger' once it is exceeded. */
function usageTone(used, total) {
  if (!total || total <= 0) return used > 0 ? 'danger' : 'ok';
  const ratio = Number(used) / Number(total);
  if (ratio > 1) return 'danger';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}

/** Horizontal usage bar with green / amber / red thresholds. */
const ProgressBar = ({ used, total, label, detail }) => {
  const percent = percentOf(used, total);
  const tone = usageTone(used, total);
  const rawPercent = total > 0 ? Math.round((Number(used) / Number(total)) * 100) : 0;

  return (
    <div className="progress">
      {(label || detail) && (
        <div className="progress-header">
          {label && <strong>{label}</strong>}
          {detail && <span>{detail}</span>}
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label ? `${label} usage` : 'Usage'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${rawPercent}% used`}
      >
        <div className={`progress-fill ${tone === 'ok' ? '' : `is-${tone}`}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
