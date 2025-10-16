import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

// Initialize the database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
}

// Initialize on module load
initializeDatabase();

export default db;

