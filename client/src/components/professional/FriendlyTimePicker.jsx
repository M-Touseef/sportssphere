import React, { useMemo } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const MINUTE_OPTIONS = [0, 15, 30, 45];

/** Snap to nearest quarter hour for display/sync */
function snapMinutes(m) {
    return MINUTE_OPTIONS.reduce((best, cur) =>
        Math.abs(cur - m) < Math.abs(best - m) ? cur : best
    , 0);
}

function parseHHmm(value) {
    if (!value || typeof value !== 'string' || !/^\d{1,2}:\d{2}$/.test(value.trim())) {
        return { h24: 18, minute: 0 };
    }
    const [hs, ms] = value.trim().split(':');
    const h = Math.min(23, Math.max(0, parseInt(hs, 10)));
    const mRaw = parseInt(ms, 10);
    const minute = Number.isFinite(mRaw) ? snapMinutes(Math.min(59, Math.max(0, mRaw))) : 0;
    return { h24: h, minute };
}

function toHHmm(h24, minute) {
    return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
    const { h24, minute } = parseHHmm(hhmm);
    const endH = (h24 + 1) % 24;
    return toHHmm(endH, minute);
}

function formatFriendly(hhmm) {
    const { h24, minute } = parseHHmm(hhmm);
    const d = setMinutes(setHours(new Date(2000, 0, 1), h24), minute);
    return format(d, 'h:mm a');
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
 * Visual time chooser for weekly slots (outputs HH:mm 24h for the API).
 */
const FriendlyTimePicker = ({ value, onChange, disabled, error }) => {
    const { h24, minute } = useMemo(() => parseHHmm(value), [value]);
    const { h12, period } = h24To12Parts(h24);
    const endPreview = value ? addOneHour(value) : '';

    const commit = (nextH24, nextMin) => {
        onChange(toHHmm(nextH24, nextMin));
    };

    const setFrom12 = (nextH12, nextPeriod, min = minute) => {
        commit(partsToH24(nextH12, nextPeriod), min);
    };

    return (
        <div
            className={clsx(
                'rounded-2xl border bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 sm:p-5',
                error ? 'border-red-300 ring-1 ring-red-200' : 'border-indigo-100'
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
                    <ClockIcon className="h-9 w-9" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Session start</p>
                    <p className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {value ? formatFriendly(value) : 'Choose a time'}
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
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50',
                            disabled && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        {p.label}
                        <span className="ml-1 font-normal text-slate-500">{formatFriendly(p.value)}</span>
                    </button>
                ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Hour</label>
                    <select
                        disabled={disabled}
                        value={h12}
                        onChange={(e) => setFrom12(Number(e.target.value), period)}
                        className="block w-full rounded-xl border-slate-200 bg-white py-3 pl-3 pr-8 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>
                                {h}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="hidden items-center justify-center pb-2 text-2xl font-bold text-slate-400 sm:col-span-1 sm:flex">:</div>
                <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</label>
                    <select
                        disabled={disabled}
                        value={minute}
                        onChange={(e) => commit(h24, Number(e.target.value))}
                        className="block w-full rounded-xl border-slate-200 bg-white py-3 pl-3 pr-8 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                        {MINUTE_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                                {String(m).padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Period</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setFrom12(h12, 'am')}
                            className={clsx(
                                'rounded-xl py-3 text-sm font-bold transition-colors',
                                period === 'am'
                                    ? 'bg-indigo-600 text-white shadow'
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
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            PM
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100/80 pt-3">
                <span className="text-xs text-slate-500">24-hour: {value || '—'}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            let total = h24 * 60 + minute - 15;
                            if (total < 0) total += 24 * 60;
                            commit(Math.floor(total / 60) % 24, total % 60);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        −15 min
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            let total = h24 * 60 + minute + 15;
                            total %= 24 * 60;
                            commit(Math.floor(total / 60), total % 60);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        +15 min
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FriendlyTimePicker;
