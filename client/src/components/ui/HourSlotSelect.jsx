import { HOUR_SLOT_OPTIONS } from '../../utils/timeFormat';

/**
 * Simple hour-only select (values are HH:00).
 */
export default function HourSlotSelect({ value, onChange, disabled, className = '', id, label }) {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <select
                id={id}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`block w-full rounded-xl border-slate-300 bg-white py-2.5 text-sm font-semibold focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
            >
                <option value="">Select hour…</option>
                {HOUR_SLOT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
