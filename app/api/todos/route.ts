import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Todo } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT t.*, c.name as category_name
    FROM todos t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${session.userId} AND t.parent_id IS NULL
    ORDER BY t.sort_order ASC, t.created_at DESC
  ` as Todo[]

  const subtaskRows = await sql`
    SELECT t.*, c.name as category_name
    FROM todos t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${session.userId} AND t.parent_id IS NOT NULL
    ORDER BY t.sort_order ASC, t.created_at ASC
  ` as Todo[]

  const todos = rows.map(t => ({
    ...t,
    completed: !!t.completed,
    subtasks: subtaskRows
      .filter(s => s.parent_id === t.id)
      .map(s => ({ ...s, completed: !!s.completed })),
  }))

  return NextResponse.json(todos)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, memo, category_id, due_date, priority, recurring, sort_order, parent_id } = await req.json()
  if (!title) return NextResponse.json({ error: 'タイトルを入力してください' }, { status: 400 })

  const id = randomUUID()
  const [todo] = await sql`
    INSERT INTO todos (id, title, memo, user_id, category_id, due_date, priority, recurring, sort_order, parent_id)
    VALUES (${id}, ${title}, ${memo || null}, ${session.userId},
      ${category_id || null}, ${due_date || null},
      ${priority || 'none'}, ${recurring || 'none'},
      ${sort_order ?? 0}, ${parent_id || null})
    RETURNING *
  ` as Todo[]

  return NextResponse.json({ ...todo, completed: !!todo.completed }, { status: 201 })
}
