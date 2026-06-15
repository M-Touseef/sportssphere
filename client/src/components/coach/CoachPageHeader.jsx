import { createElement } from 'react';

const CoachPageHeader = ({
    eyebrow,
    title,
    description,
    icon,
    actions,
    children
}) => (
    <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_12%_100%,rgba(163,230,53,0.12),transparent_30%)]" />
        <div className="absolute -right-10 top-6 h-36 w-36 rounded-full border border-white/10" />
        <div className="absolute right-16 top-20 h-24 w-24 rounded-full border border-white/5" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                {icon && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-sky-200 backdrop-blur-sm sm:h-14 sm:w-14">
                        {createElement(icon, { className: 'h-6 w-6' })}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">{eyebrow}</p>
                    <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl lg:text-4xl">{title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
                    {children && <div className="mt-4">{children}</div>}
                </div>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </div>
    </header>
);

export default CoachPageHeader;
