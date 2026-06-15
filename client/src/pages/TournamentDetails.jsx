import { createElement, useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tournamentService from '../services/tournamentService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TournamentBracket from '../components/tournament/TournamentBracket';
import UserAvatar from '../components/ui/UserAvatar';
import {
    payForTournamentRegistration,
    getPaymentConfig,
    getPayButtonLabel,
    getPayButtonHint
} from '../services/paymentService';
import {
    MapPinIcon,
    CalendarIcon,
    UserIcon,
    TrophyIcon,
    InformationCircleIcon,
    ListBulletIcon,
    PencilSquareIcon,
    ChartBarIcon,
    EnvelopeIcon,
    PhoneIcon,
    ClockIcon,
    ArrowLeftIcon,
    SparklesIcon,
    ShieldCheckIcon,
    ChevronRightIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { formatTournamentGrade, TOURNAMENT_FORMAT_LABEL } from '../shared/constants';

const STATUS_STYLES = {
    draft: 'bg-slate-600/90 text-white border-slate-400/30',
    registration_open: 'bg-lime-300 text-slate-950 border-lime-200',
    registration_closed: 'bg-amber-300 text-slate-950 border-amber-200',
    in_progress: 'bg-sky-500 text-white border-sky-300',
    completed: 'bg-slate-800/90 text-white border-slate-400/30',
    cancelled: 'bg-rose-600/95 text-white border-rose-300/40',
};

const STATUS_LABELS = {
    draft: 'Draft',
    registration_open: 'Registration open',
    registration_closed: 'Registration closed',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

// Internal component to handle draw data fetching
const TournamentBracketWrapper = ({ tournamentId }) => {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const matchesData = await tournamentService.getTournamentMatches(tournamentId);
                processMatches(matchesData.data);
            } catch (err) {
                console.error("Failed to load draw data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, [tournamentId]);

    const processMatches = (matches) => {
        if (!matches || matches.length === 0) {
            setRounds([]);
            return;
        }

        const roundsMap = {};
        matches.forEach(match => {
            if (!roundsMap[match.round]) {
                roundsMap[match.round] = [];
            }

            const getParticipantName = (participant) => {
                if (!participant.registration) return "Bye";
                const reg = participant.registration;
                if (reg.teamName) {
                    return reg.teamName;
                }
                if (reg.player1 && reg.partnerName) {
                    return `${reg.player1.name} & ${reg.partnerName}`;
                }
                if (reg.player1 && reg.player2) {
                    return `${reg.player1.name} & ${reg.player2.name}`;
                }
                return reg.player?.name || "Unknown";
            };

            roundsMap[match.round].push({
                id: match._id,
                player1: {
                    name: getParticipantName(match.participant1),
                    scores: match.participant1.score || [],
                    isWinner: match.participant1.isWinner
                },
                player2: {
                    name: getParticipantName(match.participant2),
                    scores: match.participant2.score || [],
                    isWinner: match.participant2.isWinner
                },
                status: match.status,
                rawMatch: match
            });
        });

        const roundOrder = ['round_of_64', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'];
        const sortedRounds = [];

        roundOrder.forEach(roundKey => {
            if (roundsMap[roundKey]) {
                let title = roundKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                if (roundKey === 'quarter_final') title = 'Quarter Finals';
                if (roundKey === 'semi_final') title = 'Semi Finals';
                if (roundKey === 'final') title = 'Finals';

                sortedRounds.push({
                    title: title,
                    matches: roundsMap[roundKey]
                });
            }
        });

        Object.keys(roundsMap).forEach(key => {
            if (!roundOrder.includes(key)) {
                sortedRounds.push({
                    title: key.replace(/_/g, ' '),
                    matches: roundsMap[key]
                });
            }
        });

        setRounds(sortedRounds);
    };

    if (loading) return <div className="text-center py-10 text-slate-500 font-medium">Loading draw...</div>;
    if (rounds.length === 0) return <div className="text-center py-10 text-slate-500 font-medium">No matches scheduled yet.</div>;

    return <TournamentBracket rounds={rounds} />;
};

const TournamentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [registrationData, setRegistrationData] = useState({
        category: '',
        partnerName: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [registering, setRegistering] = useState(false);
    const [registrations, setRegistrations] = useState([]);

    // Check if current user is the organizer
    const isOrganizer = tournament && user && (
        (typeof tournament.organizer === 'string' && tournament.organizer === user._id) ||
        (typeof tournament.organizer === 'object' && tournament.organizer._id === user._id)
    );
    const isPlayerAccount = user?.role === 'player';
    const canRegister = !isAuthenticated || isPlayerAccount;

    const fetchTournament = useCallback(async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getTournament(id);
            setTournament(data.data);
        } catch (error) {
            console.error('Error fetching tournament:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTournament();
    }, [fetchTournament]);

    const fetchRegistrations = useCallback(async () => {
        if (!tournament) return;
        try {
            const data = await tournamentService.getTournamentRegistrations(id);
            setRegistrations(data.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    }, [id, tournament]);

    useEffect(() => {
        if (activeTab === 'registrations' && isOrganizer) {
            fetchRegistrations();
        }
    }, [activeTab, fetchRegistrations, isOrganizer, tournament]);

    const [currentRegistration, setCurrentRegistration] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMockMode, setPaymentMockMode] = useState(true);

    useEffect(() => {
        if (!currentRegistration) return;
        getPaymentConfig()
            .then((cfg) => setPaymentMockMode(Boolean(cfg?.mockMode)))
            .catch(() => setPaymentMockMode(true));
    }, [currentRegistration]);

    const handleRegistrationPay = async () => {
        if (!currentRegistration?._id) return;
        try {
            setPaymentLoading(true);
            const result = await payForTournamentRegistration(currentRegistration._id);
            if (result?.completed) {
                setMessage({
                    type: 'success',
                    text: 'Entry fee confirmed (demo payment). You are registered for this tournament.'
                });
                setCurrentRegistration(null);
                fetchTournament();
            }
        } catch (payErr) {
            console.error('Tournament payment error:', payErr);
            setMessage({
                type: 'error',
                text: payErr?.response?.data?.error || 'Payment could not be completed.'
            });
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/tournaments/${id}` } });
            return;
        }

        if (!isPlayerAccount) {
            setMessage({
                type: 'error',
                text: 'Only player accounts can register for tournaments. Organizers manage events from their dashboard.'
            });
            return;
        }

        try {
            setRegistering(true);
            setMessage({ type: '', text: '' });

            const response = await tournamentService.registerForTournament(id, {
                ...registrationData
            });

            const registration = response.data;
            setCurrentRegistration(registration);

            setMessage({
                type: 'success',
                text: 'Registration saved. Please complete your entry fee payment.'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Registration failed. Please try again.'
            });
        } finally {
            setRegistering(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) =>
        STATUS_STYLES[status] || STATUS_STYLES.draft;

    const formatStatus = (status) =>
        STATUS_LABELS[status] || status?.replace(/_/g, ' ');

    const getCategoryLabel = (category) => {
        const labels = {
            mens_singles: "Men's Singles",
            womens_singles: "Women's Singles",
            mens_doubles: "Men's Doubles",
            womens_doubles: "Women's Doubles",
            mixed_doubles: "Mixed Doubles",
            junior_boys: "Junior Boys",
            junior_girls: "Junior Girls"
        };
        return labels[category] || category;
    };

    const isDoubles = (category) => {
        return category.includes('doubles');
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-6">
                <div className="h-16 w-16 border-4 border-sky-100 border-t-slate-950 rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">Loading tournament...</p>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <TrophyIcon className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tournament not found</h2>
                <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto">This event may have been removed or the link is incorrect.</p>
                <div className="mt-12">
                    <Link to="/tournaments">
                        <Button className="px-10 h-14 font-bold rounded-2xl bg-slate-950 hover:bg-slate-800 text-white">Browse tournaments</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isRegistrationOpen = tournament.status === 'registration_open' &&
        new Date() <= new Date(tournament.registrationDeadline);

    const tabs = [
        { id: 'details', label: 'Overview', icon: InformationCircleIcon },
        { id: 'categories', label: 'Categories', icon: ListBulletIcon },
        { id: 'draws', label: 'Draws', icon: ChartBarIcon },
    ];

    if (canRegister) {
        tabs.splice(2, 0, { id: 'register', label: 'Register', icon: PencilSquareIcon });
    }

    if (isOrganizer) {
        tabs.push({ id: 'registrations', label: 'Registrations', icon: UsersIcon });
    }

    const getRegistrationPlayers = (registration) => {
        if (registration?.player1 || registration?.player2) {
            return [registration.player1, registration.player2].filter(Boolean);
        }
        return registration?.player ? [registration.player] : [];
    };

    const InfoItem = ({ icon: Icon, label, value, subValue, accent = 'slate' }) => {
        const accents = {
            slate: 'bg-slate-950 text-white border-slate-800',
            sky: 'bg-sky-600 text-white border-sky-500',
            lime: 'bg-lime-300 text-slate-950 border-lime-200',
            cyan: 'bg-cyan-700 text-white border-cyan-600',
        };
        return (
            <div className="flex items-start gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className={twMerge('h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border shadow-sm', accents[accent] || accents.slate)}>
                    {createElement(Icon, { className: 'h-5 w-5' })}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{value}</p>
                    {subValue && <p className="text-[11px] font-medium text-slate-600 mt-1">{subValue}</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                <div className="mb-6">
                    <Link
                        to="/tournaments"
                        className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        All tournaments
                    </Link>
                </div>

                {/* Hero */}
                <div className="rounded-[2rem] sm:rounded-[2.75rem] overflow-hidden mb-10 sm:mb-12 border border-slate-200 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.4)]">
                    <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden">
                        {tournament.banner ? (
                            <>
                                <img src={tournament.banner} alt={tournament.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-sky-950/20" />
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 flex items-center justify-center">
                                <TrophyIcon className="h-28 w-28 text-lime-300/20" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.2),transparent_45%)]" />
                            </div>
                        )}
                        <div className="absolute top-5 right-5 sm:top-8 sm:right-8">
                            <span
                                className={twMerge(
                                    'px-4 py-1.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-lg uppercase tracking-wider',
                                    getStatusBadge(tournament.status)
                                )}
                            >
                                {formatStatus(tournament.status)}
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-12">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-100 mb-4">
                                <TrophyIcon className="h-3.5 w-3.5 text-lime-300" />
                                Championship event
                            </div>
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1] max-w-4xl">
                                {tournament.name}
                            </h1>
                        </div>
                    </div>

                    <div className="bg-white p-6 sm:p-8 md:p-12 border-t border-slate-200">
                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-3xl">
                            {tournament.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 pt-8 border-t border-slate-200">
                            <InfoItem icon={MapPinIcon} label="Venue" value={tournament.venue} subValue={tournament.city} accent="sky" />
                            <InfoItem icon={CalendarIcon} label="Start date" value={formatDate(tournament.startDate)} accent="slate" />
                            <InfoItem icon={ClockIcon} label="Registration closes" value={formatDate(tournament.registrationDeadline)} accent="cyan" />
                            <InfoItem
                                icon={UserIcon}
                                label="Organizer"
                                value={tournament.organizer?.name}
                                subValue={tournament.contactEmail}
                                accent="lime"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-8 space-y-8 sm:space-y-12">
                    <div className="bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.16)] border border-slate-200 rounded-3xl sm:rounded-[2.5rem] overflow-hidden">
                        <div className="flex bg-slate-950 border-b border-slate-800 p-2 gap-1 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={twMerge(
                                        'flex items-center gap-2 px-5 sm:px-7 py-3.5 text-xs font-bold transition-all rounded-xl whitespace-nowrap flex-1 justify-center min-w-[5.5rem]',
                                        activeTab === tab.id
                                            ? 'bg-lime-300 text-slate-950 shadow-md shadow-slate-950/20'
                                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 sm:p-10 md:p-12 bg-gradient-to-b from-white to-slate-50/70">
                            <AnimatePresence mode="wait">
                                {activeTab === 'details' && (
                                    <Motion.div
                                        key="details"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-12"
                                    >
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-8 w-8 bg-sky-50 rounded-xl flex items-center justify-center text-sky-700">
                                                    <SparklesIcon className="h-5 w-5" />
                                                </div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-950">Tournament format</h3>
                                            </div>
                                            <div className="bg-gradient-to-br from-slate-50 to-sky-50 border border-slate-200 rounded-3xl p-8">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div
                                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lime-300 shadow-sm"
                                                        aria-hidden
                                                    >
                                                        <ChartBarIcon className="h-6 w-6" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                                            Format
                                                        </p>
                                                        <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                                                            {TOURNAMENT_FORMAT_LABEL}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-px bg-slate-200 w-full mb-4" />
                                                <p className="text-slate-600 font-medium leading-relaxed">
                                                    Draws are generated automatically when registration closes and the draw is published.
                                                </p>
                                            </div>
                                        </section>

                                        {tournament.rules && (
                                            <section>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="h-8 w-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                                        <ShieldCheckIcon className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-950">Rules & regulations</h3>
                                                </div>
                                                <div className="prose prose-slate max-w-none bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
                                                    <p className="text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">{tournament.rules}</p>
                                                </div>
                                            </section>
                                        )}
                                    </Motion.div>
                                )}

                                {activeTab === 'categories' && (
                                    <Motion.div
                                        key="categories"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="gap-8 flex flex-col"
                                    >
                                        {tournament.categories.map((category, index) => (
                                            <div key={index} className="group relative bg-white border border-slate-200 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 hover:shadow-xl hover:shadow-sky-900/10 hover:border-sky-200 transition-all duration-500">
                                                <div className="flex flex-col md:flex-row justify-between gap-6 sm:gap-8 mb-6 sm:mb-10">
                                                    <div>
                                                        <h4 className="text-2xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors tracking-tight">{getCategoryLabel(category.name)}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                                            <span className="px-3 py-1 rounded-full bg-slate-950 text-white text-[10px] font-bold uppercase tracking-widest">
                                                                {formatTournamentGrade(category.skillLevel)}
                                                            </span>
                                                            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-widest">
                                                                Max {category.maxParticipants} players
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entry Fee</p>
                                                        <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-sky-700 transition-colors">Rs.{category.entryFee}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pt-8 border-t border-slate-50">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Availability</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className={twMerge(
                                                                'h-2 w-2 rounded-full',
                                                                (tournament.registrationCounts?.[category.name] || 0) >= category.maxParticipants ? 'bg-rose-500' : 'bg-emerald-500'
                                                            )} />
                                                            <span className="text-xs font-bold text-slate-800">
                                                                {(tournament.registrationCounts?.[category.name] || 0) >= category.maxParticipants ? 'Full' : 'Open'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registered</p>
                                                        <p className="text-sm font-bold text-slate-900 uppercase">
                                                            {tournament.registrationCounts?.[category.name] || 0} / {category.maxParticipants}
                                                        </p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Utilization</p>
                                                        <div className="w-full bg-slate-50 rounded-full h-2.5 mt-3 border border-slate-100 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-sky-600 to-lime-400 h-full rounded-full transition-all duration-700"
                                                                style={{ width: `${Math.min(100, ((tournament.registrationCounts?.[category.name] || 0) / category.maxParticipants) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {category.prizePool && (
                                                    <div className="bg-gradient-to-br from-slate-50 to-sky-50 rounded-2xl p-6 border border-slate-200">
                                                        <h5 className="text-[10px] font-bold text-slate-950 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                            <TrophyIcon className="h-4 w-4 text-sky-600" />
                                                            Prize pool
                                                        </h5>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            {category.prizePool.first && (
                                                                <div className="bg-white p-4 rounded-xl border-2 border-amber-300/50 shadow-sm">
                                                                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-1.5">1st place</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">Rs. {category.prizePool.first}</p>
                                                                </div>
                                                            )}
                                                            {category.prizePool.second && (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">2nd place</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">Rs. {category.prizePool.second}</p>
                                                                </div>
                                                            )}
                                                            {category.prizePool.third && (
                                                                <div className="bg-white p-4 rounded-xl border border-amber-700/20 shadow-sm">
                                                                    <p className="text-[9px] font-bold text-amber-900/70 uppercase tracking-widest mb-1.5">3rd place</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">Rs. {category.prizePool.third}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </Motion.div>
                                )}

                                {activeTab === 'register' && (
                                    <Motion.div
                                        key="register"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="max-w-2xl mx-auto py-8"
                                    >
                                        {!canRegister ? (
                                            <div className="bg-sky-50 border border-sky-100 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-sky-100 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
                                                    <ShieldCheckIcon className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Organizer workspace</h3>
                                                <p className="text-slate-600 font-medium leading-relaxed">
                                                    Organizer accounts manage tournaments and cannot register as players.
                                                </p>
                                            </div>
                                        ) : !isRegistrationOpen ? (
                                            <div className="bg-slate-50 border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-slate-100 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
                                                    <ClockIcon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-200" />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Registration closed</h3>
                                                <p className="text-slate-500 font-medium leading-relaxed">
                                                    Registration is not open for this event. Status: {formatStatus(tournament.status)}.
                                                </p>
                                            </div>
                                        ) : tournament.userRegistration ? (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-emerald-100 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
                                                    <ShieldCheckIcon className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">You&apos;re registered</h3>
                                                <p className="text-slate-600 font-bold leading-relaxed mb-6">
                                                    You are entered in <span className="text-indigo-700">{getCategoryLabel(tournament.userRegistration.category)}</span>.
                                                </p>
                                                <div className="flex justify-center gap-4">
                                                    <Link to="/my/tournaments">
                                                        <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">Manage Entry</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                <div className="text-center mb-10">
                                                    <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-3">Register now</h3>
                                                    <p className="text-slate-500 font-medium">Join {tournament.name} — choose your category below.</p>
                                                </div>

                                                {message.text && (
                                                    <div className="space-y-4">
                                                        <div className={twMerge(
                                                            "p-5 rounded-2xl flex items-center gap-4 border shadow-sm",
                                                            message.type === 'success'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                        )}>
                                                            {message.type === 'success' ? <ShieldCheckIcon className="h-6 w-6" /> : <InformationCircleIcon className="h-6 w-6" />}
                                                            <p className="text-sm font-bold uppercase tracking-tight">{message.text}</p>
                                                        </div>

                                                        {message.type === 'success' && currentRegistration && (
                                                            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xl shadow-slate-100 space-y-4">
                                                                <div className="flex justify-between items-center px-2">
                                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entry Fee</span>
                                                                    <span className="text-xl font-black text-slate-900 tracking-tight">Rs. {tournament.categories.find(c => c.name === currentRegistration.category)?.entryFee}</span>
                                                                </div>
                                                                <Button
                                                                    onClick={handleRegistrationPay}
                                                                    disabled={paymentLoading}
                                                                    isLoading={paymentLoading}
                                                                    fullWidth
                                                                    size="lg"
                                                                    className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-3"
                                                                >
                                                                    {!paymentLoading && (
                                                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                                                            <path d="M2 10h20" />
                                                                        </svg>
                                                                    )}
                                                                    {getPayButtonLabel(paymentMockMode)}
                                                                </Button>
                                                                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                                                                    {getPayButtonHint(paymentMockMode)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <form onSubmit={handleRegister} className="space-y-8">
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                                            Category
                                                        </label>
                                                        <select
                                                            value={registrationData.category}
                                                            onChange={(e) => setRegistrationData({ ...registrationData, category: e.target.value })}
                                                            required
                                                            className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 font-bold text-sm text-slate-800 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                                        >
                                                            <option value="">Select a category…</option>
                                                            {tournament.categories.map((cat) => {
                                                                const isFull = (tournament.registrationCounts?.[cat.name] || 0) >= cat.maxParticipants;
                                                                return (
                                                                    <option
                                                                        key={cat.name}
                                                                        value={cat.name}
                                                                        disabled={isFull}
                                                                    >
                                                                        {getCategoryLabel(cat.name)} - Rs.{cat.entryFee}
                                                                        {isFull ? ' [LIMIT REACHED]' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>

                                                    {registrationData.category && isDoubles(registrationData.category) && (
                                                        <Motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="space-y-8 p-8 bg-sky-50/60 border border-sky-100 rounded-3xl"
                                                        >
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="h-6 w-6 rounded-full bg-slate-950 text-lime-300 flex items-center justify-center text-[10px] font-bold">2</div>
                                                                <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Doubles partner</h4>
                                                            </div>
                                                            <Input
                                                                label="Partner name"
                                                                value={registrationData.partnerName}
                                                                onChange={(e) => setRegistrationData({ ...registrationData, partnerName: e.target.value })}
                                                                required
                                                                placeholder="Enter partner's name"
                                                            />
                                                        </Motion.div>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        isLoading={registering}
                                                        disabled={!isAuthenticated}
                                                        fullWidth
                                                        size="lg"
                                                        className="h-16 text-base font-bold bg-slate-950 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 rounded-2xl"
                                                    >
                                                        {isAuthenticated ? 'Submit registration' : 'Sign in to register'}
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </Motion.div>
                                )}

                                {activeTab === 'registrations' && isOrganizer && (
                                    <Motion.div
                                        key="registrations"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-slate-950">Registrations</h3>
                                            <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold uppercase">{registrations.length} Total</span>
                                        </div>

                                        {registrations.length > 0 ? (
                                            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            <tr>
                                                                <th className="px-6 py-4">Participant</th>
                                                                <th className="px-6 py-4">Category</th>
                                                                <th className="px-6 py-4">Status</th>
                                                                <th className="px-6 py-4">Payment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {registrations.map((reg) => {
                                                                const participants = getRegistrationPlayers(reg);
                                                                return (
                                                                    <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-6 py-4 font-bold text-slate-700">
                                                                        <div className="flex items-center gap-3 min-w-52">
                                                                            <div className="flex -space-x-2">
                                                                                {participants.length > 0 ? participants.slice(0, 2).map((participant) => (
                                                                                    <UserAvatar
                                                                                        key={participant._id || participant.name}
                                                                                        user={participant}
                                                                                        className="h-9 w-9 rounded-xl border-2 border-white bg-indigo-950 text-xs shadow-sm"
                                                                                        fallbackClassName="text-xs"
                                                                                    />
                                                                                )) : (
                                                                                    <UserAvatar
                                                                                        user={{ name: 'Unknown' }}
                                                                                        className="h-9 w-9 rounded-xl border-2 border-white bg-slate-100 text-slate-500 text-xs shadow-sm"
                                                                                        fallbackClassName="text-xs"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <span className="truncate">
                                                                                {reg.teamName || reg.player?.name || (reg.player1 && reg.partnerName ? `${reg.player1.name} & ${reg.partnerName}` : (reg.player1 ? `${reg.player1.name} & ${reg.player2?.name}` : 'Unknown'))}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 font-medium text-slate-500">
                                                                        {getCategoryLabel(reg.category)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                                                                            {reg.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                                                                            {reg.paymentStatus}
                                                                        </span>
                                                                    </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                                <p className="text-slate-400 font-medium">No registrations yet.</p>
                                            </div>
                                        )}
                                    </Motion.div>
                                )}

                                {activeTab === 'draws' && (
                                    <Motion.div
                                        key="draws"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {['registration_closed', 'in_progress', 'completed'].includes(tournament.status) ? (
                                            <div className="min-h-[400px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 sm:rounded-[2.5rem] sm:p-8">
                                                <TournamentBracketWrapper tournamentId={id} />
                                            </div>
                                        ) : (
                                            <div className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                                                <div className="h-20 w-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                                                    <ChartBarIcon className="h-10 w-10 text-slate-100" />
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">Draws not published yet</h3>
                                                <p className="text-slate-500 max-w-sm mx-auto mt-3 font-medium text-lg leading-relaxed">
                                                    The draw will appear here after registration closes and the organizer publishes draws.
                                                </p>
                                                {isOrganizer && tournament.status === 'registration_open' && (
                                                    <div className="mt-8 p-4 bg-sky-50 text-sky-800 rounded-xl text-sm font-medium border border-sky-100">
                                                        <p><strong>Organizer Note:</strong> You must close registration in "My Tournaments" to generate draws.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4">
                    <div className="bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.2)] border border-slate-200 rounded-3xl sm:rounded-[2.5rem] overflow-hidden sticky top-32">
                        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex justify-between items-center relative overflow-hidden text-white border-b-4 border-lime-300">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.15),transparent_50%)]" />
                            <h3 className="text-lg font-extrabold tracking-tight relative z-10 text-white">At a glance</h3>
                            <div className="h-10 w-10 rounded-xl bg-lime-300/15 flex items-center justify-center text-lime-300 border border-lime-300/30 relative z-10">
                                <TrophyIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registered</span>
                                    <span className="text-sm font-bold text-slate-900 italic">
                                        {Object.values(tournament.registrationCounts || {}).reduce((a, b) => a + b, 0)} Registered
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categories</span>
                                    <span className="text-sm font-bold text-slate-900">{tournament.categories.length}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deadline</span>
                                    <span className="text-sm font-bold text-sky-700">{new Date(tournament.registrationDeadline).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                {tournament.userRegistration ? (
                                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                                            <ShieldCheckIcon className="h-5 w-5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Entry Confirmed</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                                            Registered for {getCategoryLabel(tournament.userRegistration.category)}
                                        </p>
                                    </div>
                                ) : isOrganizer ? (
                                    <Button
                                        fullWidth
                                        size="lg"
                                        onClick={() => setActiveTab('registrations')}
                                        className="h-14 font-bold bg-slate-950 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 rounded-2xl"
                                    >
                                        Manage registrations
                                    </Button>
                                ) : isRegistrationOpen && canRegister ? (
                                    <Button
                                        fullWidth
                                        size="lg"
                                        onClick={() => setActiveTab('register')}
                                        className="h-14 font-bold bg-lime-300 hover:bg-lime-200 text-slate-950 shadow-lg shadow-lime-100 rounded-2xl"
                                    >
                                        Register now
                                    </Button>
                                ) : !canRegister ? (
                                    <div className="p-4 bg-sky-50 rounded-2xl text-center border border-sky-100">
                                        <p className="text-[10px] font-bold text-sky-700 uppercase tracking-[0.15em]">Organizer accounts cannot register</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-100 rounded-2xl text-center border border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Registration closed</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 sm:px-8 pb-8">
                            <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50">
                                <h4 className="font-bold text-[10px] text-slate-950 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <InformationCircleIcon className="h-4 w-4 text-sky-600" />
                                    Good to know
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        'Standard badminton division rules apply.',
                                        'Arrive at least 30 minutes before your match.',
                                        'Referee decisions are final.',
                                    ].map((note, i) => (
                                        <li key={i} className="flex gap-2.5 text-xs font-medium text-slate-600">
                                            <span className="text-amber-500 mt-0.5">●</span>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default TournamentDetails;
