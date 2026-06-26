import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const todos = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM todos t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(session.userId)

  return NextResponse.json(todos)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, memo, category_id, due_date } = await req.json()
  if (!title) return NextResponse.json({ error: 'タイトルを入力してください' }, { status: 400 })

  const id = randomUUID()
  db.prepare(`
    INSERT INTO todos (id, title, memo, user_id, category_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, memo || null, session.userId, category_id || null, due_date || null)

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  return NextResponse.json(todo, { status: 201 })
}
