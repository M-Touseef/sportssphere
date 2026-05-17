import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';

const ProfessionalCard = ({ professional, onSelect }) => {
    const { user, matchFee, specializations, experienceYears, bio } = professional;

    // Safety check just in case user object is missing
    if (!user) return null;

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="p-5 sm:p-6 flex-1">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-indigo-50 rounded-full p-2">
                            <UserCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{user.name}</h3>
                            <div className="flex items-center text-[10px] sm:text-sm text-slate-500 mt-0.5 sm:mt-0">
                                <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                {user.city || 'Unknown City'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Experience</span>
                        <span className="font-semibold text-slate-900">{experienceYears} Years</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Match Fee</span>
                        <span className="font-bold text-emerald-600">PKR {matchFee}</span>
                    </div>

                    <div className="pt-2">
                        <div className="flex flex-wrap gap-2">
                            {specializations && specializations.map(spec => (
                                <span key={spec} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md capitalize">
                                    {spec.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-3 mt-2">
                        {bio || "No bio available."}
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 mt-auto">
                <button
                    onClick={() => onSelect(professional)}
                    className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 group text-xs sm:text-sm"
                >
                    Players Details
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ProfessionalCard;
