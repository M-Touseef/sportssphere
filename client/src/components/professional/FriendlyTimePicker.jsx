import React, { useMemo } from 'react';
import { format, setHours } from 'date-fns';
import { ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function parseHHmm(value) {
    if (!value || typeof value !== 'string' || !/^\d{1,2}:\d{2}$/.test(value.trim())) {
        return { h24: 18 };
    }
    const [hs] = value.trim().split(':');
    const h = Math.min(23, Math.max(0, parseInt(hs, 10)));
    return { h24: Number.isNaN(h) ? 18 : h };
}

function toHHmm(h24) {
    return `${String(h24).padStart(2, '0')}:00`;
}

function h24To12Parts(h24) {
    const period = h24 >= 12 ? 'pm' : 'am';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return { h12, period };
}

function partsToH24(h12, period) {
    if (period === 'am') {
        if (h12 === 12) return 0;
        return h12;
    }
    if (h12 === 12) return 12;
    return h12 + 12;
}

function addOneHour(hhmm) {
    const { h24 } = parseHHmm(hhmm);
    return toHHmm((h24 + 1) % 24);
}

function formatFriendly(hhmm) {
    const { h24 } = parseHHmm(hhmm);
    const d = setHours(new Date(2000, 0, 1), h24);
    return format(d, 'h a');
}

const PRESETS = [
    { label: 'Early', value: '07:00' },
    { label: 'Morning', value: '09:00' },
    { label: 'Noon', value: '12:00' },
    { label: 'Afternoon', value: '15:00' },
    { label: 'Evening', value: '18:00' },
    { label: 'Night', value: '20:00' },
];

/**
 * Hour-only time chooser for weekly slots (outputs HH:00 for the API).
 */
const FriendlyTimePicker = ({ value, onChange, disabled, error }) => {
    const { h24 } = useMemo(() => parseHHmm(value), [value]);
    const { h12, period } = h24To12Parts(h24);
    const endPreview = value ? addOneHour(value) : '';

    const commit = (nextH24) => {
        onChange(toHHmm(nextH24));
    };

    const setFrom12 = (nextH12, nextPeriod) => {
        commit(partsToH24(nextH12, nextPeriod));
    };

    return (
        <div
            className={clsx(
                'rounded-2xl border bg-gradient-to-br from-slate-50 to-sky-50/60 p-4 sm:p-5',
                error ? 'border-red-300 ring-1 ring-red-200' : 'border-sky-100'
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lime-200 shadow-md shadow-slate-300">
                    <ClockIcon className="h-9 w-9" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Session start</p>
                    <p className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {value ? formatFriendly(value) : 'Choose an hour'}
                    </p>
                    {value && (
                        <p className="mt-0.5 text-sm text-slate-600">
                            1-hour window · ends{' '}
                            <span className="font-semibold text-slate-800">{formatFriendly(endPreview)}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                    <button
                        key={p.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(p.value)}
                        className={clsx(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            value === p.value
                                ? 'border-slate-950 bg-slate-950 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50',
                            disabled && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        {p.label}
                        <span className="ml-1 font-normal text-slate-500">{formatFriendly(p.value)}</span>
                    </button>
                ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Hour</label>
                    <select
                        disabled={disabled}
                        value={h12}
                        onChange={(e) => setFrom12(Number(e.target.value), period)}
                        className="block w-full rounded-xl border-slate-200 bg-white py-3 pl-3 pr-8 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>
                                {h}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Period</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setFrom12(h12, 'am')}
                            className={clsx(
                                'rounded-xl py-3 text-sm font-bold transition-colors',
                                period === 'am'
                                    ? 'bg-slate-950 text-white shadow'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            AM
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setFrom12(h12, 'pm')}
                            className={clsx(
                                'rounded-xl py-3 text-sm font-bold transition-colors',
                                period === 'pm'
                                    ? 'bg-slate-950 text-white shadow'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            PM
                        </button>
                    </div>
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-500 border-t border-sky-100 pt-3">
                Sessions are booked in full-hour blocks ({value || '—'}).
            </p>
        </div>
    );
};

export default FriendlyTimePicker;
