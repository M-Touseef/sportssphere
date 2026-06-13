import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const BrandLogo = ({
    to = '/',
    compact = false,
    className,
    imageClassName,
    textClassName,
    showTagline = true,
    onClick,
}) => (
    <Link
        to={to}
        onClick={onClick}
        className={twMerge('group inline-flex min-w-0 items-center gap-3', className)}
        aria-label="SportsSphere home"
    >
        <img
            src="/images/homepage/website-logo-header.png"
            alt=""
            className={twMerge(
                'shrink-0 rounded-xl border border-slate-200 bg-white object-cover shadow-sm transition group-hover:border-sky-200',
                compact ? 'h-10 w-10' : 'h-11 w-11',
                imageClassName,
            )}
        />
        <div className="min-w-0">
            <div className={twMerge(
                'truncate text-lg font-black leading-none tracking-[-0.04em] text-brand-navy',
                textClassName,
            )}>
                Sports<span className="text-lime-600">Sphere</span>
            </div>
            {showTagline && (
                <div className="mt-1.5 hidden text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">
                    Play / Train / Compete
                </div>
            )}
        </div>
    </Link>
);

export default BrandLogo;
