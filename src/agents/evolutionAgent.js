const BaseAgent = require('./baseAgent');
const natural = require('natural');

class EvolutionAgent extends BaseAgent {
    constructor() {
        super('evolution');
        this.tokenizer = new natural.WordTokenizer();
    }

    async process(rankedIdeas, ideaId) {
        const evolvedIdeas = await Promise.all(
            rankedIdeas.map(idea => this.evolveIdea(idea))
        );

        await this.logAction(ideaId, 'evolve', evolvedIdeas);
        return evolvedIdeas;
    }

    async evolveIdea(rankedIdea) {
        const { idea, finalScore } = rankedIdea;
        
        // Generate variations of the idea
        const variations = this.generateVariations(idea);
        
        // Score each variation
        const scoredVariations = await Promise.all(
            variations.map(variation => this.scoreVariation(variation))
        );

        // Select the best variation
        const bestVariation = this.selectBestVariation(scoredVariations);

        return {
            originalIdea: idea,
            originalScore: finalScore,
            evolvedIdea: bestVariation.idea,
            evolvedScore: bestVariation.score,
            improvement: bestVariation.score - finalScore
        };
    }

    generateVariations(idea) {
        const tokens = this.tokenizer.tokenize(idea.toLowerCase());
        const variations = [];

        // Add technology variations
        if (idea.includes('solar')) {
            variations.push('solar window panels');
            variations.push('solar roof tiles');
            variations.push('solar-powered street lights');
        }

        if (idea.includes('wind')) {
            variations.push('vertical axis wind turbines');
            variations.push('urban wind turbines');
            variations.push('wind-powered street lights');
        }

        if (idea.includes('recycling')) {
            variations.push('smart recycling bins');
            variations.push('automated recycling centers');
            variations.push('recycling reward programs');
        }

        if (idea.includes('energy')) {
            variations.push('energy storage systems');
            variations.push('energy monitoring systems');
            variations.push('energy optimization platforms');
        }

        // Add sustainability variations
        if (idea.includes('sustainable')) {
            variations.push('sustainable urban farming');
            variations.push('sustainable transportation');
            variations.push('sustainable building materials');
        }

        return variations;
    }

    async scoreVariation(variation) {
        // Simple scoring based on keyword analysis
        const score = this.calculateVariationScore(variation);
        return { idea: variation, score };
    }

    calculateVariationScore(variation) {
        const tokens = this.tokenizer.tokenize(variation.toLowerCase());
        let score = 0;

        // Score based on technology keywords
        const techKeywords = ['smart', 'automated', 'optimized', 'efficient', 'monitoring'];
        tokens.forEach(token => {
            if (techKeywords.includes(token)) score += 2;
        });

        // Score based on sustainability keywords
        const sustainabilityKeywords = ['sustainable', 'renewable', 'green', 'eco-friendly'];
        tokens.forEach(token => {
            if (sustainabilityKeywords.includes(token)) score += 2;
        });

        // Score based on urban context
        const urbanKeywords = ['urban', 'city', 'street', 'building', 'roof'];
        tokens.forEach(token => {
            if (urbanKeywords.includes(token)) score += 1;
        });

        return Math.min(10, Math.max(1, score));
    }

    selectBestVariation(scoredVariations) {
        return scoredVariations.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }
}

module.exports = { EvolutionAgent }; 