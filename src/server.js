const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');
const { GenerationAgent } = require('./agents/generationAgent');
const { ReflectionAgent } = require('./agents/reflectionAgent');
const { RankingAgent } = require('./agents/rankingAgent');
const { EvolutionAgent } = require('./agents/evolutionAgent');
const { ProximityAgent } = require('./agents/proximityAgent');
const { MetaReviewAgent } = require('./agents/metaReviewAgent');
const { SupervisorAgent } = require('./agents/supervisorAgent');

const app = express();
const PORT = process.env.PORT || 3000;

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database
try {
    initializeDatabase();
    console.log('Database initialized successfully');
} catch (error) {
    console.error('Database initialization error:', error);
}

// Initialize agents
let supervisorAgent;
try {
    const generationAgent = new GenerationAgent();
    const reflectionAgent = new ReflectionAgent();
    const rankingAgent = new RankingAgent();
    const evolutionAgent = new EvolutionAgent();
    const proximityAgent = new ProximityAgent();
    const metaReviewAgent = new MetaReviewAgent();
    
    supervisorAgent = new SupervisorAgent([
        generationAgent,
        reflectionAgent,
        rankingAgent,
        evolutionAgent,
        proximityAgent,
        metaReviewAgent
    ]);
    console.log('Agents initialized successfully');
} catch (error) {
    console.error('Agent initialization error:', error);
}

// Routes
app.post('/api/process', async (req, res) => {
    try {
        console.log('Received process request:', req.body);
        const { input } = req.body;
        if (!input) {
            return res.status(400).json({ error: 'Input is required' });
        }

        const result = await supervisorAgent.process(input);
        console.log('Process completed successfully');
        res.json(result);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        console.log('Fetching history');
        const history = await supervisorAgent.getHistory();
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
}); 