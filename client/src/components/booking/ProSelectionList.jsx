import { useEffect, useRef, useState } from 'react';
import sparringService from '../../services/sparringService';
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    MapPinIcon,
    SparklesIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import UserAvatar from '../ui/UserAvatar';

const formatAvailableDate = (date) => {
    if (!date) return '';
    return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

export default function ProSelectionList({
    date = '',
    startTime,
    area,
    city,
    courtId = '',
    onSelect,
    onCancel,
    preSelectedPro,
    selecting = false,
    compact = false,
    actionLabel = 'Send request'
}) {
    const [pros, setPros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [selectedProId, setSelectedProId] = useState(null);
    const requestSequence = useRef(0);

    useEffect(() => {
        if (!startTime) {
            requestSequence.current += 1;
            return;
        }

        const requestId = ++requestSequence.current;
        Promise.resolve().then(() => {
            if (requestId !== requestSequence.current) return null;
            setLoading(true);
            setLoadError(false);
            setSelectedProId(null);
            return sparringService.getAvailableProsForSlot({
                date,
                startTime,
                area: area || city,
                courtId
            });
        }).then((data) => {
            if (!data) return;
            if (requestId !== requestSequence.current) return;
            const nextPros = Array.isArray(data?.data) ? data.data : [];
            setPros(nextPros);

            if (preSelectedPro) {
                const found = nextPros.find((item) => item.player._id === preSelectedPro._id);
                if (found) setSelectedProId(found.player._id);
            }
        }).catch((error) => {
            if (requestId !== requestSequence.current) return;
            console.error('Error fetching available professionals:', error);
            setLoadError(true);
            setPros([]);
        }).finally(() => {
            if (requestId === requestSequence.current) setLoading(false);
        });

        return () => {
            requestSequence.current += 1;
        };
    }, [area, city, courtId, date, preSelectedPro, startTime]);

    if (!startTime) {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/40 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 text-amber-200">
                    <SparklesIcon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-black text-indigo-950">Choose a time slot</h3>
                <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                    Available professionals and their next matching dates will appear here instantly.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-indigo-100 bg-white">
                <div className="h-11 w-11 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-700" />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-indigo-800">
                    Finding available professionals
                </p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-72 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
                <h3 className="text-lg font-black text-rose-900">Availability could not be loaded</h3>
                <p className="mt-2 text-sm font-medium text-rose-700">Select the slot again or try another time.</p>
            </div>
        );
    }

    if (pros.length === 0) {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
                <CalendarDaysIcon className="h-10 w-10 text-amber-700" />
                <h3 className="mt-4 text-lg font-black text-slate-900">No professionals for this time</h3>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                    Try another slot. The list refreshes automatically whenever the time changes.
                </p>
            </div>
        );
    }

    const selected = pros.find((item) => item.player._id === selectedProId);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">Live availability</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">Choose your professional</h3>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                    {pros.length} available
                </span>
            </div>

            <div className={compact ? 'grid max-h-[30rem] gap-3 overflow-y-auto pr-1' : 'grid gap-4'}>
                {pros.map((item) => {
                    const isSelected = selectedProId === item.player._id;
                    return (
                        <button
                            key={item.player._id}
                            type="button"
                            onClick={() => setSelectedProId(item.player._id)}
                            className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                                isSelected
                                    ? 'border-indigo-950 bg-indigo-950 text-white shadow-xl shadow-indigo-950/20'
                                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <UserAvatar
                                    user={item.player}
                                    className={`h-14 w-14 shrink-0 rounded-2xl ring-1 ${
                                        isSelected ? 'bg-white/10 text-white ring-white/20' : 'bg-slate-50 text-slate-500 ring-slate-200'
                                    }`}
                                    fallbackClassName={isSelected ? 'text-white' : 'text-slate-500'}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className={`font-black leading-tight ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                                {item.player.name}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <span className={`text-xs font-bold capitalize ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                                    {item.player.rank || item.player.skillLevel || 'Professional'}
                                                </span>
                                            </div>
                                        </div>
                                        {isSelected && <CheckCircleIcon className="h-6 w-6 shrink-0 text-amber-300" />}
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-600'}`}>
                                            <CalendarDaysIcon className="h-4 w-4" />
                                            {formatAvailableDate(item.date || date)}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-600'}`}>
                                            <MapPinIcon className="h-4 w-4" />
                                            {item.player.area || item.player.city || 'Lahore'}
                                        </span>
                                    </div>

                                    <p className={`mt-3 text-sm font-black ${isSelected ? 'text-amber-200' : 'text-indigo-950'}`}>
                                        Rs.{Number(item.matchFee || 0).toLocaleString()} professional fee
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <Button
                type="button"
                onClick={() => selected && onSelect(selected)}
                disabled={!selected || selecting}
                isLoading={selecting}
                fullWidth
                className="h-14 rounded-2xl bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-700"
            >
                {actionLabel}
            </Button>
            {onCancel && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    fullWidth
                    className="h-11 rounded-xl border-slate-200 font-bold text-slate-700"
                >
                    Back
                </Button>
            )}
        </div>
    );
}
