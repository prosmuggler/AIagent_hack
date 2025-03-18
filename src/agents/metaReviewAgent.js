const BaseAgent = require('./baseAgent');
const { db } = require('../database');

class MetaReviewAgent extends BaseAgent {
    constructor() {
        super('meta-review');
    }

    async process(enhancedIdeas, ideaId) {
        const review = await this.reviewProcess(enhancedIdeas, ideaId);
        await this.logAction(ideaId, 'meta-review', review);
        return review;
    }

    async reviewProcess(enhancedIdeas, ideaId) {
        // Get process history
        const processHistory = await this.getProcessHistory(ideaId);
        
        // Analyze performance metrics
        const performanceMetrics = this.analyzePerformance(processHistory);
        
        // Identify bottlenecks
        const bottlenecks = this.identifyBottlenecks(processHistory);
        
        // Generate optimization suggestions
        const suggestions = this.generateSuggestions(performanceMetrics, bottlenecks);

        return {
            performanceMetrics,
            bottlenecks,
            suggestions,
            finalIdeas: enhancedIdeas
        };
    }

    async getProcessHistory(ideaId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT agent_type, action, result, created_at 
                 FROM history 
                 WHERE idea_id = ? 
                 ORDER BY created_at`,
                [ideaId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    analyzePerformance(processHistory) {
        const metrics = {
            totalTime: 0,
            agentTimes: {},
            successRates: {},
            improvementRates: {}
        };

        // Calculate timing metrics
        if (processHistory.length > 0) {
            const startTime = new Date(processHistory[0].created_at);
            const endTime = new Date(processHistory[processHistory.length - 1].created_at);
            metrics.totalTime = endTime - startTime;
        }

        // Calculate per-agent metrics
        processHistory.forEach(entry => {
            const agentType = entry.agent_type;
            if (!metrics.agentTimes[agentType]) {
                metrics.agentTimes[agentType] = 0;
            }
            metrics.agentTimes[agentType]++;
        });

        // Calculate success rates
        processHistory.forEach(entry => {
            const agentType = entry.agent_type;
            if (!metrics.successRates[agentType]) {
                metrics.successRates[agentType] = { total: 0, successful: 0 };
            }
            metrics.successRates[agentType].total++;
            
            const result = JSON.parse(entry.result);
            if (this.isSuccessful(result)) {
                metrics.successRates[agentType].successful++;
            }
        });

        return metrics;
    }

    isSuccessful(result) {
        // Define success criteria based on agent type
        if (Array.isArray(result)) {
            return result.length > 0;
        }
        if (typeof result === 'object') {
            return result.score > 7 || result.finalScore > 7;
        }
        return false;
    }

    identifyBottlenecks(processHistory) {
        const bottlenecks = [];
        
        // Analyze timing patterns
        const agentTimings = {};
        processHistory.forEach(entry => {
            if (!agentTimings[entry.agent_type]) {
                agentTimings[entry.agent_type] = [];
            }
            agentTimings[entry.agent_type].push(new Date(entry.created_at));
        });

        // Identify slow agents
        Object.entries(agentTimings).forEach(([agent, timings]) => {
            if (timings.length > 1) {
                const avgTime = this.calculateAverageTime(timings);
                if (avgTime > 5000) { // 5 seconds threshold
                    bottlenecks.push({
                        agent: agent,
                        issue: 'slow_processing',
                        details: `Average processing time: ${avgTime}ms`
                    });
                }
            }
        });

        // Identify failed operations
        processHistory.forEach(entry => {
            const result = JSON.parse(entry.result);
            if (!this.isSuccessful(result)) {
                bottlenecks.push({
                    agent: entry.agent_type,
                    issue: 'failed_operation',
                    details: 'Operation did not meet success criteria'
                });
            }
        });

        return bottlenecks;
    }

    calculateAverageTime(timings) {
        let totalTime = 0;
        for (let i = 1; i < timings.length; i++) {
            totalTime += timings[i] - timings[i - 1];
        }
        return totalTime / (timings.length - 1);
    }

    generateSuggestions(metrics, bottlenecks) {
        const suggestions = [];

        // Generate timing-based suggestions
        Object.entries(metrics.agentTimes).forEach(([agent, count]) => {
            if (count > 5) {
                suggestions.push({
                    type: 'optimization',
                    target: agent,
                    suggestion: 'Consider implementing caching for repeated operations'
                });
            }
        });

        // Generate success rate-based suggestions
        Object.entries(metrics.successRates).forEach(([agent, rates]) => {
            const successRate = rates.successful / rates.total;
            if (successRate < 0.7) {
                suggestions.push({
                    type: 'improvement',
                    target: agent,
                    suggestion: 'Review and improve success criteria implementation'
                });
            }
        });

        // Generate bottleneck-based suggestions
        bottlenecks.forEach(bottleneck => {
            if (bottleneck.issue === 'slow_processing') {
                suggestions.push({
                    type: 'performance',
                    target: bottleneck.agent,
                    suggestion: 'Implement parallel processing or optimize algorithms'
                });
            }
        });

        return suggestions;
    }
}

module.exports = { MetaReviewAgent }; 