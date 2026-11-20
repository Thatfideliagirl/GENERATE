import type { Period } from '../lib/period'
import { PERIODS } from '../lib/period'

/** Today, this week, this month, this year or all time. */
export function PeriodTabs({ value, onChange, label = 'Show' }: { value: Period; onChange: (p: Period) => void; label?: string }) {
  return (
    <div className="seg a-seg a-period" role="tablist" aria-label={label}>
      {PERIODS.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  )
}
