const BaseAgent = require('./baseAgent');
const natural = require('natural');
const { db } = require('../database');

class ProximityAgent extends BaseAgent {
    constructor() {
        super('proximity');
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
    }

    async process(evolvedIdeas, ideaId) {
        const enhancedIdeas = await Promise.all(
            evolvedIdeas.map(idea => this.enhanceWithHistory(idea))
        );

        await this.logAction(ideaId, 'proximity', enhancedIdeas);
        return enhancedIdeas;
    }

    async enhanceWithHistory(evolvedIdea) {
        const { evolvedIdea: idea, evolvedScore } = evolvedIdea;
        
        // Get historical data
        const historicalIdeas = await this.getHistoricalIdeas();
        
        // Find similar ideas from history
        const similarIdeas = this.findSimilarIdeas(idea, historicalIdeas);
        
        // Enhance the current idea based on historical success
        const enhancedIdea = this.enhanceIdea(idea, similarIdeas);

        return {
            originalIdea: idea,
            originalScore: evolvedScore,
            enhancedIdea,
            historicalContext: similarIdeas
        };
    }

    async getHistoricalIdeas() {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT input, generated_ideas, reflection, ranking, evolution, proximity, meta_review 
                 FROM ideas 
                 ORDER BY created_at DESC 
                 LIMIT 10`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    findSimilarIdeas(currentIdea, historicalIdeas) {
        const currentTokens = this.tokenizer.tokenize(currentIdea.toLowerCase());
        const similarIdeas = [];

        historicalIdeas.forEach(historicalIdea => {
            const historicalTokens = this.tokenizer.tokenize(historicalIdea.generated_ideas.toLowerCase());
            const similarity = this.calculateSimilarity(currentTokens, historicalTokens);
            
            if (similarity > 0.3) { // Threshold for similarity
                similarIdeas.push({
                    idea: historicalIdea.generated_ideas,
                    similarity,
                    historicalData: historicalIdea
                });
            }
        });

        return similarIdeas.sort((a, b) => b.similarity - a.similarity);
    }

    calculateSimilarity(tokens1, tokens2) {
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    enhanceIdea(currentIdea, similarIdeas) {
        if (similarIdeas.length === 0) return currentIdea;

        // Get the most successful similar idea
        const bestSimilarIdea = similarIdeas[0];
        const historicalData = bestSimilarIdea.historicalData;

        // Extract successful elements from historical data
        const successfulElements = this.extractSuccessfulElements(historicalData);
        
        // Enhance the current idea with successful elements
        return this.combineIdeas(currentIdea, successfulElements);
    }

    extractSuccessfulElements(historicalData) {
        const elements = [];
        
        // Extract successful elements from each stage
        if (historicalData.reflection) {
            const reflectionData = JSON.parse(historicalData.reflection);
            elements.push(...reflectionData.filter(item => item.overallScore > 7));
        }
        
        if (historicalData.ranking) {
            const rankingData = JSON.parse(historicalData.ranking);
            elements.push(...rankingData.filter(item => item.finalScore > 7));
        }
        
        if (historicalData.evolution) {
            const evolutionData = JSON.parse(historicalData.evolution);
            elements.push(...evolutionData.filter(item => item.improvement > 0));
        }

        return elements;
    }

    combineIdeas(currentIdea, successfulElements) {
        if (successfulElements.length === 0) return currentIdea;

        // Combine the current idea with successful elements
        const enhancedElements = successfulElements.map(element => {
            if (element.idea) return element.idea;
            return element;
        });

        return `${currentIdea} (enhanced with ${enhancedElements.join(', ')})`;
    }
}

module.exports = { ProximityAgent }; 