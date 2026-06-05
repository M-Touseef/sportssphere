const MAX_GAMES = 3;

const toScore = (value) => {
    const score = Number(value);
    return Number.isInteger(score) ? score : NaN;
};

const getGameWinner = (p1Score, p2Score) => {
    if (!Number.isInteger(p1Score) || !Number.isInteger(p2Score)) {
        return { error: 'Scores must be whole numbers' };
    }
    if (p1Score < 0 || p2Score < 0 || p1Score > 30 || p2Score > 30) {
        return { error: 'Badminton game scores must be between 0 and 30' };
    }
    if (p1Score === p2Score) {
        return { error: 'A badminton game cannot end in a tie' };
    }

    const winner = p1Score > p2Score ? 'participant1' : 'participant2';
    const high = Math.max(p1Score, p2Score);
    const low = Math.min(p1Score, p2Score);

    const valid =
        (high === 21 && low <= 19) ||
        (high >= 22 && high <= 29 && low === high - 2) ||
        (high === 30 && (low === 28 || low === 29));

    if (!valid) {
        return {
            error: 'Use BWF 3x21 scoring: win to 21, win by 2 at 20-20, or first to 30 at 29-29'
        };
    }

    return { winner };
};

const validateBadmintonMatchScore = (participant1Score = [], participant2Score = []) => {
    if (!Array.isArray(participant1Score) || !Array.isArray(participant2Score)) {
        return { error: 'Scores must be arrays' };
    }

    const maxLength = Math.max(participant1Score.length, participant2Score.length);
    if (maxLength > MAX_GAMES) {
        return { error: 'A badminton match is best of 3 games' };
    }

    const games = [];
    let p1Games = 0;
    let p2Games = 0;

    for (let index = 0; index < MAX_GAMES; index += 1) {
        const p1Score = toScore(participant1Score[index] ?? 0);
        const p2Score = toScore(participant2Score[index] ?? 0);
        const isBlankGame = p1Score === 0 && p2Score === 0;

        if (p1Games === 2 || p2Games === 2) {
            if (!isBlankGame) {
                return { error: 'Do not enter extra game scores after the match is decided' };
            }
            continue;
        }

        if (isBlankGame) {
            return { error: `Game ${index + 1} score is required until a player/team wins 2 games` };
        }

        const gameResult = getGameWinner(p1Score, p2Score);
        if (gameResult.error) {
            return { error: `Game ${index + 1}: ${gameResult.error}` };
        }

        if (gameResult.winner === 'participant1') p1Games += 1;
        if (gameResult.winner === 'participant2') p2Games += 1;

        games.push({
            participant1Score: p1Score,
            participant2Score: p2Score,
            winner: gameResult.winner
        });
    }

    if (p1Games !== 2 && p2Games !== 2) {
        return { error: 'A match winner must win 2 games' };
    }

    return {
        games,
        participant1Score: games.map((game) => game.participant1Score),
        participant2Score: games.map((game) => game.participant2Score),
        matchWinner: p1Games === 2 ? 'participant1' : 'participant2',
        gamesWon: {
            participant1: p1Games,
            participant2: p2Games
        }
    };
};

module.exports = {
    validateBadmintonMatchScore,
    getGameWinner
};
