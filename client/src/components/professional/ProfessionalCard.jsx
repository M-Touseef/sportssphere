import { twMerge } from 'tailwind-merge';
import { MapPinIcon, ChevronRightIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';

const SPEC_LABELS = {
    singles: 'Singles',
    doubles: 'Doubles',
    mixed_doubles: 'Mixed doubles',
    competitive: 'Competitive',
    recreational: 'Recreational'
};

const formatSpec = (spec) =>
    SPEC_LABELS[spec] || spec?.replace(/_/g, ' ') || spec;

const ProfessionalCard = ({ professional, onSelect }) => {
    const { user, matchFee, specializations, experienceYears, bio } = professional;

    if (!user) return null;

    const specs = Array.isArray(specializations) ? specializations : [];
    const fee =
        matchFee != null && matchFee !== 'Variable'
            ? Number(matchFee).toLocaleString?.() ?? matchFee
            : matchFee;

    return (
        <article className="group relative flex flex-col h-full overflow-hidden rounded-[1.75rem] bg-white border border-amber-100/90 shadow-[0_16px_48px_-20px_rgba(30,27,75,0.12)] hover:shadow-[0_24px_56px_-20px_rgba(30,27,75,0.2)] hover:border-amber-200/90 transition-all duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-violet-500 to-indigo-950" />

            <div className="flex-1 p-6 pl-8">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-950 to-violet-800 text-amber-200 flex items-center justify-center text-2xl font-black shadow-lg border border-indigo-800 overflow-hidden">
                        {user.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            user.name?.[0]?.toUpperCase() || 'P'
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate group-hover:text-indigo-950 transition-colors">
                            {user.name}
                        </h3>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-600 mt-1">
                            <MapPinIcon className="h-4 w-4 text-amber-700 shrink-0" />
                            {user.city || 'Pakistan'}
                        </p>
                        {experienceYears != null && (
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-violet-900 bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200">
                                {experienceYears} yrs experience
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-indigo-950/5 to-amber-50 border border-amber-100/80 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70">Match fee</p>
                        <p className="text-lg font-black text-indigo-950 mt-0.5">
                            {fee === 'Variable' ? 'Variable' : `Rs.${fee}`}
                        </p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 px-3 py-2.5 flex items-center gap-2">
                        <TrophyIcon className="h-5 w-5 text-emerald-700 shrink-0" />
                        <p className="text-xs font-bold text-emerald-800 leading-tight">Pro player</p>
                    </div>
                </div>

                {specs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {specs.slice(0, 4).map((spec) => (
                            <span
                                key={spec}
                                className="text-[10px] font-bold uppercase tracking-wide text-indigo-900 bg-gradient-to-r from-slate-50 to-amber-50/60 border border-amber-100/80 px-2.5 py-1 rounded-lg"
                            >
                                {formatSpec(spec)}
                            </span>
                        ))}
                    </div>
                )}

                {bio && (
                    <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3 mt-4">
                        {bio}
                    </p>
                )}
            </div>

            <div className="px-6 pb-6 pl-8 mt-auto">
                <button
                    type="button"
                    onClick={() => onSelect(professional)}
                    className={twMerge(
                        'w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2',
                        'bg-indigo-950 text-amber-50 hover:bg-indigo-900',
                        'shadow-lg shadow-indigo-900/20 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-0.5 transition-all'
                    )}
                >
                    <SparklesIcon className="h-5 w-5 text-amber-300" />
                    View availability
                    <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </article>
    );
};

export default ProfessionalCard;
