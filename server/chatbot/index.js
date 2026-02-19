/**
 * Chatbot Module - Main export file
 * 
 * Exports all chatbot components for easy importing
 */

const IIntentResolver = require('./interfaces/IIntentResolver');
const RuleBasedEngine = require('./engines/RuleBasedEngine');
const MLEngine = require('./engines/MLEngine');
const ResponseGenerator = require('./ResponseGenerator');
const intentRules = require('./config/intentRules.json');

module.exports = {
    // Interfaces
    IIntentResolver,

    // Engines
    RuleBasedEngine,
    MLEngine,

    // Services
    ResponseGenerator,

    // Configuration
    intentRules,

    // Factory method to create configured engine
    createIntentResolver(type = 'rule') {
        switch (type.toLowerCase()) {
            case 'ml':
                return new MLEngine();
            case 'rule':
            default:
                return new RuleBasedEngine();
        }
    }
};
