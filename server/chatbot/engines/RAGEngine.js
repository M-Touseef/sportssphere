const IIntentResolver = require('../interfaces/IIntentResolver');
const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');
const pdf = pdfLib.PDFParse || pdfLib.default || pdfLib;

/**
 * RAGEngine - Retrieval-Augmented Generation Engine
 * 
 * 1. Retrieves relevant documents from a local knowledge base (simulated vector search).
 * 2. Augments the prompt with retrieved context.
 * 3. Uses the AI Service (Flask) to generate the final answer.
 */
class RAGEngine extends IIntentResolver {
    constructor() {
        super();
        this.knowledgeBasePath = path.join(__dirname, '../knowledge_base');
        this.documents = [];
        this.ready = false;

        // Load knowledge base on init
        this.loadKnowledgeBase();
    }

    /**
     * Load documents from knowledge_base directory
     */
    async loadKnowledgeBase() {
        try {
            if (!fs.existsSync(this.knowledgeBasePath)) {
                fs.mkdirSync(this.knowledgeBasePath, { recursive: true });
                // Create default docs if empty
                this.createDefaultDocuments();
            }

            const files = fs.readdirSync(this.knowledgeBasePath);
            const loadedChunks = [];

            for (const file of files) {
                const filePath = path.join(this.knowledgeBasePath, file);
                let rawContent = '';

                try {
                    if (file.endsWith('.pdf')) {
                        const dataBuffer = fs.readFileSync(filePath);
                        if (pdfLib.PDFParse) {
                            // v2: Class based
                            const instance = new pdfLib.PDFParse({
                                data: new Uint8Array(dataBuffer),
                                // PDF.js expects the URL to the folder containing standard fonts, ending with /
                                standardFontDataUrl: path.join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/') + '/'
                            });
                            const data = await instance.getText();
                            rawContent = data.text;
                        } else {
                            // v1: Function based
                            const pdf = pdfLib.default || pdfLib;
                            const options = {
                                standardFontDataUrl: path.join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/') + '/'
                            };
                            const data = await pdf(dataBuffer, options);
                            rawContent = data.text;
                        }

                        // Verify text extraction quality: Real text vs Scanned images
                        if (rawContent) {
                            const tokenCount = rawContent.split(/\s+/).filter(t => t.length > 0).length;
                            const charCount = rawContent.trim().length;
                            const ratio = charCount / (tokenCount || 1);

                            if (charCount < 200 && dataBuffer.length > 50000) {
                                console.warn(`[RAGEngine] CAUTION: ${file} produced very little text (${charCount} chars) despite being ${dataBuffer.length} bytes. It might be a scanned image.`);
                            } else if (ratio > 25) {
                                console.warn(`[RAGEngine] CAUTION: ${file} has a suspicious char-to-token ratio (${ratio.toFixed(2)}). Text quality might be low.`);
                            }
                        }


                        console.log(`[RAGEngine] Loaded PDF: ${file}`);
                    } else if (file.endsWith('.json') || file.endsWith('.txt') || file.endsWith('.md')) {
                        rawContent = fs.readFileSync(filePath, 'utf-8');
                    }
                } catch (readError) {
                    console.error(`[RAGEngine] Error reading/parsing ${file}:`, readError);
                    continue;
                }

                if (rawContent) {
                    // 1. Clean Text
                    const cleaned = this.cleanText(rawContent);
                    // 2. Chunk Text
                    const chunks = this.chunkText(cleaned);

                    // 3. Add to index
                    chunks.forEach((chunk, index) => {
                        loadedChunks.push({
                            content: chunk,
                            source: file,
                            id: `${file}_${index}`
                        });
                    });
                    console.log(`[RAGEngine] Processed ${file}: ${chunks.length} chunks.`);
                }
            }

            this.documents = loadedChunks;
            console.log(`[RAGEngine] Total Chunks (Embeddings): ${this.documents.length}`);
            console.log(`[RAGEngine] Vector Store Initialized. Total size: ${this.documents.length} records.`);
            this.ready = true;
        } catch (error) {
            console.error('[RAGEngine] Error loading knowledge base:', error);
        }
    }


