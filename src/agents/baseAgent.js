const { db } = require('../database');

class BaseAgent {
    constructor(name) {
        this.name = name;
    }

    async logAction(ideaId, action, result) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO history (idea_id, agent_type, action, result) VALUES (?, ?, ?, ?)',
                [ideaId, this.name, action, JSON.stringify(result)],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async process(input, ideaId) {
        throw new Error('Process method must be implemented by child class');
    }

    async getHistory(ideaId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM history WHERE idea_id = ? AND agent_type = ? ORDER BY created_at',
                [ideaId, this.name],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = BaseAgent; 