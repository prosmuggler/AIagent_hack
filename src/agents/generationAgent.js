const BaseAgent = require('./baseAgent');
const natural = require('natural');

class GenerationAgent extends BaseAgent {
    constructor() {
        super('generation');
        this.tokenizer = new natural.WordTokenizer();
    }

    async process(input, ideaId) {
        const tokens = this.tokenizer.tokenize(input.toLowerCase());
        const ideas = this.generateIdeas(tokens);
        
        await this.logAction(ideaId, 'generate', ideas);
        return ideas;
    }

    generateIdeas(tokens) {
        // Simple idea generation based on keywords
        const ideas = [];
        const keywordIdeas = {
            'energy': ['solar panels', 'wind turbines', 'hydroelectric power', 'geothermal energy'],
            'urban': ['vertical gardens', 'green roofs', 'smart city infrastructure', 'public transportation'],
            'renewable': ['solar power', 'wind energy', 'biomass', 'tidal power'],
            'sustainable': ['recycling programs', 'composting', 'energy-efficient buildings', 'water conservation'],
            'technology': ['smart grids', 'energy storage systems', 'AI-powered optimization', 'IoT monitoring']
        };

        tokens.forEach(token => {
            if (keywordIdeas[token]) {
                ideas.push(...keywordIdeas[token]);
            }
        });

        // Remove duplicates and return unique ideas
        return [...new Set(ideas)];
    }
}

module.exports = { GenerationAgent }; 