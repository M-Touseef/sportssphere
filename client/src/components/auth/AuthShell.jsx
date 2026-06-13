import { createElement } from 'react';
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    TrophyIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

const highlights = [
    { icon: CalendarDaysIcon, label: 'Book courts in a few taps' },
    { icon: UserGroupIcon, label: 'Find coaches and sparring partners' },
    { icon: TrophyIcon, label: 'Enter and manage tournaments' },
];

const AuthShell = ({
    children,
    eyebrow,
    title,
    accent,
    description,
    cardTitle,
    cardDescription,
    cardBadge,
    footer,
}) => (
    <div className="min-h-[calc(100vh-5.75rem)] bg-[#f4f9fc] text-slate-950 selection:bg-sky-200 selection:text-brand-navy">
        <div className="grid min-h-[calc(100vh-5.75rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(30rem,0.92fr)]">
            <aside className="relative hidden min-h-[calc(100vh-5.75rem)] overflow-hidden bg-brand-navy-deep lg:flex">
                <img
                    src="/images/homepage/hero-badminton.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,20,47,0.98)_0%,rgba(3,20,47,0.88)_52%,rgba(3,20,47,0.52)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,20,47,0.95)_0%,transparent_55%)]" />
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />

                <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                        <span className="h-2 w-2 rounded-full bg-lime-400" />
                        Secure SportsSphere access
                    </div>

                    <div className="max-w-xl py-12">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200 backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(163,230,53,0.8)]" />
                            {eyebrow}
                        </div>

                        <h1 className="max-w-xl text-5xl font-black leading-[1.04] tracking-[-0.045em] text-white xl:text-6xl">
                            {title}
                            <span className="mt-2 block text-brand-sky">{accent}</span>
                        </h1>
                        <p className="mt-6 max-w-lg text-base leading-7 text-white/65 xl:text-lg">
                            {description}
                        </p>

                        <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
                            {highlights.map(({ icon, label }) => (
                                <div
                                    key={label}
                                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md"
                                >
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sky text-brand-navy shadow-lg shadow-sky-950/30">
                                        {createElement(icon, { className: 'h-5 w-5' })}
                                    </div>
                                    <p className="text-sm font-semibold leading-5 text-white/85">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium text-white/45">
                        <CheckCircleIcon className="h-4 w-4 text-lime-400" />
                        Built for Pakistan's badminton community
                    </div>
                </div>
            </aside>

            <main className="relative flex min-h-[calc(100vh-5.75rem)] items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-200/45 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-lime-100/55 blur-3xl" />

                <div className="relative z-10 w-full max-w-xl">
                    <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_30px_80px_-35px_rgba(3,20,47,0.38)] backdrop-blur-xl">
                        <div className="h-1.5 bg-gradient-to-r from-brand-navy via-brand-sky to-brand-lime" />
                        <div className="p-6 sm:p-9">
                            <div className="mb-8">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                                    {cardBadge}
                                </div>
                                <h2 className="text-3xl font-black tracking-[-0.035em] text-brand-navy sm:text-4xl">
                                    {cardTitle}
                                </h2>
                                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                                    {cardDescription}
                                </p>
                            </div>

                            {children}
                        </div>
                    </section>

                    {footer}
                </div>
            </main>
        </div>
    </div>
);

export default AuthShell;
