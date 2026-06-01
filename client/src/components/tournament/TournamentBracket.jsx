import React from 'react';
import clsx from 'clsx';

// Mock Component for individual match
const MatchCard = ({ match, roundIndex, matchIndex, totalRounds, onMatchClick, isEditable }) => {
    // Determine winner
    const p1 = match.player1;
    const p2 = match.player2;
    const p1Won = p1.score > p2.score;
    const p2Won = p2.score > p1.score;

    // Check if match is actionable
    const isActionable = isEditable && match.status !== 'completed' && match.status !== 'walkover';

    return (
        <div
            className={clsx(
                "relative flex flex-col justify-center my-6 w-72 transition-all duration-300",
                isActionable ? "cursor-pointer transform hover:scale-105" : ""
            )}
            onClick={() => isActionable && onMatchClick && onMatchClick(match.rawMatch)}
        >
            <div className={clsx(
                "rounded-xl overflow-hidden border transition-all duration-200 shadow-sm",
                isActionable ? "ring-2 ring-amber-300/80 border-amber-200" : "border-slate-200"
            )}>
                <div className="bg-slate-50 px-4 py-1.5 flex justify-between items-center border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match #{match.rawMatch?.matchNumber ?? match.matchNumber ?? matchIndex + 1}</span>
                    {isActionable && (
                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                            Score
                        </span>
                    )}
                </div>

                <div className="bg-white">
                    {/* Player 1 */}
                    <div className={clsx(
                        "flex justify-between items-center px-4 py-3 border-b border-slate-50 transition-colors",
                        p1Won ? "bg-indigo-50/50" : ""
                    )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={clsx(
                                "w-1 h-8 rounded-full shrink-0",
                                p1Won ? "bg-indigo-500" : "bg-slate-200"
                            )}></div>
                            <span className={clsx(
                                "truncate font-bold text-sm",
                                !p1.name ? "text-slate-300 italic font-normal" : p1Won ? "text-indigo-900" : "text-slate-600"
                            )}>
                                {p1.name || "TBD"}
                            </span>
                        </div>
                        <span className={clsx(
                            "font-mono font-bold text-lg",
                            p1Won ? "text-indigo-600" : "text-slate-300"
                        )}>{p1.score !== undefined ? p1.score : '-'}</span>
                    </div>

                    {/* Player 2 */}
                    <div className={clsx(
                        "flex justify-between items-center px-4 py-3 transition-colors",
                        p2Won ? "bg-indigo-50/50" : ""
                    )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={clsx(
                                "w-1 h-8 rounded-full shrink-0",
                                p2Won ? "bg-indigo-500" : "bg-slate-200"
                            )}></div>
                            <span className={clsx(
                                "truncate font-bold text-sm",
                                !p2.name ? "text-slate-300 italic font-normal" : p2Won ? "text-indigo-900" : "text-slate-600"
                            )}>
                                {p2.name || "TBD"}
                            </span>
                        </div>
                        <span className={clsx(
                            "font-mono font-bold text-lg",
                            p2Won ? "text-indigo-600" : "text-slate-300"
                        )}>{p2.score !== undefined ? p2.score : '-'}</span>
                    </div>
                </div>
            </div>

            {/* Connectors */}
            {roundIndex < totalRounds - 1 && (
                <div className="absolute top-1/2 -right-8 w-8 h-px bg-slate-300"></div>
            )}
        </div>
    );
};

export default function TournamentBracket({ rounds, onMatchClick, isEditable }) {
    if (!rounds || rounds.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-sm font-medium text-slate-500">No bracket data.</p>
        </div>
    );

    return (
        <div className="overflow-x-auto py-12 px-4 hide-scrollbar">
            <div className="flex space-x-16 min-w-max">
                {rounds.map((round, rIndex) => (
                    <div key={rIndex} className="flex flex-col relative">
                        {/* Round Title */}
                        <div className="mb-6 text-center py-2 px-3 rounded-lg bg-indigo-950/5 border border-amber-100">
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-indigo-950">
                                {round.title}
                            </h3>
                        </div>

                        {/* Matches */}
                        <div className="flex flex-col justify-around flex-grow gap-y-8 px-2">
                            {round.matches.map((match, mIndex) => (
                                <div key={match.id} className="relative flex items-center">
                                    <MatchCard
                                        match={match}
                                        roundIndex={rIndex}
                                        matchIndex={mIndex}
                                        totalRounds={rounds.length}
                                        onMatchClick={onMatchClick}
                                        isEditable={isEditable}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
