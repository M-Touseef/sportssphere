import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TournamentBracket from '../../components/tournament/TournamentBracket';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import tournamentService from '../../services/tournamentService';
import { useToast } from '../../context/ToastContext';

export default function TournamentView() {
    const { id } = useParams();
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tournamentName, setTournamentName] = useState('');
    const { error } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch tournament details for the name
                const tournamentData = await tournamentService.getTournament(id);
                setTournamentName(tournamentData.data.name);

                // Fetch matches
                const matchesData = await tournamentService.getTournamentMatches(id);
                processMatches(matchesData.data);
            } catch (err) {
                console.error("Failed to load tournament data", err);
                error("Failed to load tournament bracket data");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const processMatches = (matches) => {
        if (!matches || matches.length === 0) {
            setRounds([]);
            return;
        }

        // group matches by round
        const roundsMap = {};

        matches.forEach(match => {
            if (!roundsMap[match.round]) {
                roundsMap[match.round] = [];
            }

            // Map backend match structure to UI component structure
            // Component expects: { id, player1: { name, score }, player2: { name, score } }
            // Backend provides: participant1.registration.player.name (or player1.name/player2.name for doubles)

            const getParticipantName = (participant) => {
                if (!participant.registration) return "Bye";
                const reg = participant.registration;

                // Check if it's doubles (has player1 and player2) or singles (player)
                if (reg.player1 && reg.player2) {
                    return `${reg.player1.name} & ${reg.player2.name}`;
                }
                return reg.player?.name || "Unknown";
            };

            const getScore = (participant) => {
                // Score is stored as an array of set scores [21, 19]
                // The Bracket component expects a single score or we might need to join them
                // Looking at mock data: score is a number. 
                // Let's assume we sum them or show sets won? 
                // Mock data showed simple number (21). Tennis/Badminton usually shows sets.
                // Converting array to string for display: "21-19, 21-15"
                // But MatchCard expects `p1.score` to be rendered.
                if (participant.score && participant.score.length > 0) {
                    return participant.score.join(', ');
                }
                return undefined;
            };

            const uiMatch = {
                id: match._id,
                player1: {
                    name: getParticipantName(match.participant1),
                    score: getScore(match.participant1)
                },
                player2: {
                    name: getParticipantName(match.participant2),
                    score: getScore(match.participant2)
                }
            };

            roundsMap[match.round].push(uiMatch);
        });

        // Order rounds: Round of 64 -> ... -> Final
        const roundOrder = [
            'round_of_64',
            'round_of_32',
            'round_of_16',
            'quarter_final',
            'semi_final',
            'final'
        ];

        const sortedRounds = [];

        roundOrder.forEach(roundKey => {
            if (roundsMap[roundKey]) {
                let title = roundKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                if (roundKey === 'quarter_final') title = 'Quarter Finals';
                if (roundKey === 'semi_final') title = 'Semi Finals';
                if (roundKey === 'final') title = 'Finals';

                sortedRounds.push({
                    title: title,
                    matches: roundsMap[roundKey]
                });
            }
        });

        // Handle any rounds not in our explicit list (e.g. customized round names)
        Object.keys(roundsMap).forEach(key => {
            if (!roundOrder.includes(key)) {
                sortedRounds.push({
                    title: key.replace(/_/g, ' '),
                    matches: roundsMap[key]
                });
            }
        });

        setRounds(sortedRounds);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link to={`/tournaments/${id}`} className="p-2 text-gray-400 hover:text-gray-600">
                    <ArrowLeftIcon className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    {loading ? 'Loading...' : `${tournamentName} - Bracket`}
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow p-4 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-full pt-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <TournamentBracket rounds={rounds} />
                )}
            </div>
        </div>
    );
}
