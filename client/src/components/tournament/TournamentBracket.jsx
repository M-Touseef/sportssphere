import React from 'react';
import clsx from 'clsx';
import { getBadmintonGameWinner } from '../../utils/badmintonScoring';

// Mock Component for individual match
const MatchCard = ({ match, roundIndex, matchIndex, totalRounds, onMatchClick, isEditable }) => {
    const p1 = match.player1;
    const p2 = match.player2;
    const p1Won = p1.isWinner === true;
    const p2Won = p2.isWinner === true;

    // Check if match is actionable
    const isActionable = isEditable && match.status !== 'completed' && match.status !== 'walkover';

    return (
        <div
            className={clsx(
                "relative flex w-[min(17rem,calc(100vw-4.5rem))] flex-col justify-center my-3 sm:my-6 sm:w-72 transition-all duration-300",
                isActionable ? "cursor-pointer sm:hover:scale-[1.03]" : ""
            )}
            onClick={() => isActionable && onMatchClick && onMatchClick(match.rawMatch)}
        >
            <div className={clsx(
                "rounded-xl overflow-hidden border transition-all duration-200 shadow-sm",
                isActionable ? "ring-2 ring-lime-300/80 border-lime-300" : "border-slate-200"
            )}>
                <div className="bg-slate-50 px-4 py-1.5 flex justify-between items-center border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match #{match.rawMatch?.matchNumber ?? match.matchNumber ?? matchIndex + 1}</span>
                    {isActionable && (
                        <span className="bg-slate-950 text-lime-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                            Score
                        </span>
                    )}
                </div>

                <div className="bg-white">
                    {/* Player 1 */}
                    <div className={clsx(
                        "flex justify-between items-center px-4 py-3 border-b border-slate-50 transition-colors",
                        p1Won ? "bg-sky-50/60" : ""
                    )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={clsx(
                                "w-1 h-8 rounded-full shrink-0",
                                p1Won ? "bg-sky-500" : "bg-slate-200"
                            )}></div>
                            <span className={clsx(
                                "truncate font-bold text-sm",
                                !p1.name ? "text-slate-300 italic font-normal" : p1Won ? "text-slate-950" : "text-slate-600"
                            )}>
                                {p1.name || "TBD"}
                            </span>
                        </div>
                        <SetScores
                            scores={p1.scores}
                            opponentScores={p2.scores}
                            fallbackScore={p1.score}
                            participant="participant1"
                            isMatchWinner={p1Won}
                        />
                    </div>

                    {/* Player 2 */}
                    <div className={clsx(
                        "flex justify-between items-center px-4 py-3 transition-colors",
                        p2Won ? "bg-sky-50/60" : ""
                    )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={clsx(
                                "w-1 h-8 rounded-full shrink-0",
                                p2Won ? "bg-sky-500" : "bg-slate-200"
                            )}></div>
                            <span className={clsx(
                                "truncate font-bold text-sm",
                                !p2.name ? "text-slate-300 italic font-normal" : p2Won ? "text-slate-950" : "text-slate-600"
                            )}>
                                {p2.name || "TBD"}
                            </span>
                        </div>
                        <SetScores
                            scores={p2.scores}
                            opponentScores={p1.scores}
                            fallbackScore={p2.score}
                            participant="participant2"
                            isMatchWinner={p2Won}
                        />
                    </div>
                </div>
            </div>

            {/* Connectors */}
            {roundIndex < totalRounds - 1 && (
                <div className="absolute top-1/2 -right-5 w-5 sm:-right-8 sm:w-8 h-px bg-slate-300"></div>
            )}
        </div>
    );
};

const SetScores = ({ scores, opponentScores, fallbackScore, participant, isMatchWinner }) => {
    const visibleScores = Array.isArray(scores) ? scores.filter((score) => score !== null && score !== undefined) : [];

    if (visibleScores.length === 0) {
        if (fallbackScore !== undefined && fallbackScore !== null && fallbackScore !== '') {
            return (
                <span className={clsx(
                    "font-mono font-bold text-lg",
                    isMatchWinner ? "text-sky-600" : "text-slate-300"
                )}>
                    {fallbackScore}
                </span>
            );
        }
        return <span className="font-mono font-bold text-lg text-slate-300">-</span>;
    }

    return (
        <div className="flex shrink-0 gap-1">
            {visibleScores.map((score, index) => {
                const gameWinner = getBadmintonGameWinner(
                    participant === 'participant1' ? score : opponentScores?.[index],
                    participant === 'participant2' ? score : opponentScores?.[index]
                );
                const wonGame = gameWinner === participant;

                return (
                    <span
                        key={index}
                        title={wonGame ? `Won game ${index + 1}` : `Lost game ${index + 1}`}
                        className={clsx(
                            "flex h-7 min-w-7 items-center justify-center rounded px-1.5 font-mono text-xs font-bold",
                            wonGame ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500",
                            isMatchWinner && !wonGame ? "ring-1 ring-sky-200" : ""
                        )}
                    >
                        {score}
                    </span>
                );
            })}
        </div>
    );
};

export default function TournamentBracket({ rounds, onMatchClick, isEditable }) {
    if (!rounds || rounds.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-sm font-medium text-slate-500">No draw data.</p>
        </div>
    );

    return (
        <div className="max-w-full overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory px-1 pb-4 pt-6 sm:px-4 sm:py-12 [scrollbar-width:thin] [scrollbar-color:rgb(14_165_233)_rgb(241_245_249)]">
            <div className="flex min-w-max gap-x-10 sm:gap-x-16">
                {rounds.map((round, rIndex) => (
                    <section key={round.title || rIndex} className="relative flex flex-col snap-start">
                        {/* Round Title */}
                        <div className="mb-6 text-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-950">
                                {round.title}
                            </h3>
                        </div>

                        {/* Matches */}
                        <div className="flex flex-grow flex-col justify-around gap-y-3 px-1 sm:gap-y-8 sm:px-2">
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
                    </section>
                ))}
            </div>
        </div>
    );
}
