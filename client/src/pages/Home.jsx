import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    TrophyIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowRightIcon,
    BoltIcon,
    ArrowTrendingUpIcon,
    GlobeAltIcon,
    SparklesIcon,
    ShieldCheckIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const Home = () => {
    const { user } = useAuth();

    const authLink = (targetHref) =>
        user ? targetHref : { pathname: '/login', state: { from: { pathname: targetHref } } };

    return (
        <div className="bg-white text-slate-900 overflow-x-hidden">
            {/* Nav Padding Offset - Increased for sticky navbar */}
            <div className="pt-20 md:pt-32">
                {/* Hero Section */}
                <div className="relative isolate">
                    {/* Abstract Soft Glow */}
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-emerald-200 opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                    </div>

                    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 md:py-24 flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex mb-10"
                        >
                            <div className="relative flex items-center gap-x-4 rounded-full px-6 py-2.5 text-xs font-bold leading-6 text-indigo-600 ring-1 ring-indigo-200 bg-indigo-50/20 backdrop-blur-sm hover:bg-indigo-50/40 transition-all">
                                <span className="flex items-center gap-1.5"><SparklesIcon className="h-4 w-4" /> 2025 Platform Update</span>
                                <div className="h-3 w-px bg-indigo-200" />
                                <Link to={authLink('/tournaments')} className="flex items-center gap-x-1 text-slate-600 hover:text-indigo-600 transition-colors">
                                    View Rankings
                                    <ArrowRightIcon className="h-3 w-3" />
                                </Link>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight text-slate-900 max-w-5xl leading-[1.1] px-4"
                        >
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500">Elite Performance</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8 sm:mt-10 text-lg sm:text-xl leading-relaxed sm:leading-8 text-slate-500 max-w-3xl font-medium px-6"
                        >
                            Join the ultimate sports platform. Book high-quality courts, enter professional tournaments, and get direct coaching from expert mentors.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-14 flex flex-col sm:flex-row items-center gap-8"
                        >
                            <Link to="/register">
                                <Button size="lg" className="h-16 px-14 text-lg font-black shadow-2xl shadow-indigo-200 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white transform hover:scale-[1.02] transition-all">
                                    Join the Network
                                </Button>
                            </Link>
                            <Link to={authLink('/tournaments')} className="group text-sm font-black text-slate-900 flex items-center gap-3 hover:text-indigo-600 transition-all uppercase tracking-widest">
                                Discover Events
                                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 group-hover:bg-white group-hover:shadow-md group-hover:border-indigo-100 transition-all">
                                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-24 flex flex-col items-center gap-8"
                        >
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="inline-block h-14 w-14 rounded-[1.25rem] bg-white ring-8 ring-white shadow-2xl flex items-center justify-center border border-slate-100 overflow-hidden transform hover:-translate-y-2 transition-transform cursor-pointer">
                                        <div className={twMerge("w-full h-full flex items-center justify-center text-[10px] font-black text-white",
                                            i === 1 ? "bg-indigo-500" :
                                                i === 2 ? "bg-emerald-500" :
                                                    i === 3 ? "bg-amber-500" :
                                                        i === 4 ? "bg-rose-500" : "bg-slate-400"
                                        )}>
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                Trusted by <span className="text-slate-900 font-extrabold tracking-normal">14,200+</span> Professional Players
                            </div>
                        </motion.div>
                    </div>
                </div>



                {/* Feature Grid */}
                <section className="bg-slate-50 py-16 sm:py-24 lg:py-32 rounded-[2.5rem] sm:rounded-[4rem] lg:rounded-[5rem] mx-4 sm:mx-10 mb-16 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-100/30 blur-[100px] rounded-full" />
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="max-w-3xl">
                            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-indigo-600 mb-4 sm:mb-6">Platform Features</h2>
                            <p className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                                Everything you need <br className="hidden sm:block" />
                                to play your best.
                            </p>
                            <p className="mt-6 sm:mt-8 text-lg sm:text-xl font-medium text-slate-500 leading-relaxed">
                                Book courts, find professional coaches, and join regional tournaments with just a few clicks.
                            </p>
                        </div>

                        <div className="mx-auto mt-16 sm:mt-24 lg:mt-32 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                            {features.map((feature) => (
                                <motion.div
                                    key={feature.name}
                                    whileHover={{ y: -12 }}
                                    className="group relative flex flex-col bg-white rounded-3xl sm:rounded-[3rem] lg:rounded-[4rem] p-6 sm:p-10 lg:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-500"
                                >
                                    {/* Decorative background icon - Unhidden and styled */}
                                    <div className="absolute -top-6 -right-6 p-8 text-indigo-50/20 group-hover:text-indigo-500/5 transition-all duration-700">
                                        <feature.icon className="h-48 w-48 transform rotate-12" />
                                    </div>

                                    <div className="relative z-10 flex-1">
                                        <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:scale-110">
                                            <feature.icon className="h-8 w-8" aria-hidden="true" />
                                        </div>
                                        <h3 className="mt-10 text-2xl font-black text-slate-900 tracking-tighter">{feature.name}</h3>
                                        <p className="mt-6 text-base font-medium leading-relaxed text-slate-500">{feature.description}</p>
                                    </div>

                                    <div className="relative z-10 mt-12">
                                        <Link
                                            to={authLink(feature.href)}
                                            className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-6 py-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300"
                                        >
                                            Get Started
                                            <ArrowRightIcon className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integration / Stats */}
                <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-32 text-center">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="flex justify-center flex-wrap gap-8 sm:gap-16 opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
                            <div className="text-lg sm:text-2xl font-black tracking-tighter">SMASH.PLAY</div>
                            <div className="text-lg sm:text-2xl font-black tracking-tighter italic text-indigo-600">APEX.SPORTS</div>
                            <div className="text-lg sm:text-2xl font-black tracking-widest uppercase">PRO.CIRCUIT</div>
                            <div className="text-lg sm:text-2xl font-black tracking-tighter border-b-4 border-slate-900">ELITE.CLUBS</div>
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 lg:text-7xl">Synchronized globally.</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 pt-12">
                            {stats.map((stat) => (
                                <div key={stat.id} className="p-6 sm:p-10 bg-white rounded-2xl sm:rounded-[3rem] group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500">
                                    <div className="text-3xl sm:text-5xl font-black text-slate-900 mb-2 sm:mb-4 transition-transform duration-500 group-hover:translate-y-[-4px] group-hover:text-indigo-600">{stat.value}</div>
                                    <div className="text-[9px] sm:text-[11px] font-black text-slate-400 border-t border-slate-50 pt-4 sm:pt-6 uppercase tracking-[0.3em]">{stat.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="mx-4 sm:mx-10 mb-16">
                    <div className="bg-slate-900 rounded-[3rem] sm:rounded-[5rem] py-20 sm:py-32 px-6 sm:px-10 md:px-24 relative overflow-hidden text-center flex flex-col items-center">
                        {/* Decorative glow effects */}
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.2),transparent)]" />
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />

                        <div className="relative z-10 max-w-3xl space-y-8 sm:space-y-10">
                            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">Ready to take <br />your game to the next level?</h2>
                            <p className="text-indigo-200/50 font-medium text-lg sm:text-xl max-w-2xl mx-auto">Sign up today and join our growing community of professional and non-professional players.</p>
                            <div className="pt-8 sm:pt-10">
                                <Link to="/register">
                                    <Button size="lg" className="h-16 sm:h-20 px-12 sm:px-20 font-black text-lg sm:text-xl bg-indigo-500 hover:bg-indigo-400 text-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.3)] transform hover:scale-[1.05] transition-all">
                                        Join Now
                                    </Button>
                                </Link>
                                <p className="mt-8 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">Fast & Simple Onboarding</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <footer className="py-20 border-t border-slate-100 max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                                    <TrophyIcon className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black tracking-[0.06em] text-slate-900">SportsSphere</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border border-slate-200 rounded-full px-2 py-0.5">
                                        Est. 2025
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Premium Sports Management Platform</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-8">
                            <Link to="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Privacy Policy</Link>
                            <Link to="/terms" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Terms of Service</Link>
                            <Link to="/support" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Support Center</Link>
                        </div>
                    </div>
                    <div className="mt-16 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">SportsSphere 2026</div>
                </footer>
            </div>
        </div>
    );
};

const features = [
    {
        name: 'Tournaments & Events',
        description: 'Join local and national tournaments with live updates, bracket monitoring, and official rankings.',
        icon: TrophyIcon,
        href: '/tournaments',
    },
    {
        name: 'Court Booking',
        description: 'Book quality courts in your area with detailed facility information and easy scheduling.',
        icon: CalendarDaysIcon,
        href: '/courts',
    },
    {
        name: 'Expert Coaching',
        description: 'Connect with top-tier coaches for personalized training and professional skill development.',
        icon: UserGroupIcon,
        href: '/coaches',
    },
];

const stats = [
    { id: 1, name: 'Active Players', value: '12.4k+' },
    { id: 2, name: 'Tournaments', value: '850' },
    { id: 3, name: 'Courts', value: '4k+' },
    { id: 4, name: 'Top Coaches', value: '620' },
];

export default Home;
