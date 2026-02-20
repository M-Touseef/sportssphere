import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import { payForTournamentRegistration } from '../services/paymentService';
import { TrophyIcon, CalendarIcon, MapPinIcon, ChevronRightIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const MyRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getMyRegistrations();
            setRegistrations(data.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            withdrawn: 'bg-red-100 text-red-800 border-red-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Registered Tournaments</h1>
                <p className="text-slate-500 mt-2">View and manage your tournament entries.</p>
            </div>

            {registrations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <TrophyIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No registrations yet</h3>
                    <p className="text-slate-500 mb-6">Find and join a tournament to start competing!</p>
                    <Link
                        to="/tournaments"
                        className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Browse Tournaments
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {registrations.map((reg) => (
                        <div key={reg._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{reg.tournament?.name}</h3>
                                        <p className="text-indigo-600 font-semibold text-sm mt-1">
                                            {reg.category?.replace('_', ' ').toUpperCase()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(reg.status)}`}>
                                        {reg.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-slate-600 font-medium">
                                        <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                                        {new Date(reg.tournament?.startDate).toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600 font-medium">
                                        <MapPinIcon className="h-4 w-4 mr-2 text-slate-400" />
                                        {reg.tournament?.venue}, {reg.tournament?.city}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600 font-medium">
                                        <BanknotesIcon className="h-4 w-4 mr-2 text-slate-400" />
                                        Total Fee: Rs. {reg.paymentAmount}
                                        <span className={`ml-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${reg.paymentStatus === 'paid'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                            {reg.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-50">
                                    <Link
                                        to={`/tournaments/${reg.tournament?._id}`}
                                        className="flex-1 text-center py-2 px-4 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        Details
                                    </Link>
                                    {reg.paymentStatus !== 'paid' ? (
                                        <button
                                            onClick={() => payForTournamentRegistration(reg._id)}
                                            className="flex-1 text-center py-2 px-4 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                        >
                                            Pay Fee
                                        </button>
                                    ) : (
                                        <Link
                                            to={`/tournaments/${reg.tournament?._id}/brackets`}
                                            className="flex-1 text-center py-2 px-4 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                        >
                                            View Brackets
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyRegistrations;
