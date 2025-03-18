const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
    db.serialize(() => {
        // Create ideas table
        db.run(`CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input TEXT NOT NULL,
            generated_ideas TEXT NOT NULL,
            reflection TEXT,
            ranking TEXT,
            evolution TEXT,
            proximity TEXT,
            meta_review TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create history table
        db.run(`CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idea_id INTEGER,
            agent_type TEXT NOT NULL,
            action TEXT NOT NULL,
            result TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (idea_id) REFERENCES ideas(id)
        )`);
    });
}

module.exports = {
    db,
    initializeDatabase
}; 