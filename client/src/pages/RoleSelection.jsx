import { createElement, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BoltIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ClockIcon,
    ShieldCheckIcon,
    TrophyIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { motion as Motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const roleOptions = [
    {
        id: 'non-professional',
        role: 'player',
        skillLevel: 'non-professional',
        label: 'Recreational Player',
        shortLabel: 'Player',
        description: 'Book courts, find coaches, join tournaments, and meet sparring partners.',
        icon: UserGroupIcon,
        instant: true,
    },
    {
        id: 'professional',
        role: 'player',
        skillLevel: 'professional',
        label: 'Professional Player',
        shortLabel: 'Professional',
        description: 'Build a verified competitive profile and receive sparring requests.',
        icon: TrophyIcon,
        instant: false,
    },
    {
        id: 'coach',
        role: 'coach',
        skillLevel: null,
        label: 'Coach',
        shortLabel: 'Coach',
        description: 'Publish availability, manage session requests, and coach players.',
        icon: AcademicCapIcon,
        instant: false,
    },
    {
        id: 'organizer',
        role: 'organizer',
        skillLevel: null,
        label: 'Court Owner / Organizer',
        shortLabel: 'Organizer',
        description: 'Manage venues, court availability, tournaments, and registrations.',
        icon: BuildingOffice2Icon,
        instant: false,
    },
];

const RoleSelection = () => {
    const { selectRole } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const selectedOption = roleOptions.find((option) => option.id === selectedId);

    const handleSubmit = async () => {
        if (!selectedOption) {
            toastError('Please select a role to continue');
            return;
        }

        setLoading(true);
        try {
            const roleData = { role: selectedOption.role };
            if (selectedOption.skillLevel) {
                roleData.skillLevel = selectedOption.skillLevel;
            }

            await selectRole(roleData);

            if (selectedOption.instant) {
                success("Welcome to SportsSphere! You're all set.");
                navigate('/app');
            } else {
                success('Role selected! Please complete your profile.');
                navigate('/profile-setup');
            }
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to select role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-5.75rem)] overflow-hidden bg-[#f4f9fc] px-4 py-8 text-slate-950 selection:bg-sky-200 selection:text-brand-navy sm:px-6 lg:px-8 lg:py-12">
            <div className="pointer-events-none absolute -right-32 -top-28 h-96 w-96 rounded-full bg-sky-200/55 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-lime-100/70 blur-3xl" />

            <main className="relative z-10 mx-auto w-full max-w-6xl">
                <div className="mb-6 flex justify-end">
                    <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-bold text-sky-700 shadow-sm backdrop-blur">
                        <ShieldCheckIcon className="h-4 w-4" />
                        Account created
                    </div>
                </div>

                <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_30px_90px_-40px_rgba(3,20,47,0.42)] backdrop-blur-xl">
                    <div className="h-1.5 bg-gradient-to-r from-brand-navy via-brand-sky to-brand-lime" />

                    <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                        <div className="relative overflow-hidden bg-brand-navy-deep p-7 text-white sm:p-10 lg:min-h-[42rem]">
                            <img
                                src="/images/homepage/coaching-web.jpg"
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover opacity-20"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-deep/80 via-brand-navy-deep/90 to-brand-navy-deep" />

                            <div className="relative z-10 flex h-full flex-col">
                                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">
                                    <span className="h-2 w-2 rounded-full bg-lime-400" />
                                    Personalize your workspace
                                </div>

                                <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                                    How will you use
                                    <span className="mt-2 block text-brand-sky">SportsSphere?</span>
                                </h1>
                                <p className="mt-5 max-w-md text-sm font-medium leading-6 text-white/60 sm:text-base">
                                    Your choice controls the dashboard, tools, and verification steps shown next.
                                </p>

                                <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:mt-auto lg:grid-cols-1">
                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                                        <BoltIcon className="mt-0.5 h-5 w-5 flex-none text-lime-400" />
                                        <div>
                                            <p className="text-sm font-bold">Instant player access</p>
                                            <p className="mt-1 text-xs leading-5 text-white/45">Recreational players can begin immediately.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                                        <ShieldCheckIcon className="mt-0.5 h-5 w-5 flex-none text-sky-400" />
                                        <div>
                                            <p className="text-sm font-bold">Trusted profiles</p>
                                            <p className="mt-1 text-xs leading-5 text-white/45">Professional roles include verification.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                                        <ClockIcon className="mt-0.5 h-5 w-5 flex-none text-sky-400" />
                                        <div>
                                            <p className="text-sm font-bold">Quick setup</p>
                                            <p className="mt-1 text-xs leading-5 text-white/45">Complete your role details in a few steps.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-9 lg:p-10">
                            <div className="mb-7">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                                    Step 1 of 2
                                </div>
                                <h2 className="text-3xl font-black tracking-[-0.035em] text-brand-navy">
                                    Choose your role
                                </h2>
                                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                                    Select the option that best describes how you plan to use the platform.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {roleOptions.map((option, index) => {
                                    const isSelected = option.id === selectedId;

                                    return (
                                        <Motion.button
                                            key={option.id}
                                            type="button"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.06 }}
                                            onClick={() => setSelectedId(option.id)}
                                            aria-pressed={isSelected}
                                            className={twMerge(
                                                'relative min-h-48 rounded-2xl border-2 p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2',
                                                isSelected
                                                    ? 'border-brand-sky bg-sky-50 shadow-lg shadow-sky-100/80'
                                                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-slate-200/50',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className={twMerge(
                                                    'flex h-12 w-12 items-center justify-center rounded-xl border transition',
                                                    isSelected
                                                        ? 'border-brand-sky bg-brand-sky text-brand-navy'
                                                        : 'border-slate-200 bg-slate-50 text-brand-navy',
                                                )}>
                                                    {createElement(option.icon, { className: 'h-6 w-6' })}
                                                </div>
                                                {isSelected && <CheckCircleIcon className="h-6 w-6 text-sky-600" />}
                                            </div>

                                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                                <h3 className="font-black text-brand-navy">{option.label}</h3>
                                                <span className={twMerge(
                                                    'rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider',
                                                    option.instant
                                                        ? 'bg-lime-100 text-lime-800'
                                                        : 'bg-slate-100 text-slate-500',
                                                )}>
                                                    {option.instant ? 'Instant' : 'Verification'}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                                                {option.description}
                                            </p>
                                        </Motion.button>
                                    );
                                })}
                            </div>

                            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white text-brand-navy shadow-sm ring-1 ring-slate-200">
                                        {selectedOption
                                            ? createElement(selectedOption.icon, { className: 'h-5 w-5' })
                                            : <UserGroupIcon className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-brand-navy">
                                            {selectedOption ? selectedOption.shortLabel : 'Select a role to continue'}
                                        </p>
                                        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                                            {!selectedOption
                                                ? 'Your next step will appear here.'
                                                : selectedOption.instant
                                                    ? 'You will go directly to your player dashboard.'
                                                    : 'You will continue to profile setup and verification.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                fullWidth
                                size="lg"
                                isLoading={loading}
                                disabled={!selectedOption}
                                className="mt-5 h-13 rounded-2xl bg-brand-lime text-base font-black text-brand-navy shadow-xl shadow-lime-200/70 hover:bg-lime-300 focus-visible:ring-brand-lime disabled:cursor-not-allowed"
                            >
                                {!selectedOption
                                    ? 'Select a Role to Continue'
                                    : selectedOption.instant
                                        ? 'Open Player Dashboard'
                                        : 'Continue to Profile Setup'}
                                <ArrowRightIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RoleSelection;
