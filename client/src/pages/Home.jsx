import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    TrophyIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowRightIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const features = [
    {
        name: 'Tournaments',
        description: 'Browse events, register for your category, and follow brackets.',
        icon: TrophyIcon,
        href: '/tournaments'
    },
    {
        name: 'Courts',
        description: 'Find venues near you and book a time slot online.',
        icon: CalendarDaysIcon,
        href: '/courts'
    },
    {
        name: 'Coaches',
        description: 'Book sessions with certified coaches at your preferred hall.',
        icon: UserGroupIcon,
        href: '/coaches'
    }
];

const Home = () => {
    const { user } = useAuth();

    const explore = (path) => (user ? path : { pathname: '/login', state: { from: { pathname: path } } });

    return (
        <div className="bg-slate-50/30 text-slate-900 overflow-x-hidden">
            <div className="pt-8 sm:pt-12 pb-20">
                {/* Hero */}
                <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                    <div className="rounded-[2rem] sm:rounded-[2.75rem] overflow-hidden border border-amber-200/60 shadow-[0_20px_60px_-24px_rgba(30,27,75,0.35)]">
                        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 px-6 sm:px-12 py-14 sm:py-20 text-center relative">
                            <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
                            <div className="relative max-w-3xl mx-auto">
                                <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-300/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-100 mb-6">
                                    <BuildingOffice2Icon className="h-4 w-4 text-amber-300" />
                                    Badminton in Pakistan
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                                    Courts, tournaments & coaching
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mt-1">
                                        in one place
                                    </span>
                                </h1>
                                <p className="mt-5 text-base sm:text-lg text-indigo-100/85 font-medium leading-relaxed">
                                    Book courts, join tournaments, and connect with coaches — built for players and
                                    organizers.
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    {user ? (
                                        <Link to="/app">
                                            <Button className="h-12 px-8 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950">
                                                Go to dashboard
                                            </Button>
                                        </Link>
                                    ) : (
                                        <>
                                            <Link to="/register">
                                                <Button className="h-12 px-8 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950">
                                                    Create account
                                                </Button>
                                            </Link>
                                            <Link to="/login">
                                                <Button
                                                    variant="outline"
                                                    className="h-12 px-8 rounded-xl font-bold border-amber-300/40 text-amber-100 hover:bg-white/10"
                                                >
                                                    Log in
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10 mt-12 sm:mt-16">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">What you can do</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="flex flex-col rounded-2xl border border-amber-100/90 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
                            >
                                <div className="h-11 w-11 rounded-xl bg-indigo-950 flex items-center justify-center text-amber-200 mb-4">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{feature.name}</h3>
                                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                                    {feature.description}
                                </p>
                                <Link
                                    to={explore(feature.href)}
                                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-900 hover:text-indigo-950"
                                >
                                    Explore
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                {!user && (
                    <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10 mt-12 sm:mt-16">
                        <div className="rounded-2xl border border-slate-200 bg-white px-6 sm:px-10 py-10 sm:py-12 text-center">
                            <h2 className="text-2xl font-black text-slate-900">Ready to get started?</h2>
                            <p className="mt-2 text-slate-600 font-medium max-w-md mx-auto">
                                Sign up free, pick your role, and start booking or competing.
                            </p>
                            <Link to="/register" className="inline-block mt-6">
                                <Button className="h-12 px-10 rounded-xl font-bold bg-indigo-950 text-amber-50 hover:bg-indigo-900">
                                    Join SportSphere
                                </Button>
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Home;
