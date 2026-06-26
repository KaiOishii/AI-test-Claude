import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), '.data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const db = new Database(path.join(DB_DIR, 'todos.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    memo TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    user_id TEXT NOT NULL,
    category_id TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
`)

// Migrations: add new columns if they don't exist
const cols = (db.prepare('PRAGMA table_info(todos)').all() as { name: string }[]).map(c => c.name)
if (!cols.includes('priority'))   db.exec("ALTER TABLE todos ADD COLUMN priority TEXT NOT NULL DEFAULT 'none'")
if (!cols.includes('recurring'))  db.exec("ALTER TABLE todos ADD COLUMN recurring TEXT NOT NULL DEFAULT 'none'")
if (!cols.includes('sort_order')) db.exec("ALTER TABLE todos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
if (!cols.includes('parent_id'))  db.exec('ALTER TABLE todos ADD COLUMN parent_id TEXT')

export default db
