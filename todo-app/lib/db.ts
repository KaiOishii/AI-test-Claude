/**
 * DB 両対応レイヤー
 * - DATABASE_URL が設定されていれば PostgreSQL (Supabase) を使用（本番 / iPhone同期）
 * - 設定されていなければ ローカルSQLite を使用（設定不要・すぐ動く・テスト用）
 *
 * どちらの場合も postgres.js と同じ「タグ付きテンプレート」インターフェースを
 * 公開するため、APIルート側のコードは一切変更不要です。
 *   例:  const rows = await sql`SELECT * FROM todos WHERE id = ${id}`
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
      priority TEXT NOT NULL DEFAULT 'none',
      recurring TEXT NOT NULL DEFAULT 'none',
      sort_order INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `)

  // tasksテーブルのマイグレーション（旧バージョン互換）
  const cols = (db.prepare('PRAGMA table_info(todos)').all() as { name: string }[]).map(c => c.name)
  if (!cols.includes('priority'))   db.exec("ALTER TABLE todos ADD COLUMN priority TEXT NOT NULL DEFAULT 'none'")
  if (!cols.includes('recurring'))  db.exec("ALTER TABLE todos ADD COLUMN recurring TEXT NOT NULL DEFAULT 'none'")
  if (!cols.includes('sort_order')) db.exec("ALTER TABLE todos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
  if (!cols.includes('parent_id'))  db.exec('ALTER TABLE todos ADD COLUMN parent_id TEXT')

  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    let query = strings[0]
    for (let i = 0; i < values.length; i++) query += '?' + strings[i + 1]

    // boolean→0/1, undefined→null に正規化（better-sqlite3 互換）
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
  // PostgreSQL (Supabase)
  client = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  }) as unknown as SqlClient
} else {
  // ローカル SQLite
  client = createSqliteClient()
}

export default client
