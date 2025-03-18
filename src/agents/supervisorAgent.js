const BaseAgent = require('./baseAgent');
const { db } = require('../database');

class SupervisorAgent extends BaseAgent {
    constructor(agents) {
        super('supervisor');
        this.agents = agents;
    }

    async process(input) {
        try {
            // Create a new idea entry in the database
            const ideaId = await this.createIdeaEntry(input);
            
            // 1. Generation Phase
            const generatedIdeas = await this.agents[0].process(input, ideaId);
            await this.updateIdeaEntry(ideaId, 'generated_ideas', JSON.stringify(generatedIdeas));

            // 2. Reflection Phase
            const reflectionResults = await this.agents[1].process(generatedIdeas, ideaId);
            await this.updateIdeaEntry(ideaId, 'reflection', JSON.stringify(reflectionResults));

            // 3. Ranking Phase
            const rankingResults = await this.agents[2].process(reflectionResults, ideaId);
            await this.updateIdeaEntry(ideaId, 'ranking', JSON.stringify(rankingResults));

            // 4. Evolution Phase
            const evolutionResults = await this.agents[3].process(rankingResults, ideaId);
            await this.updateIdeaEntry(ideaId, 'evolution', JSON.stringify(evolutionResults));

            // 5. Proximity Phase
            const proximityResults = await this.agents[4].process(evolutionResults, ideaId);
            await this.updateIdeaEntry(ideaId, 'proximity', JSON.stringify(proximityResults));

            // 6. Meta-review Phase
            const metaReviewResults = await this.agents[5].process(proximityResults, ideaId);
            await this.updateIdeaEntry(ideaId, 'meta_review', JSON.stringify(metaReviewResults));

            return {
                input,
                ideaId,
                results: metaReviewResults
            };
        } catch (error) {
            console.error('Error in supervisor process:', error);
            throw error;
        }
    }

    async createIdeaEntry(input) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO ideas (input, generated_ideas) VALUES (?, ?)',
                [input, '[]'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async updateIdeaEntry(ideaId, field, value) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE ideas SET ${field} = ? WHERE id = ?`,
                [value, ideaId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getHistory() {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM ideas ORDER BY created_at DESC LIMIT 10`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = { SupervisorAgent }; 