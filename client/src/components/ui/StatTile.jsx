import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

/**
 * Reusable statistic tile component.
 * @param {object} props
 * @param {React.ComponentType} props.icon - Icon component to display.
 * @param {string} props.label - Title of the statistic.
 * @param {string|number} props.value - Value displayed prominently.
 * @param {string} [props.href] - Optional link target; when provided the tile shows a right arrow.
 * @param {boolean} [props.dark] - Dark mode styling flag.
 */
function StatTile({ icon: Icon, label, value, href, dark }) {
  const inner = (
    <div
      className={twMerge(
        'rounded-2xl border p-5 h-full transition-colors',
        dark
          ? 'bg-indigo-950 border-indigo-800 text-white hover:bg-indigo-900'
          : 'bg-white border-amber-100 hover:border-amber-200'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={twMerge(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            dark ? 'bg-white/10 text-amber-200' : 'bg-indigo-950/5 text-indigo-950'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {href && (
          <ArrowRightIcon className={twMerge('h-4 w-4', dark ? 'text-amber-300' : 'text-slate-400')} />
        )}
      </div>
      <p className={twMerge('text-[10px] font-bold uppercase tracking-wider', dark ? 'text-indigo-200' : 'text-slate-500')}>
        {label}
      </p>
      <p className={twMerge('text-3xl font-black mt-1', dark ? 'text-white' : 'text-slate-900')}>
        {value}
      </p>
    </div>
  );

  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}

export default StatTile;