    /**
     * Clean and normalize text
     */
    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/[^\w\s.,?!-]/g, '') // Remove special characters (keep punctuation)
            .trim();
    }

    /**
     * Split text into overlapping chunks
     * 500-1000 tokens per chunk, 100-200 token overlap
     * @param {string} text 
     * @param {number} minTokens - Minimum tokens per chunk
     * @param {number} maxTokens - Maximum tokens per chunk 
     * @param {number} overlapTokens - Token overlap
     */
    chunkText(text, minTokens = 500, maxTokens = 1000, overlapTokens = 150) {
        if (!text) return [];

        // Simple space-based tokenization as proxy
        const tokens = text.split(/\s+/);
        if (tokens.length <= maxTokens) return [text];

        const chunks = [];
        let start = 0;

        while (start < tokens.length) {
            const end = Math.min(start + maxTokens, tokens.length);

            // Extract tokens for this chunk
            const chunkTokens = tokens.slice(start, end);
            const chunkText = chunkTokens.join(' ');

            if (chunkText.trim()) {
                chunks.push(chunkText);
            }

            if (end === tokens.length) break;

            // Move start for next chunk with overlap
            start = end - overlapTokens;

            // Safety: ensure forward progress
            if (start <= 0 && chunks.length > 0) start = end;
            if (start >= end) start = end;
        }

        return chunks;
    }


    createDefaultDocuments() {
        // Sample Rules
        fs.writeFileSync(path.join(this.knowledgeBasePath, 'badminton_rules.txt'),
            `Badminton Rules:
            A match consists of the best of 3 games of 21 points.
            Every time there is a serve – there is a point scored.
            The side winning a rally adds a point to its score.
            At 20 all, the side which gains a 2 point lead first, wins that game.
            At 29 all, the side scoring the 30th point, wins that game.
            The side winning a game serves first in the next game.`
        );

        // Sample Techniques
        fs.writeFileSync(path.join(this.knowledgeBasePath, 'techniques.txt'),
            `Badminton Techniques:
            Smash: Hit the shuttlecock with power and speed downwards into the opponent's court. Use a strong wrist snap.
            Clear: Hit the shuttlecock high and deep to the opponent's back court.
            Drop Shot: Hit the shuttlecock so that it falls softly over the net into the opponent's forecourt.
            Drive: A flat shot kept as low as possible, hit hard and fast.`
        );

        // Platform Info
        fs.writeFileSync(path.join(this.knowledgeBasePath, 'platform_info.txt'),
            `SportSphere Platform Features:
            Court Booking: Reserve badminton courts at local venues.
            Coach Finder: Connect with certified coaches for personalized training.
            Tournament Management: Create and join tournaments with automated bracket generation.
            Sparring Partner Matchmaking: Find players of your skill level to practice with.`
        );
    }

    /**
     * Resolve intent using RAG
     * @param {string} message - User's input message
     * @param {Object} context - Context
     * @returns {Promise<Object>} - Intent result with RAG response
     */
    async resolveIntent(message, context = {}) {
        if (!this.ready) return null;

        // 1. Retrieve relevant context
        const retrievedContext = this.retrieve(message);

        // 2. Construct augmented prompt
        const augmentedPrompt = `
        Context Information:
        ${retrievedContext}

        User Question: ${message}

        Based on the context provided above, please answer the user's question. 
        If the answer is not in the context, use your general knowledge but mention that it might not be specific to SportSphere.
        `;

        // 3. Return a result that indicates this should be processed by LLM with context
        // We return a specialized intent that the AIService can use to call Flask
        return {
            intentId: 'RAG_QUERY',
            confidence: 0.9, // High confidence since we routed here
            actionType: 'RAG_GENERATION', // Custom action for AIService handling
            response: null, // Will be generated by LLM
            augmentedPrompt: augmentedPrompt,
            retrievedContext: retrievedContext, // For debugging/citations
            processingTimeMs: 0
        };
    }

    /**
     * Keyword-based retrieval on Chunks
     * @param {string} query 
     * @returns {string} - Combined relevant text snippets
     */
    retrieve(query) {
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const scores = this.documents.map(doc => {
            let score = 0;
            const contentLower = doc.content.toLowerCase();
            keywords.forEach(kw => {
                // Simple frequency count
                const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const matches = contentLower.match(regex);
                if (matches) score += matches.length;
            });
            return { ...doc, score };
        });

        // Sort by score
        const relevantDocs = scores.filter(d => d.score > 0).sort((a, b) => b.score - a.score);

        if (relevantDocs.length === 0) {
            return "No specific context found.";
        }

        // Return top 3 relevant chunks
        // Format: [Source: file] Content...
        return relevantDocs.slice(0, 3)
            .map(d => `[Source: ${d.source}] ${d.content}`)
            .join('\n\n');
    }

    getEngineName() { return 'RAGEngine'; }
    async isReady() { return this.ready; }
}

module.exports = RAGEngine;
