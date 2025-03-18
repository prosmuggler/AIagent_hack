const BaseAgent = require('./baseAgent');
const axios = require('axios');

class RankingAgent extends BaseAgent {
    constructor() {
        super('ranking');
    }

    async process(evaluatedIdeas, ideaId) {
        const rankings = await Promise.all(
            evaluatedIdeas.map(idea => this.rankIdea(idea))
        );

        await this.logAction(ideaId, 'rank', rankings);
        return rankings;
    }

    async rankIdea(evaluatedIdea) {
        const { idea, criteria } = evaluatedIdea;
        
        // Fetch real-time data for cost analysis
        const costData = await this.fetchCostData(idea);
        
        // Calculate trend score based on web data
        const trendScore = await this.calculateTrendScore(idea);
        
        // Combine all scores
        const finalScore = this.calculateFinalScore(
            criteria.overallScore,
            costData,
            trendScore
        );

        return {
            idea,
            originalScore: criteria.overallScore,
            costScore: costData,
            trendScore,
            finalScore
        };
    }

    async fetchCostData(idea) {
        try {
            // Using free API to get cost data
            const response = await axios.get(
                `https://api.energy.gov/v1/costs?technology=${encodeURIComponent(idea)}`
            );
            
            // Normalize cost data to a score between 1-10
            const cost = response.data.cost || 0;
            return Math.min(10, Math.max(1, 10 - (cost / 1000)));
        } catch (error) {
            console.error('Error fetching cost data:', error);
            return 5; // Default middle score if API fails
        }
    }

    async calculateTrendScore(idea) {
        try {
            // Using free API to get trend data
            const response = await axios.get(
                `https://api.trends.google.com/trends/api/dailytrends?hl=en-US&tz=-120&geo=US&ns=15&q=${encodeURIComponent(idea)}`
            );
            
            // Parse and normalize trend data
            const trendData = response.data;
            const score = this.normalizeTrendData(trendData);
            return Math.min(10, Math.max(1, score));
        } catch (error) {
            console.error('Error fetching trend data:', error);
            return 5; // Default middle score if API fails
        }
    }

    normalizeTrendData(trendData) {
        // Simple normalization based on trend data
        // This is a placeholder - actual implementation would depend on the API response structure
        return 5;
    }

    calculateFinalScore(originalScore, costScore, trendScore) {
        const weights = {
            original: 0.4,
            cost: 0.3,
            trend: 0.3
        };

        return Math.round(
            originalScore * weights.original +
            costScore * weights.cost +
            trendScore * weights.trend
        );
    }
}

module.exports = { RankingAgent }; 