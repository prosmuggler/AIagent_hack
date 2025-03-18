const BaseAgent = require('./baseAgent');
const natural = require('natural');

class ReflectionAgent extends BaseAgent {
    constructor() {
        super('reflection');
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
    }

    async process(ideas, ideaId) {
        const evaluations = await Promise.all(
            ideas.map(idea => this.evaluateIdea(idea))
        );

        await this.logAction(ideaId, 'reflect', evaluations);
        return evaluations;
    }

    async evaluateIdea(idea) {
        // Simple evaluation based on predefined criteria
        const criteria = {
            feasibility: this.evaluateFeasibility(idea),
            impact: this.evaluateImpact(idea),
            cost: this.evaluateCost(idea),
            timeline: this.evaluateTimeline(idea)
        };

        return {
            idea,
            criteria,
            overallScore: this.calculateOverallScore(criteria)
        };
    }

    evaluateFeasibility(idea) {
        // Simple feasibility scoring based on keyword analysis
        const feasibilityKeywords = {
            high: ['solar', 'wind', 'recycling', 'composting'],
            medium: ['smart grid', 'storage', 'monitoring'],
            low: ['nuclear', 'fusion', 'quantum']
        };

        return this.scoreBasedOnKeywords(idea, feasibilityKeywords);
    }

    evaluateImpact(idea) {
        const impactKeywords = {
            high: ['renewable', 'sustainable', 'efficient', 'smart'],
            medium: ['monitoring', 'optimization', 'recycling'],
            low: ['small-scale', 'pilot', 'test']
        };

        return this.scoreBasedOnKeywords(idea, impactKeywords);
    }

    evaluateCost(idea) {
        const costKeywords = {
            high: ['smart grid', 'infrastructure', 'system'],
            medium: ['panels', 'turbines', 'storage'],
            low: ['composting', 'recycling', 'monitoring']
        };

        return this.scoreBasedOnKeywords(idea, costKeywords);
    }

    evaluateTimeline(idea) {
        const timelineKeywords = {
            high: ['monitoring', 'optimization', 'recycling'],
            medium: ['panels', 'turbines', 'storage'],
            low: ['infrastructure', 'grid', 'system']
        };

        return this.scoreBasedOnKeywords(idea, timelineKeywords);
    }

    scoreBasedOnKeywords(idea, keywordMap) {
        const tokens = this.tokenizer.tokenize(idea.toLowerCase());
        let score = 0;

        tokens.forEach(token => {
            if (keywordMap.high.includes(token)) score += 3;
            if (keywordMap.medium.includes(token)) score += 2;
            if (keywordMap.low.includes(token)) score += 1;
        });

        return Math.min(10, Math.max(1, score));
    }

    calculateOverallScore(criteria) {
        const weights = {
            feasibility: 0.3,
            impact: 0.3,
            cost: 0.2,
            timeline: 0.2
        };

        return Math.round(
            criteria.feasibility * weights.feasibility +
            criteria.impact * weights.impact +
            criteria.cost * weights.cost +
            criteria.timeline * weights.timeline
        );
    }
}

module.exports = { ReflectionAgent }; 