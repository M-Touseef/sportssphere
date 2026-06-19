/**
 * QueryRouter - Classifies user messages for the hybrid chatbot
 *
 * Routes to:
 * - PERSONAL: logged-in user's bookings, matches, tournaments, sessions
 * - PUBLIC_DATA: platform data from MongoDB (courts, coaches, tournaments, results)
 * - KNOWLEDGE: badminton Q&A via RAG (Hugging Face Space)
 * - DENIED: other users' private data (TR-02)
 */
class QueryRouter {
    constructor() {
        this.INTENT_TYPE_PERSONAL = 'PERSONAL';
        this.INTENT_TYPE_PUBLIC_DATA = 'PUBLIC_DATA';
        this.INTENT_TYPE_KNOWLEDGE = 'KNOWLEDGE';
        this.INTENT_TYPE_DENIED = 'DENIED';

        this.personalPatterns = [
            /\b(next|upcoming)\s+(match|matches|game|games)\b/i,
            /\bwhen\s+(do|will|am)\s+i\s+(play|playing)\b/i,
            /\bwho\s+(do|will|am)\s+i\s+(play|playing)\b/i,
            /\bmy\b.*\b(match|matches|game|games|schedule)\b/i,
            /\bmy\b.*\b(booking|bookings|reservation|reservations)\b/i,
            /\bmy\b.*\b(tournament|tournaments|registration|registrations)\b/i,
            /\bmy\b.*\b(session|sessions)\b/i,
            /\bwhen\s+is\s+my\b/i,
            /\bam\s+i\s+registered\b/i,
            /\bdid\s+i\s+win\b/i,
            /\bwho\s+am\s+i\s+playing\b/i,
            /\bwhat('s| is)\s+my\s+next\b/i
        ];

        this.deniedPatterns = [
            /\b(show|get|view|list)\s+(details|schedule|profile|bookings?)\s+of\s+(another|other|\w+)\b/i,
            /\b(show|get|view|list)\b.*\b(another|other)\s+(user|player)\b/i,
            /\b(another|other)\s+(user|player)\b.*\b(booking|bookings|schedule|matches|profile)\b/i,
            /\bwhat\s+is\s+the\s+schedule\s+of\s+player\s+\w+/i,
            /\bwhich\s+tournaments\s+is\s+player\s+\w+\s+registered/i,
            /\b(user|player)\s+['"]?\w+['"]?\s+(bookings?|schedule|matches|profile)\b/i,
            /\b(show|what are)\s+.+\s+bookings?\s+(for|of)\s+/i,
            /\b(someone else|another person)('s)?\s+(booking|data|info)\b/i
        ];

        this.publicPatterns = [
            /\b(list|show|find|available|upcoming)\s+.*\b(court|courts|venue|venues)\b/i,
            /\b(court|courts)\s+(in|near|at)\b/i,
            /\bbook\s+a\s+court\b/i,
            /\b(list|show|find)\s+.*\b(coach|coaches|trainer|trainers)\b/i,
            /\b(coach|coaches)\s+(in|near|available)\b/i,
            /\b(tournament|tournaments)\s+(list|schedule|standing|result|results)\b/i,
            /\bwho\s+won\b/i,
            /\b(match|tournament)\s+result/i,
            /\b(current|ongoing|upcoming)\s+tournament/i,
            /\bplatform\s+(court|coach|tournament)/i
        ];

        this.knowledgePatterns = [
            /\b(explain|describe)\b.*\b(rule|rules|scoring)\b/i,
            /\b(rule|rules|scoring|fault|serve|let)\b/i,
            /\b(technique|smash|drop|clear|footwork|grip)\b/i,
            /\b(equipment|racket|shuttle|string|shoes)\b/i,
            /\b(training|drill|practice|warm[- ]?up)\b/i,
            /\b(strategy|tactic|singles|doubles)\b/i,
            /\b(fitness|injury|stamina|conditioning)\b/i,
            /\bhow\s+(to|do|can)\s+(i|you)\b/i,
            /\bwhat\s+is\s+(a|an|the)\s+(badminton|smash|clear)\b/i
        ];
    }

    route(message) {
        if (!message || !message.trim()) {
            return this.INTENT_TYPE_KNOWLEDGE;
        }

        const normalized = message.toLowerCase().trim();

        const isPersonal = this.personalPatterns.some((p) => p.test(normalized));
        const isDenied = this.deniedPatterns.some((p) => p.test(normalized));
        const isPublic = this.publicPatterns.some((p) => p.test(normalized));
        const isKnowledge = this.knowledgePatterns.some((p) => p.test(normalized));

        if (isDenied) {
            return this.INTENT_TYPE_DENIED;
        }

        if (isPersonal) {
            return this.INTENT_TYPE_PERSONAL;
        }

        // Public listings must not steal "my ..." personal queries
        if (isPublic && !/\bmy\b/i.test(normalized)) {
            return this.INTENT_TYPE_PUBLIC_DATA;
        }

        if (isKnowledge) {
            return this.INTENT_TYPE_KNOWLEDGE;
        }

        return this.INTENT_TYPE_KNOWLEDGE;
    }
}

module.exports = QueryRouter;
