import { useEffect, useState } from 'react';
import { getCoachingRequestsForMyCourts } from '../../services/courtService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';

const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const ms = new Date(deadline) - new Date();
    if (ms <= 0) return 'Expired';
    const mins = Math.floor(ms / 60000);
    return `${mins} min left for coach to respond`;
};

export default function OrganizerCoachingRequests() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getCoachingRequestsForMyCourts();
                setSessions(res.data || []);
            } catch (e) {
                console.error(e);
                setSessions([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Coaching session requests</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Players requested coaching at your courts. The coach must confirm within 30 minutes or the request is auto-declined.
                </p>
            </div>

            {sessions.length === 0 ? (
                <p className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                    No pending coaching requests on your courts.
                </p>
            ) : (
                <ul className="space-y-4">
                    {sessions.map((s) => (
                        <li
                            key={s._id}
                            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
                        >
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 text-xs font-bold uppercase bg-amber-50 text-amber-700 rounded-lg">
                                    Awaiting coach
                                </span>
                                {s.responseDeadline && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                                        <ClockIcon className="h-4 w-4" />
                                        {formatDeadline(s.responseDeadline)}
                                    </span>
                                )}
                            </div>
                            <p className="font-bold text-slate-900">{s.court?.name}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <MapPinIcon className="h-4 w-4" />
                                {new Date(s.date).toLocaleDateString()} · {s.startTime} – {s.endTime}
                            </p>
                            <p className="text-sm text-slate-600 mt-3 flex items-center gap-1">
                                <UserIcon className="h-4 w-4" />
                                Coach: {s.coach?.name || '—'}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                                Player(s):{' '}
                                {(s.students || []).map((st) => st.name).filter(Boolean).join(', ') || '—'}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
