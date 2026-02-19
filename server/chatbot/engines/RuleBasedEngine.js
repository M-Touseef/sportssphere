const IIntentResolver = require('../interfaces/IIntentResolver');
const intentRules = require('../config/intentRules.json');

/**
 * RuleBasedEngine - Intent resolver using keyword pattern matching
 * 
 * Implements IIntentResolver interface for rule-based intent detection.
 * Rules are loaded from external JSON configuration file.
 */
class RuleBasedEngine extends IIntentResolver {
    constructor() {
        super();
        this.rules = intentRules.intents;
        this.fallback = intentRules.fallback;
        this.ready = true;
    }

    /**
     * Preprocess user message for matching
     * @param {string} message - Raw user message
     * @returns {string} - Normalized message
     */
    preprocessMessage(message) {
        return message
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')  // Remove punctuation
            .replace(/\s+/g, ' ');      // Normalize whitespace
    }

    /**
     * Resolve intent from user message using pattern matching
     * @param {string} message - User's input message
     * @param {Object} context - Context for personalized resolution
     * @returns {Promise<Object|null>} - Intent result
     */
    async resolveIntent(message, context = {}) {
        const startTime = process.hrtime();
        const normalizedMessage = this.preprocessMessage(message);

        let bestMatch = null;
        let bestConfidence = 0;
        let matchedPatterns = [];

        // Sort rules by priority (lower number = higher priority)
        const sortedRules = [...this.rules].sort((a, b) =>
            (a.priority || 999) - (b.priority || 999)
        );

        for (const rule of sortedRules) {
            const { confidence, patterns } = this.calculateConfidence(normalizedMessage, rule.patterns);

            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestMatch = rule;
                matchedPatterns = patterns;
            }
        }

        // Calculate elapsed time
        const elapsed = process.hrtime(startTime);
        const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2);

        // Return fallback if no good match found (confidence threshold: 0.3)
        if (!bestMatch || bestConfidence < 0.3) {
            return {
                intentId: this.fallback.id,
                confidence: 0,
                entities: {},
                actionType: this.fallback.actionType,
                response: this.fallback.response,
                matchedPatterns: [],
                processingTimeMs: parseFloat(elapsedMs),
                forwardToML: this.fallback.forwardToML || false
            };
        }

        return {
            intentId: bestMatch.id,
            confidence: bestConfidence,
            entities: this.extractEntities(normalizedMessage, bestMatch),
            actionType: bestMatch.actionType,
            response: bestMatch.response || null,
            dataQuery: bestMatch.dataQuery || null,
            serviceRoute: bestMatch.serviceRoute || null,
            matchedPatterns: matchedPatterns,
            processingTimeMs: parseFloat(elapsedMs)
        };
    }

    /**
     * Calculate confidence score for pattern matching
     * @param {string} message - Normalized message
     * @param {string[]} patterns - Patterns to match
     * @returns {Object} - Confidence score and matched patterns
     */
    calculateConfidence(message, patterns) {
        let matchCount = 0;
        const matchedPatterns = [];

        for (const pattern of patterns) {
            if (message.includes(pattern.toLowerCase())) {
                matchCount++;
                matchedPatterns.push(pattern);
            }
        }

        // Confidence based on:
        // 1. Number of pattern matches
        // 2. Length of matched patterns relative to message length
        let confidence = 0;
        if (matchCount > 0) {
            const patternCoverage = matchedPatterns.join(' ').length / message.length;
            confidence = Math.min(1, (matchCount * 0.4) + (patternCoverage * 0.6));
        }

        return { confidence, patterns: matchedPatterns };
    }

    /**
     * Extract entities from message (numbers, dates, etc.)
     * @param {string} message - Normalized message
     * @param {Object} rule - Matched rule
     * @returns {Object} - Extracted entities
     */
    extractEntities(message, rule) {
        const entities = {};

        // Extract date-like patterns
        const dateMatch = message.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})/i);
        if (dateMatch) {
            entities.date = dateMatch[0];
        }

        // Extract time-like patterns
        const timeMatch = message.match(/(\d{1,2})\s*([ap]m|:\d{2})/i);
        if (timeMatch) {
            entities.time = timeMatch[0];
        }

        // Extract numbers
        const numberMatch = message.match(/\d+/g);
        if (numberMatch) {
            entities.numbers = numberMatch.map(n => parseInt(n));
        }

        return entities;
    }

    /**
     * Get engine name for logging
     * @returns {string}
     */
    getEngineName() {
        return 'RuleBasedEngine';
    }

    /**
     * Check if engine is ready
     * @returns {Promise<boolean>}
     */
    async isReady() {
        return this.ready && this.rules.length > 0;
    }

    /**
     * Get all registered intents (for debugging)
     * @returns {string[]}
     */
    getRegisteredIntents() {
        return this.rules.map(r => r.id);
    }
}

module.exports = RuleBasedEngine;
