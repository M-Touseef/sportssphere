import React, { useState, useEffect } from 'react';
import sparringService from '../../services/sparringService';
import { UserIcon, StarIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

export default function ProSelectionList({ date, startTime, city, onSelect, onCancel, preSelectedPro }) {
    const [pros, setPros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProId, setSelectedProId] = useState(null);

    useEffect(() => {
        if (preSelectedPro && pros.length > 0) {
            const found = pros.find(p => p.player._id === preSelectedPro._id);
            if (found) {
                setSelectedProId(found.player._id);
            }
        }
    }, [preSelectedPro, pros]);

    useEffect(() => {
        fetchPros();
    }, [date, startTime, city]);

    const fetchPros = async () => {
        try {
            setLoading(true);
            const data = await sparringService.getAvailableProsForSlot(date, startTime, '', city);
            setPros(data.data);
        } catch (error) {
            console.error('Error fetching available pros:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Grid for Professionals...</p>
            </div>
        );
    }

    if (pros.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-500 mb-6">No professional players available for this specific sector and interval.</p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" size="sm" onClick={onCancel}>Select Different Slot</Button>
                    <Button size="sm" onClick={() => onSelect(null)}>Book Court Only</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Professionals</h3>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{pros.length} Identified</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {pros.map((item) => (
                    <div
                        key={item.player._id}
                        onClick={() => setSelectedProId(item.player._id)}
                        className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${selectedProId === item.player._id
                            ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100'
                            : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                            }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center shadow-sm ${selectedProId === item.player._id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'
                                }`}>
                                <UserIcon className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-lg font-extrabold tracking-tight break-words ${selectedProId === item.player._id ? 'text-white' : 'text-slate-900'}`}>
                                    {item.player.name}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1">
                                        <StarIcon className={`h-3 w-3 fill-current ${selectedProId === item.player._id ? 'text-white' : 'text-amber-400'}`} />
                                        <span className={`text-xs font-bold uppercase tracking-widest ${selectedProId === item.player._id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {item.player.skillLevel || 'Pro'}
                                        </span>
                                    </div>
                                    <span className={`h-1 w-1 rounded-full ${selectedProId === item.player._id ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                                    <div className="flex items-center gap-1">
                                        <MapPinIcon className={`h-3 w-3 ${selectedProId === item.player._id ? 'text-indigo-100' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-bold uppercase tracking-widest ${selectedProId === item.player._id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {item.player.city}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {selectedProId === item.player._id && (
                                <CheckCircleIcon className="h-6 w-6 text-white" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button
                    fullWidth
                    disabled={!selectedProId}
                    onClick={() => {
                        const selected = pros.find(p => p.player._id === selectedProId);
                        onSelect(selected);
                    }}
                >
                    Request Session
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={onCancel}>Cancel</Button>
                    <Button variant="ghost" fullWidth onClick={() => onSelect(null)}>Book Court Only</Button>
                </div>
            </div>
        </div>
    );
}
