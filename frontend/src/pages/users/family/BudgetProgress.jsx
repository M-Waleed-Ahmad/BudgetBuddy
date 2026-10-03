import { percentOf } from '../../../utils/format';

/** Horizontal progress bar clamped to 0–100%, with an over-budget state. */
export default function BudgetProgress({ spent, limit, label, size = 'md' }) {
  const ratio = limit > 0 ? (spent / limit) * 100 : 0;
  const over = limit > 0 && spent > limit;
  const warn = !over && ratio >= 80;
  const tone = over ? 'over' : warn ? 'warn' : 'ok';

  return (
    <div
      className={`family-progress family-progress--${size} family-progress--${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percentOf(spent, limit))}
      aria-valuetext={`${Math.round(ratio)}% used${over ? ', over budget' : ''}`}
    >
      <div className="family-progress__fill" style={{ width: `${percentOf(spent, limit)}%` }} />
    </div>
  );
}
