import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tournamentService from '../services/tournamentService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TournamentBracket from '../components/tournament/TournamentBracket';
import { payForTournamentRegistration } from '../services/paymentService';
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
import { motion, AnimatePresence } from 'framer-motion';

// Internal component to handle bracket data fetching
const TournamentBracketWrapper = ({ tournamentId }) => {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const matchesData = await tournamentService.getTournamentMatches(tournamentId);
                processMatches(matchesData.data);
            } catch (err) {
                console.error("Failed to load bracket data", err);
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
                if (reg.player1 && reg.player2) {
                    return `${reg.player1.name} & ${reg.player2.name}`;
                }
                return reg.player?.name || "Unknown";
            };

            const getScore = (participant) => {
                if (participant.score && participant.score.length > 0) {
                    return participant.score.join(', ');
                }
                return undefined;
            };

            roundsMap[match.round].push({
                id: match._id,
                player1: {
                    name: getParticipantName(match.participant1),
                    score: getScore(match.participant1)
                },
                player2: {
                    name: getParticipantName(match.participant2),
                    score: getScore(match.participant2)
                }
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

    if (loading) return <div className="text-center py-10">Loading bracket...</div>;
    if (rounds.length === 0) return <div className="text-center py-10 text-slate-500">No matches scheduled yet for the bracket.</div>;

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
        player2Id: '',
        teamName: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [registering, setRegistering] = useState(false);
    const [registrations, setRegistrations] = useState([]);

    // Check if current user is the organizer
    const isOrganizer = tournament && user && (
        (typeof tournament.organizer === 'string' && tournament.organizer === user._id) ||
        (typeof tournament.organizer === 'object' && tournament.organizer._id === user._id)
    );

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const fetchTournament = async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getTournament(id);
            setTournament(data.data);
        } catch (error) {
            console.error('Error fetching tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        if (!tournament) return;
        try {
            const data = await tournamentService.getTournamentRegistrations(id);
            setRegistrations(data.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'registrations' && isOrganizer) {
            fetchRegistrations();
        }
    }, [activeTab, isOrganizer, tournament]);

    const [currentRegistration, setCurrentRegistration] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/tournaments/${id}` } });
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
                text: 'Championship registration data synced. Please complete the entry fee payment.'
            });

            // Initiate JuiceCash (JazzCash) payment redirect
            setTimeout(async () => {
                try {
                    // Only auto-redirect if we are still on the same page
                    if (window.location.pathname.includes(`/tournaments/${id}`)) {
                        await payForTournamentRegistration(registration._id);
                    }
                } catch (payErr) {
                    console.error('Auto-redirect failed:', payErr);
                }
            }, 2000);

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Registration protocol failed.'
            });
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

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-slate-100 text-slate-500 border-slate-200',
            registration_open: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            registration_closed: 'bg-amber-50 text-amber-600 border-amber-100',
            in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            completed: 'bg-slate-100 text-slate-500 border-slate-200',
            cancelled: 'bg-rose-50 text-rose-600 border-rose-100'
        };
        return badges[status] || 'bg-slate-100 text-slate-500 border-slate-200';
    };

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
                <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-xl shadow-indigo-100" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing Tournament Intelligence</p>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <TrophyIcon className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Deployment Not Found</h2>
                <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto">This specific event intelligence does not exist in the active registry.</p>
                <div className="mt-12">
                    <Link to="/tournaments">
                        <Button variant="outline" className="px-10 h-14 font-bold border-slate-200 rounded-2xl">Return to Central Registry</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isRegistrationOpen = tournament.status === 'registration_open' &&
        new Date() <= new Date(tournament.registrationDeadline);

    const tabs = [
        { id: 'details', label: 'Intelligence', icon: InformationCircleIcon },
        { id: 'categories', label: 'Divisions', icon: ListBulletIcon },
        { id: 'register', label: 'Registration', icon: PencilSquareIcon },
        { id: 'brackets', label: 'Match Matrix', icon: ChartBarIcon }
    ];

    if (isOrganizer) {
        tabs.push({ id: 'registrations', label: 'Active Units', icon: UsersIcon });
    }

    const InfoItem = ({ icon: Icon, label, value, subValue }) => (
        <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 shadow-sm">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
                {subValue && <p className="text-[11px] font-medium text-slate-500 mt-1">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32">
            <div className="mb-8">
                <Link to="/tournaments" className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Central Tournament Registry
                </Link>
            </div>

            {/* Premium Header Architecture */}
            <div className="bg-white shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden mb-8 sm:mb-12">
                <div className="relative h-64 md:h-96 w-full overflow-hidden">
                    {tournament.banner ? (
                        <img
                            src={tournament.banner}
                            alt={tournament.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                            <TrophyIcon className="h-32 w-32 text-slate-100" />
                        </div>
                    )}
                    <div className="absolute top-8 right-8">
                        <span className={twMerge(
                            "px-6 py-2 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-sm uppercase tracking-widest",
                            getStatusBadge(tournament.status)
                        )}>
                            {tournament.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="p-6 sm:p-8 md:p-12">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 mb-4 sm:mb-6 leading-tight">
                            {tournament.name}
                        </h1>
                        <p className="text-base sm:text-xl text-slate-500 leading-relaxed font-medium">
                            {tournament.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-12 pt-12 border-t border-slate-50">
                        <InfoItem
                            icon={MapPinIcon}
                            label="Deployment Zone"
                            value={tournament.venue}
                            subValue={tournament.city}
                        />
                        <InfoItem
                            icon={CalendarIcon}
                            label="Operation Start"
                            value={formatDate(tournament.startDate)}
                        />
                        <InfoItem
                            icon={ClockIcon}
                            label="Sync Deadline"
                            value={formatDate(tournament.registrationDeadline)}
                        />
                        <InfoItem
                            icon={UserIcon}
                            label="Strategist"
                            value={tournament.organizer.name}
                            subValue={tournament.contactEmail}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-8 space-y-8 sm:space-y-12">
                    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 rounded-3xl sm:rounded-[2.5rem] overflow-hidden">
                        <div className="flex bg-slate-50/50 border-b border-slate-100 p-2 overflow-x-auto custom-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={twMerge(
                                        "flex items-center gap-2.5 px-8 py-4 text-xs font-bold transition-all rounded-[1.25rem] whitespace-nowrap flex-1 justify-center",
                                        activeTab === tab.id
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 sm:p-10 md:p-12">
                            <AnimatePresence mode="wait">
                                {activeTab === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-12"
                                    >
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                                    <SparklesIcon className="h-5 w-5" />
                                                </div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Format Specification</h3>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <span className="h-10 w-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase tracking-widest">Type</span>
                                                    <p className="text-xl font-bold text-slate-800 capitalize">{tournament.format.replace('_', ' ')} Elimination</p>
                                                </div>
                                                <div className="h-px bg-slate-200/50 w-full mb-4" />
                                                <p className="text-slate-500 font-medium leading-relaxed">System-generated brackets will follow standardized international protocols for high-performance athletic engagement.</p>
                                            </div>
                                        </section>

                                        {tournament.rules && (
                                            <section>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="h-8 w-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                                        <ShieldCheckIcon className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Engagement Protocol</h3>
                                                </div>
                                                <div className="prose prose-slate max-w-none bg-slate-50/50 border border-slate-100 rounded-[2rem] p-10">
                                                    <p className="text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">{tournament.rules}</p>
                                                </div>
                                            </section>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'categories' && (
                                    <motion.div
                                        key="categories"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="gap-8 flex flex-col"
                                    >
                                        {tournament.categories.map((category, index) => (
                                            <div key={index} className="group relative bg-white border border-slate-100 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 hover:shadow-xl hover:shadow-slate-100 hover:border-indigo-100 transition-all duration-500">
                                                <div className="flex flex-col md:flex-row justify-between gap-6 sm:gap-8 mb-6 sm:mb-10">
                                                    <div>
                                                        <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{getCategoryLabel(category.name)}</h4>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                                                                {category.skillLevel} Division
                                                            </span>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                Max Deployment: {category.maxParticipants} Units
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entry Fee</p>
                                                        <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">Rs.{category.entryFee}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pt-8 border-t border-slate-50">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sync Status</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className={twMerge(
                                                                "h-2 w-2 rounded-full",
                                                                (tournament.registrationCounts?.[category.name] || 0) >= category.maxParticipants ? "bg-rose-500" : "bg-emerald-500"
                                                            )} />
                                                            <span className="text-xs font-bold text-slate-800 uppercase">
                                                                {(tournament.registrationCounts?.[category.name] || 0) >= category.maxParticipants ? "Limit Reached" : "Operational"}
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
                                                                className="bg-indigo-600 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                                                                style={{ width: `${Math.min(100, ((tournament.registrationCounts?.[category.name] || 0) / category.maxParticipants) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {category.prizePool && (
                                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                        <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                            <TrophyIcon className="h-4 w-4" />
                                                            Sanctioned Rewards
                                                        </h5>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            {category.prizePool.first && (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group-hover:border-indigo-100 transition-all">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Gold Asset</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">Rs.{category.prizePool.first}</p>
                                                                </div>
                                                            )}
                                                            {category.prizePool.second && (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Silver Asset</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">Rs.{category.prizePool.second}</p>
                                                                </div>
                                                            )}
                                                            {category.prizePool.third && (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Bronze Asset</p>
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">Rs.{category.prizePool.third}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'register' && (
                                    <motion.div
                                        key="register"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="max-w-2xl mx-auto py-8"
                                    >
                                        {!isRegistrationOpen ? (
                                            <div className="bg-slate-50 border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-slate-100 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
                                                    <ClockIcon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-200" />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Sync Offline</h3>
                                                <p className="text-slate-500 font-medium leading-relaxed">
                                                    Registration for this cycle is no longer available. Status: {tournament.status.replace('_', ' ')}.
                                                </p>
                                            </div>
                                        ) : tournament.userRegistration ? (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-emerald-100 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-sm">
                                                    <ShieldCheckIcon className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Deployment Active</h3>
                                                <p className="text-slate-600 font-bold leading-relaxed mb-6">
                                                    You are already registered for this championship in the <span className="text-indigo-600 uppercase">{getCategoryLabel(tournament.userRegistration.category)}</span> division.
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
                                                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Initialize Entry</h3>
                                                    <p className="text-slate-500 font-medium">Coordinate your tactical entry for the {tournament.name}.</p>
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
                                                                    onClick={() => payForTournamentRegistration(currentRegistration._id)}
                                                                    fullWidth
                                                                    size="lg"
                                                                    className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-3"
                                                                >
                                                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                        <rect x="2" y="5" width="20" height="14" rx="2" />
                                                                        <path d="M2 10h20" />
                                                                    </svg>
                                                                    Pay Now via JazzCash
                                                                </Button>
                                                                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">Secure Payment Powered by JazzCash</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <form onSubmit={handleRegister} className="space-y-8">
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                                            Combat Division
                                                        </label>
                                                        <select
                                                            value={registrationData.category}
                                                            onChange={(e) => setRegistrationData({ ...registrationData, category: e.target.value })}
                                                            required
                                                            className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50/50 px-5 font-bold text-sm focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all"
                                                        >
                                                            <option value="">Select deployment division...</option>
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
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="space-y-8 p-8 bg-slate-50 border border-slate-100 rounded-3xl"
                                                        >
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                                                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Tactical Synergy Config</h4>
                                                            </div>
                                                            <Input
                                                                label="Partner Identification Key"
                                                                value={registrationData.player2Id}
                                                                onChange={(e) => setRegistrationData({ ...registrationData, player2Id: e.target.value })}
                                                                required
                                                                placeholder="Enter unique ID key..."
                                                            />
                                                            <Input
                                                                label="Team Specification Badge (Optional)"
                                                                value={registrationData.teamName}
                                                                onChange={(e) => setRegistrationData({ ...registrationData, teamName: e.target.value })}
                                                                placeholder="e.g. Tactical Response Unit"
                                                            />
                                                        </motion.div>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        isLoading={registering}
                                                        disabled={!isAuthenticated}
                                                        fullWidth
                                                        size="lg"
                                                        className="h-16 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-100 rounded-2xl"
                                                    >
                                                        {isAuthenticated ? 'Execute Registration' : 'Authenticate to Join'}
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'registrations' && isOrganizer && (
                                    <motion.div
                                        key="registrations"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-slate-900">Registered Units</h3>
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase">{registrations.length} Total</span>
                                        </div>

                                        {registrations.length > 0 ? (
                                            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            <tr>
                                                                <th className="px-6 py-4">Participant</th>
                                                                <th className="px-6 py-4">Division</th>
                                                                <th className="px-6 py-4">Status</th>
                                                                <th className="px-6 py-4">Payment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {registrations.map((reg) => (
                                                                <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-6 py-4 font-bold text-slate-700">
                                                                        {reg.teamName || reg.player?.name || (reg.player1 ? `${reg.player1.name} & ${reg.player2?.name}` : 'Unknown')}
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
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                                <p className="text-slate-400 font-medium">No units registered yet.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'brackets' && (
                                    <motion.div
                                        key="brackets"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {['in_progress', 'completed'].includes(tournament.status) ? (
                                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 overflow-x-auto min-h-[400px]">
                                                <TournamentBracketWrapper tournamentId={id} />
                                            </div>
                                        ) : (
                                            <div className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                                                <div className="h-20 w-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                                                    <ChartBarIcon className="h-10 w-10 text-slate-100" />
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Matrix Calculation in Progress</h3>
                                                <p className="text-slate-500 max-w-sm mx-auto mt-3 font-medium text-lg leading-relaxed">
                                                    Tactical brackets will be mathematically propagated once the registration window completes.
                                                </p>
                                                {isOrganizer && tournament.status === 'registration_open' && (
                                                    <div className="mt-8 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm font-medium border border-amber-100">
                                                        <p><strong>Organizer Note:</strong> You must close registration in "My Tournaments" to generate brackets.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden sticky top-32">
                        <div className="p-6 sm:p-10 bg-slate-900 border-b border-indigo-900/10 flex justify-between items-center relative overflow-hidden text-white">
                            <h3 className="text-lg font-extrabold tracking-tight relative z-10">Sync Summary</h3>
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 relative z-10">
                                <TrophyIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                            <div className="space-y-5">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Units</span>
                                    <span className="text-sm font-bold text-slate-900 italic">
                                        {Object.values(tournament.registrationCounts || {}).reduce((a, b) => a + b, 0)} Registered
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Divisions</span>
                                    <span className="text-sm font-bold text-slate-900">{tournament.categories.length} Ready</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Deadline</span>
                                    <span className="text-sm font-bold text-indigo-600">{new Date(tournament.registrationDeadline).toLocaleDateString()}</span>
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
                                ) : isRegistrationOpen ? (
                                    <Button
                                        fullWidth
                                        size="lg"
                                        onClick={() => setActiveTab('register')}
                                        className="h-14 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 rounded-2xl"
                                    >
                                        Execute Entry
                                    </Button>
                                ) : (
                                    <div className="p-4 bg-slate-100 rounded-2xl text-center border border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sync Window Terminated</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-10 pt-0">
                            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                                <h4 className="font-bold text-[10px] text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <InformationCircleIcon className="h-4 w-4 text-indigo-600" />
                                    Tactical Notes
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        'Standard International Division Rules.',
                                        'Arrival: 30m prior to sync.',
                                        'Ref Decisions: Absolute protocol.'
                                    ].map((note, i) => (
                                        <li key={i} className="flex gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1 shrink-0 px-0" />
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
    );
};

export default TournamentDetails;
