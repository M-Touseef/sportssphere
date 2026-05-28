import React, { useState, useEffect } from 'react';
import sparringService from '../../services/sparringService';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import {
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    XMarkIcon,
    BoltIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import { formatSlotHourRange } from '../../utils/timeFormat';

const SPEC_LABELS = {
    singles: 'Singles',
    doubles: 'Doubles',
    mixed_doubles: 'Mixed doubles',
    competitive: 'Competitive',
    recreational: 'Recreational'
};

const formatSpec = (spec) =>
    SPEC_LABELS[spec] || spec?.replace(/_/g, ' ') || spec;

const FindProfessional = () => {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cityFilter, setCityFilter] = useState('');

    const [selectedProfile, setSelectedProfile] = useState(null);
    const [proAvailability, setProAvailability] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const { user } = useAuth();
    const { error: toastError } = useToast();

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async (city = '') => {
        try {
            setLoading(true);
            const response = await sparringService.getProfessionalsWithAvailability(city);
            setProfessionals(response.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toastError('Failed to load professionals.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProfessionals(cityFilter);
    };

    const resetModal = () => {
        setSelectedProfile(null);
        setProAvailability([]);
    };

    const handleViewAvailability = async (proWrapper) => {
        const proId = proWrapper.player._id;
        const profileData = proWrapper.profile?.toObject?.() || proWrapper.profile || {};

        setSelectedProfile({
            user: proWrapper.player,
            ...profileData,
            matchFee:
                proWrapper.availableSlots?.[0]?.matchFee ||
                profileData.matchFee ||
                'Variable'
        });
        setProAvailability([]);
        setLoadingAvailability(true);

        try {
            const data = await sparringService.getProAvailability(proId);
            setProAvailability(data.data || []);
        } catch (error) {
            console.error('Error fetching availability:', error);
            toastError('Failed to load availability slots.');
        } finally {
            setLoadingAvailability(false);
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const groupedAvailability = proAvailability.reduce((acc, slot) => {
        const dateKey = new Date(slot.date).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {});

    const selectedUser = selectedProfile?.user;
    const specs = Array.isArray(selectedProfile?.specializations) ? selectedProfile.specializations : [];
    const fee =
        selectedProfile?.matchFee != null && selectedProfile.matchFee !== 'Variable'
            ? Number(selectedProfile.matchFee).toLocaleString?.() ?? selectedProfile.matchFee
            : selectedProfile?.matchFee;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 sm:mb-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Find a Pro Partner</h1>
                    <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl">
                        Browse professional player profiles.
                    </p>
                </div>
                {user?.skillLevel === 'professional' && (
                    <div className="flex gap-4">
                        <Link to="/sparring/requests">
                            <Button variant="outline" className="rounded-2xl h-12 sm:h-14 px-6 sm:px-8 border-slate-200 text-sm">My Requests</Button>
                        </Link>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 mb-8 sm:mb-12 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative flex-1">
                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                        <input
                            type="text"
                            placeholder="Search by city..."
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border border-slate-200 sm:border-none bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                    <Button type="submit" className="h-12 sm:h-14 px-10 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-bold">Search</Button>
                </form>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-[2.5rem]" />
                    ))}
                </div>
            ) : professionals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {professionals.map((pro) => (
                        <ProfessionalCard
                            key={pro.player._id}
                            professional={{
                                ...pro.profile.toObject?.() || pro.profile,
                                user: pro.player,
                                matchFee: pro.availableSlots?.[0]?.matchFee || pro.profile?.matchFee || 'Variable'
                            }}
                            onSelect={() => handleViewAvailability(pro)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                    <UserIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">No Professionals Found</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">
                        Adjust your filters or check back later for new availability deployments.
                    </p>
                </div>
            )}

            <AnimatePresence>
                {selectedProfile && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={resetModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-t-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden max-h-[100vh] sm:max-h-[90vh] flex flex-col self-end sm:self-center"
                        >
                            <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl sm:text-2xl font-bold overflow-hidden">
                                        {selectedUser.profilePicture ? (
                                            <img
                                                src={selectedUser.profilePicture}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            selectedUser.name?.[0]
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{selectedUser.name}</h2>
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                                            <MapPinIcon className="h-3 w-3" />
                                            {selectedUser.city || 'Pakistan'} · Pro player
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetModal}
                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-10">
                                <section className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                                        <div className="rounded-xl bg-gradient-to-br from-indigo-950/5 to-amber-50 border border-amber-100/80 px-3 py-2.5">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70">Match fee</p>
                                            <p className="text-lg font-black text-indigo-950 mt-0.5">
                                                {fee === 'Variable' ? 'Variable' : `Rs.${fee}`}
                                            </p>
                                        </div>
                                        {selectedProfile.experienceYears != null && (
                                            <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-800/70">Experience</p>
                                                <p className="text-lg font-black text-violet-950 mt-0.5">{selectedProfile.experienceYears} yrs</p>
                                            </div>
                                        )}
                                    </div>

                                    {specs.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {specs.map((spec) => (
                                                <span
                                                    key={spec}
                                                    className="text-[10px] font-bold uppercase tracking-wide text-indigo-900 bg-slate-50 border border-amber-100/80 px-2.5 py-1 rounded-lg"
                                                >
                                                    {formatSpec(spec)}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {selectedProfile.bio && (
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                            {selectedProfile.bio}
                                        </p>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <TrophyIcon className="h-4 w-4 text-indigo-500" />
                                        Availability
                                    </h3>

                                    {loadingAvailability ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                                            <div className="h-12 w-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin" />
                                            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Loading availability</p>
                                        </div>
                                    ) : Object.keys(groupedAvailability).length > 0 ? (
                                        <div className="space-y-10">
                                            {Object.entries(groupedAvailability).map(([date, slots]) => (
                                                <div key={date}>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                                        <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                                        {formatDate(date)}
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {slots.map(slot => (
                                                            <div
                                                                key={slot._id}
                                                                className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border bg-white border-slate-100"
                                                            >
                                                                <div className="flex justify-between items-start gap-3">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-tight uppercase">
                                                                            <ClockIcon className="h-4 w-4 opacity-60" />
                                                                            {formatSlotHourRange(slot.startTime, slot.endTime)}
                                                                        </div>
                                                                        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                            {(slot.sparringType || 'singles').replace('_', ' ')} session
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black border bg-emerald-50 border-emerald-100 text-emerald-600 shrink-0">
                                                                        PKR {slot.matchFee}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 px-8 rounded-[2rem] bg-slate-50 border border-dashed border-slate-200">
                                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                <BoltIcon className="h-8 w-8 text-slate-200" />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-2">No active slots</h4>
                                            <p className="text-slate-500 font-medium text-sm">This professional has not published availability yet.</p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FindProfessional;
