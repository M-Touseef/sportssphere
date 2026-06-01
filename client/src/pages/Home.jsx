import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
    motion,
    useScroll,
    useTransform,
    useInView,
    useSpring,
    AnimatePresence,
} from 'framer-motion';
import {
    TrophyIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowRightIcon,
    ArrowDownIcon,
    MapPinIcon,
    SparklesIcon,
    ChevronDownIcon,
    UserIcon,
    ClockIcon,
    StarIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

/* ============================================================ */
/* UTILITY HOOKS                                                 */
/* ============================================================ */

/** Animated counter that ticks up when in view */
const useAnimatedCounter = (end, duration = 2000, inView = false) => {
    const [count, setCount] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (!inView || started.current) return;
        started.current = true;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [inView, end, duration]);

    return count;
};

/** Staggered word reveal component */
const RevealText = ({ text, className = '', delay = 0, as: Tag = 'span' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-10%' });

    const words = text.split(' ');
    return (
        <Tag ref={ref} className={className}>
            {words.map((word, i) => (
                <span
                    key={i}
                    className="st-word"
                    style={{
                        animationDelay: isInView ? `${delay + i * 0.08}s` : '0s',
                        animationPlayState: isInView ? 'running' : 'paused',
                    }}
                >
                    {word}{' '}
                </span>
            ))}
        </Tag>
    );
};

/** Fade + slide up on scroll */
const FadeUp = ({ children, delay = 0, className = '', y = 60 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-8%' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/** Scale-in on scroll */
const ScaleIn = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-8%' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
            transition={{
                duration: 0.7,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/* ============================================================ */
/* FLOATING PARTICLES FOR HERO                                   */
/* ============================================================ */

const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 12,
    duration: 10 + Math.random() * 8,
    opacity: 0.15 + Math.random() * 0.25,
}));

/* ============================================================ */
/* CHAPTER 1 — CINEMATIC HERO                                    */
/* ============================================================ */

const HeroChapter = ({ user }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.92]);

    return (
        <section ref={ref} className="st-chapter" style={{ minHeight: '100vh' }}>
            {/* Animated gradient background */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{ y: bgY }}
            >
                <div className="absolute inset-0 ambient-gradient" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
            </motion.div>

            {/* Floating particles */}
            <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="st-particle rounded-full"
                        style={{
                            left: p.left,
                            top: p.top,
                            width: p.size,
                            height: p.size,
                            background: `radial-gradient(circle, rgba(251,191,36,${p.opacity}) 0%, transparent 70%)`,
                            animationDelay: `${-p.delay}s`,
                            animationDuration: `${p.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* Ambient light blobs */}
            <div className="absolute inset-0 z-[1] pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[100px] liquid-blob" />
                <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[80px] liquid-blob" style={{ animationDelay: '-7s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/8 blur-[120px] pulse-glow" />
            </div>

            {/* Hero Content */}
            <motion.div
                className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center"
                style={{ y: textY, opacity, scale }}
            >
                {/* Badge */}
                <FadeUp delay={0.2}>
                    <div className="inline-flex items-center gap-2.5 rounded-full bg-amber-400/12 border border-amber-300/20 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200 mb-8 backdrop-blur-sm">
                        <SparklesIcon className="h-4 w-4 text-amber-300" />
                        Pakistan's Premier Badminton Platform
                    </div>
                </FadeUp>

                {/* Main headline */}
                <FadeUp delay={0.4}>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.05] drop-shadow-2xl">
                        Elevate Your
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 drop-shadow-lg">
                            Badminton Game
                        </span>
                    </h1>
                </FadeUp>

                {/* Subtitle */}
                <FadeUp delay={0.6}>
                    <p className="mt-8 text-lg sm:text-xl text-indigo-100/90 font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-md">
                        The all-in-one platform for Pakistan's badminton community. 
                        <br className="hidden sm:block" />
                        Book courts, join competitive tournaments, and train with elite coaches.
                    </p>
                </FadeUp>

                {/* CTA Buttons */}
                <FadeUp delay={0.8}>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {user ? (
                            <Link to="/app">
                                <Button className="h-14 px-10 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-xl shadow-amber-400/25 transition-all hover:scale-105 hover:shadow-amber-400/40">
                                    Go to Dashboard
                                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register">
                                    <Button className="h-14 px-10 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-xl shadow-amber-400/25 transition-all hover:scale-105 hover:shadow-amber-400/40">
                                        Get Started Free
                                        <ArrowRightIcon className="h-5 w-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button
                                        variant="outline"
                                        className="h-14 px-10 rounded-2xl font-bold text-base border-white/20 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all hover:scale-105"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </FadeUp>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Scroll</span>
                <ChevronDownIcon className="h-5 w-5 text-white/40" />
            </motion.div>
        </section>
    );
};

/* ============================================================ */
/* CHAPTER 2 — THE STORY (Emotional Narrative)                   */
/* ============================================================ */

const StoryChapter = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });
    const lineWidth = useTransform(scrollYProgress, [0.2, 0.5], ['0%', '100%']);

    return (
        <section ref={ref} className="st-chapter bg-[#0a0a1a] relative">
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center py-20">
                {/* Small label */}
                <FadeUp>
                    <p className="text-amber-400/80 text-xs font-bold uppercase tracking-[0.3em] mb-8">
                        The Vision
                    </p>
                </FadeUp>

                {/* Large narrative text */}
                <RevealText
                    text="Every player deserves a court to play on, a tournament to compete in, and a coach to learn from."
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.2] tracking-tight"
                    as="h2"
                />

                {/* Animated divider */}
                <div className="mt-12 mb-12 flex justify-center">
                    <motion.div
                        className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                        style={{ width: lineWidth }}
                    />
                </div>

                <FadeUp delay={0.3}>
                    <p className="text-base sm:text-lg text-indigo-200/60 font-medium leading-relaxed max-w-2xl mx-auto">
                        We built SportsSphere to unite Pakistan's badminton community —
                        from casual rallies to professional championships, from first-time players
                        to national coaches. One platform, everything connected.
                    </p>
                </FadeUp>
            </div>
        </section>
    );
};

/* ============================================================ */
/* CHAPTER 3 — HOW IT WORKS (3-Step Journey)                     */
/* ============================================================ */

const steps = [
    {
        number: '01',
        title: 'Create Your Profile',
        description: 'Sign up in seconds. Choose your role — player, coach, or organizer — and tell us about your game.',
        icon: UserIcon,
        color: 'from-blue-500 to-indigo-600',
        glowColor: 'bg-blue-500/8',
    },
    {
        number: '02',
        title: 'Explore & Connect',
        description: 'Discover courts near you, browse upcoming tournaments, or find the perfect coach for your skill level.',
        icon: SparklesIcon,
        color: 'from-purple-500 to-violet-600',
        glowColor: 'bg-purple-500/8',
    },
    {
        number: '03',
        title: 'Play & Grow',
        description: 'Book sessions, compete in brackets, track your progress — all from one platform built for badminton.',
        icon: BoltIcon,
        color: 'from-amber-500 to-orange-600',
        glowColor: 'bg-amber-500/8',
    },
];

const HowItWorksChapter = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });
    const progressWidth = useTransform(scrollYProgress, [0.15, 0.65], ['0%', '100%']);

    return (
        <section ref={ref} className="st-chapter bg-gradient-to-b from-[#0a0a1a] via-[#0d1117] to-[#0a0a1a] relative">
            {/* Decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/4 blur-[180px] rounded-full" />

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
                {/* Section header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <FadeUp>
                        <p className="text-indigo-400/80 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                            How It Works
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                            Three Steps to
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-blue-400"> the Court</span>
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2}>
                        <p className="mt-4 text-base text-indigo-200/50 leading-relaxed">
                            Getting started takes less than a minute.
                        </p>
                    </FadeUp>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Animated progress line (desktop only) */}
                    <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-[2px] bg-white/[0.04]">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 rounded-full"
                            style={{ width: progressWidth }}
                        />
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 md:gap-8">
                        {steps.map((step, i) => (
                            <FadeUp key={step.number} delay={0.15 * i}>
                                <div className="relative flex flex-col items-center text-center group">
                                    {/* Step number circle */}
                                    <div className={`relative h-32 w-32 rounded-3xl bg-gradient-to-br ${step.color} p-[1px] mb-8`}>
                                        <div className="h-full w-full rounded-3xl bg-[#0d1117] flex flex-col items-center justify-center gap-1">
                                            <step.icon className="h-8 w-8 text-white/80" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mt-1">{step.number}</span>
                                        </div>
                                        {/* Glow */}
                                        <div className={`absolute -inset-4 ${step.glowColor} rounded-3xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-sm text-indigo-200/50 leading-relaxed max-w-xs">
                                        {step.description}
                                    </p>
                                </div>
                            </FadeUp>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ============================================================ */
/* CHAPTER 4 — FEATURE SHOWCASE (Abstract, No Data)              */
/* ============================================================ */

const features = [
    {
        label: 'Courts',
        tagline: 'Find & Book Instantly',
        description: 'Browse venues by location, surface type, and availability. Reserve your slot online — no phone calls, no waiting.',
        icon: MapPinIcon,
        gradient: 'from-blue-500 to-cyan-500',
        bgGlow: 'bg-blue-500/6',
        bullets: ['Search by city or area', 'See real-time availability', 'Instant online booking'],
    },
    {
        label: 'Tournaments',
        tagline: 'Compete & Rise',
        description: 'From local club events to city championships. Register, follow live brackets, and track your competitive journey.',
        icon: TrophyIcon,
        gradient: 'from-purple-500 to-violet-500',
        bgGlow: 'bg-purple-500/6',
        bullets: ['Multiple categories & formats', 'Live bracket updates', 'Automatic seeding'],
    },
    {
        label: 'Coaching',
        tagline: 'Learn & Level Up',
        description: 'Connect with certified coaches who match your skill level. Book sessions at your preferred court and schedule.',
        icon: UserGroupIcon,
        gradient: 'from-emerald-500 to-teal-500',
        bgGlow: 'bg-emerald-500/6',
        bullets: ['Verified coach profiles', 'Flexible scheduling', 'Progress tracking'],
    },
];

const FeatureShowcaseChapter = () => {
    return (
        <section className="st-chapter bg-[#0a0a1a] relative" style={{ minHeight: 'auto', padding: '5rem 0' }}>
            {/* Decorative */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[200px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8">
                {/* Section header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <FadeUp>
                        <p className="text-amber-400/80 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                            Everything You Need
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                            One Platform,
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400"> Infinite Possibilities</span>
                        </h2>
                    </FadeUp>
                </div>

                {/* Clean Feature Grid */}
                <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                    {features.map((feature, i) => (
                        <FadeUp key={feature.label} delay={0.1 * i}>
                            <div className="h-full group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500 overflow-hidden backdrop-blur-sm flex flex-col p-8 sm:p-10">
                                {/* Top accent line */}
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                                
                                {/* Icon */}
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                
                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {feature.tagline}
                                </h3>
                                
                                <p className="text-sm text-indigo-200/50 leading-relaxed mb-8 flex-grow">
                                    {feature.description}
                                </p>
                                
                                {/* Bullet points */}
                                <div className="space-y-3 mt-auto pt-6 border-t border-white/[0.06]">
                                    {feature.bullets.map((bullet, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${feature.gradient} flex-shrink-0`} />
                                            <span className="text-xs text-indigo-200/70 font-medium">{bullet}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ============================================================ */
/* CHAPTER 5 — BUILT FOR EVERYONE (Roles)                        */
/* ============================================================ */

const roles = [
    {
        role: 'Players',
        description: 'Book courts, join tournaments, find sparring partners, and track your progress — whether you play for fun or compete professionally.',
        icon: BoltIcon,
        gradient: 'from-blue-500/15 to-indigo-500/15',
        borderColor: 'border-blue-500/10 hover:border-blue-500/25',
        iconColor: 'text-blue-400',
    },
    {
        role: 'Coaches',
        description: 'Manage your availability, accept booking requests, and grow your coaching practice with a dedicated dashboard.',
        icon: UserGroupIcon,
        gradient: 'from-emerald-500/15 to-teal-500/15',
        borderColor: 'border-emerald-500/10 hover:border-emerald-500/25',
        iconColor: 'text-emerald-400',
    },
    {
        role: 'Organizers',
        description: 'List your courts, host tournaments, and manage everything from registrations to brackets in one place.',
        icon: CalendarDaysIcon,
        gradient: 'from-purple-500/15 to-violet-500/15',
        borderColor: 'border-purple-500/10 hover:border-purple-500/25',
        iconColor: 'text-purple-400',
    },
];

const BuiltForEveryoneChapter = () => {
    return (
        <section className="st-chapter bg-gradient-to-b from-[#0a0a1a] via-[#0d1117] to-[#0a0a1a] relative">
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/4 blur-[180px] rounded-full" />

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
                {/* Section header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <FadeUp>
                        <p className="text-indigo-400/80 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                            For Every Role
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                            Built For
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400"> Everyone</span>
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2}>
                        <p className="mt-4 text-base text-indigo-200/50 leading-relaxed">
                            Whether you swing a racket, train champions, or run the court — there's a dedicated experience for you.
                        </p>
                    </FadeUp>
                </div>

                {/* Role cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {roles.map((item, i) => (
                        <ScaleIn key={item.role} delay={0.12 * i}>
                            <div className={`group relative h-full rounded-2xl border ${item.borderColor} bg-gradient-to-b ${item.gradient} backdrop-blur-sm transition-all duration-500 overflow-hidden`}>
                                <div className="p-7 sm:p-8 flex flex-col items-start h-full">
                                    {/* Icon */}
                                    <div className="h-14 w-14 rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-3">{item.role}</h3>
                                    <p className="text-sm text-indigo-200/50 leading-relaxed flex-1">
                                        {item.description}
                                    </p>

                                    <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-white/30 group-hover:text-white/60 transition-colors">
                                        <span>Learn more</span>
                                        <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </ScaleIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ============================================================ */
/* CHAPTER 6 — WHY SPORTSSPHERE (Differentiators)                */
/* ============================================================ */

const differentiators = [
    {
        title: 'All-in-One Platform',
        description: 'Courts, tournaments, coaching, and community — no need to juggle multiple apps or spreadsheets.',
        icon: SparklesIcon,
    },
    {
        title: 'Real-Time Updates',
        description: 'Live bracket updates, instant booking confirmations, and real-time notifications keep you in the loop.',
        icon: BoltIcon,
    },
    {
        title: 'Built for Pakistan',
        description: 'Designed specifically for the Pakistani badminton ecosystem — local payment methods, local venues, local community.',
        icon: MapPinIcon,
    },
    {
        title: 'Every Skill Level',
        description: 'From casual weekend players to national-level professionals — the platform adapts to your journey.',
        icon: TrophyIcon,
    },
];

const WhySportsphereChapter = () => {
    return (
        <section className="st-chapter bg-[#0a0a1a] relative">
            {/* Center glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[400px] bg-amber-500/4 blur-[200px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
                {/* Section header */}
                <div className="text-center mb-16">
                    <FadeUp>
                        <p className="text-amber-400/80 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                            Why Us
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                            Why
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400"> SportsSphere</span>
                        </h2>
                    </FadeUp>
                </div>

                {/* Differentiators grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                    {differentiators.map((item, i) => (
                        <FadeUp key={item.title} delay={0.1 * i}>
                            <div className="group flex gap-5 p-6 sm:p-7 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500">
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/15 to-amber-500/15 border border-amber-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <item.icon className="h-6 w-6 text-amber-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-indigo-200/50 leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ============================================================ */
/* CHAPTER 7 — CTA (Your Journey Starts)                         */
/* ============================================================ */

const CTAChapter = ({ user }) => {
    const ref = useRef(null);

    return (
        <section ref={ref} className="st-chapter relative overflow-hidden">
            {/* Morphing gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 st-gradient-morph" />

            {/* Decorative orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-amber-400/10 blur-[100px] pulse-glow" />
                <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pulse-glow" style={{ animationDelay: '-2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.03]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.02]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 text-center py-20">
                <ScaleIn>
                    <div className="inline-flex mb-8">
                        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center st-glow-ring shadow-2xl">
                            <TrophyIcon className="h-10 w-10 text-indigo-950" />
                        </div>
                    </div>
                </ScaleIn>

                <FadeUp delay={0.15}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                        Ready to Step
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
                            on the Court?
                        </span>
                    </h2>
                </FadeUp>

                <FadeUp delay={0.3}>
                    <p className="mt-6 text-lg text-indigo-100/70 font-medium leading-relaxed max-w-xl mx-auto">
                        Join thousands of players already using SportsSphere.
                        Sign up free, pick your role, and start playing today.
                    </p>
                </FadeUp>

                <FadeUp delay={0.45}>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {user ? (
                            <Link to="/app">
                                <Button className="h-14 px-12 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-xl shadow-amber-400/30 transition-all hover:scale-105 hover:shadow-amber-400/50">
                                    Go to Dashboard
                                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register">
                                    <Button className="h-14 px-12 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-xl shadow-amber-400/30 transition-all hover:scale-105 hover:shadow-amber-400/50">
                                        Join SportsSphere
                                        <ArrowRightIcon className="h-5 w-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button
                                        variant="outline"
                                        className="h-14 px-10 rounded-2xl font-bold text-base border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all hover:scale-105"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </FadeUp>
            </div>
        </section>
    );
};

/* ============================================================ */
/* FOOTER                                                        */
/* ============================================================ */

const Footer = () => {
    return (
        <footer className="bg-[#060610] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="h-8 w-8 bg-indigo-950 rounded-lg flex items-center justify-center text-amber-200 border border-indigo-800/50">
                                <TrophyIcon className="h-5 w-5" />
                            </div>
                            <span className="text-base font-black text-white tracking-tight">SportsSphere</span>
                        </div>
                        <p className="text-xs text-indigo-200/30 leading-relaxed">
                            Pakistan's premier badminton platform. Courts, tournaments, and coaching — all in one place.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200/40 mb-4">Platform</h4>
                        <div className="space-y-2.5">
                            <Link to="/courts" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Courts</Link>
                            <Link to="/tournaments" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Tournaments</Link>
                            <Link to="/coaches" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Coaches</Link>
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200/40 mb-4">Legal</h4>
                        <div className="space-y-2.5">
                            <Link to="/terms" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Terms of Service</Link>
                            <Link to="/support" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Support Center</Link>
                        </div>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200/40 mb-4">Account</h4>
                        <div className="space-y-2.5">
                            <Link to="/login" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Sign In</Link>
                            <Link to="/register" className="block text-sm text-indigo-200/50 hover:text-white transition-colors">Create Account</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-indigo-200/20">
                        © {new Date().getFullYear()} SportsSphere. All rights reserved.
                    </p>
                    <p className="text-xs text-indigo-200/20">
                        Made with ❤️ for Pakistan's badminton community
                    </p>
                </div>
            </div>
        </footer>
    );
};

/* ============================================================ */
/* MAIN HOME COMPONENT                                           */
/* ============================================================ */

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="scrollytelling-root bg-[#0a0a1a]">
            <HeroChapter user={user} />
            <StoryChapter />
            <HowItWorksChapter />
            <FeatureShowcaseChapter />
            <BuiltForEveryoneChapter />
            <WhySportsphereChapter />
            <CTAChapter user={user} />
            <Footer />
        </div>
    );
};

export default Home;
