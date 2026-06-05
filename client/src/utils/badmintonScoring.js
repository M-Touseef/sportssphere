const MAX_GAMES = 3;

const toScore = (value) => {
    const score = Number(value);
    return Number.isInteger(score) ? score : NaN;
};

export const getBadmintonGameWinner = (participant1Score, participant2Score) => {
    const p1Score = toScore(participant1Score);
    const p2Score = toScore(participant2Score);

    if (!Number.isInteger(p1Score) || !Number.isInteger(p2Score)) return null;
    if (p1Score < 0 || p2Score < 0 || p1Score > 30 || p2Score > 30) return null;
    if (p1Score === p2Score) return null;

    const winner = p1Score > p2Score ? 'participant1' : 'participant2';
    const high = Math.max(p1Score, p2Score);
    const low = Math.min(p1Score, p2Score);

    const valid =
        (high === 21 && low <= 19) ||
        (high >= 22 && high <= 29 && low === high - 2) ||
        (high === 30 && (low === 28 || low === 29));

    return valid ? winner : null;
};

export const getBadmintonMatchScoreSummary = (participant1Score = [], participant2Score = []) => {
    const games = [];
    let participant1Games = 0;
    let participant2Games = 0;

    for (let index = 0; index < MAX_GAMES; index += 1) {
        const p1Score = toScore(participant1Score[index] ?? 0);
        const p2Score = toScore(participant2Score[index] ?? 0);
        if (p1Score === 0 && p2Score === 0) continue;

        const winner = getBadmintonGameWinner(p1Score, p2Score);
        if (winner === 'participant1') participant1Games += 1;
        if (winner === 'participant2') participant2Games += 1;

        games.push({
            participant1Score: p1Score,
            participant2Score: p2Score,
            winner
        });
    }

    return {
        games,
        gamesWon: {
            participant1: participant1Games,
            participant2: participant2Games
        },
        matchWinner:
            participant1Games === 2 ? 'participant1' :
            participant2Games === 2 ? 'participant2' :
            null
    };
};
