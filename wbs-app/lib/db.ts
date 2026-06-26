/**
 * DB 両対応レイヤー
 * - DATABASE_URL が設定されていれば PostgreSQL (Supabase) を使用（本番 / iPhone同期）
 * - 設定されていなければ ローカルSQLite を使用（設定不要・すぐ動く・テスト用）
 *
 * どちらの場合も postgres.js と同じ「タグ付きテンプレート」インターフェースを
 * 公開するため、APIルート側のコードは一切変更不要です。
 *   例:  const rows = await sql`SELECT * FROM tasks WHERE id = ${id}`
 */

import postgres from 'postgres'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'

// postgres.js と同じく行は緩い型で返す（呼び出し側で `as 型` してもらう）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlClient = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>

function createSqliteClient(): SqlClient {
  // better-sqlite3 は native モジュールのため、SQLiteモード時のみ読み込む
  // （DATABASE_URL を設定する本番/Vercel では一切ロードしない）
  const require = createRequire(import.meta.url)
  const Database = require('better-sqlite3')

  const DB_DIR = path.join(process.cwd(), '.data')
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

  const db = new Database(path.join(DB_DIR, 'wbs.db'))

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      progress INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      parent_task_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      due_date TEXT,
      actual_start_date TEXT,
      actual_end_date TEXT,
      estimated_hours REAL,
      actual_hours REAL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_todo_visible INTEGER NOT NULL DEFAULT 0,
      todo_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    let query = strings[0]
    for (let i = 0; i < values.length; i++) query += '?' + strings[i + 1]

    const params = values.map(v =>
      typeof v === 'boolean' ? (v ? 1 : 0) : v === undefined ? null : v
    )

    const head = query.trimStart().slice(0, 6).toUpperCase()
    const stmt = db.prepare(query)
    if (head === 'SELECT' || /RETURNING/i.test(query)) {
      return Promise.resolve(stmt.all(...params) as Record<string, unknown>[])
    }
    stmt.run(...params)
    return Promise.resolve([])
  }
}

let client: SqlClient

if (process.env.DATABASE_URL) {
  client = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  }) as unknown as SqlClient
} else {
  client = createSqliteClient()
}

export default client
