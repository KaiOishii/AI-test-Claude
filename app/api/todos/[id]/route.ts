import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Todo } from '@/lib/types'

function nextDueDate(date: string, recurring: string): string {
  const d = new Date(date)
  if (recurring === 'daily')   d.setDate(d.getDate() + 1)
  if (recurring === 'weekly')  d.setDate(d.getDate() + 7)
  if (recurring === 'monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await sql`SELECT * FROM todos WHERE id = ${id} AND user_id = ${session.userId}`
  const todo = existing[0] as Todo | undefined
  if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, memo, completed, category_id, due_date, priority, recurring, sort_order, parent_id } = body

  const now = new Date().toISOString()
  const patch = {
    title:       title       !== undefined ? title                  : todo.title,
    memo:        memo        !== undefined ? (memo || null)         : todo.memo,
    completed:   completed   !== undefined ? !!completed            : !!todo.completed,
    category_id: category_id !== undefined ? (category_id || null) : todo.category_id,
    due_date:    due_date    !== undefined ? (due_date || null)     : todo.due_date,
    priority:    priority    !== undefined ? priority               : todo.priority,
    recurring:   recurring   !== undefined ? recurring              : todo.recurring,
    sort_order:  sort_order  !== undefined ? sort_order             : todo.sort_order,
    parent_id:   parent_id   !== undefined ? (parent_id || null)   : todo.parent_id,
  }

  const [updated] = await sql`
    UPDATE todos SET
      title       = ${patch.title},
      memo        = ${patch.memo},
      completed   = ${patch.completed},
      category_id = ${patch.category_id},
      due_date    = ${patch.due_date},
      priority    = ${patch.priority},
      recurring   = ${patch.recurring},
      sort_order  = ${patch.sort_order},
      parent_id   = ${patch.parent_id},
      updated_at  = ${now}
    WHERE id = ${id} AND user_id = ${session.userId}
    RETURNING *
  ` as Todo[]

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (completed === true && todo.recurring !== 'none' && todo.due_date) {
    const nextDate = nextDueDate(todo.due_date, todo.recurring)
    const nextId = randomUUID()
    await sql`
      INSERT INTO todos (id, title, memo, user_id, category_id, due_date, priority, recurring, sort_order)
      VALUES (${nextId}, ${todo.title}, ${todo.memo}, ${session.userId},
              ${todo.category_id}, ${nextDate}, ${todo.priority}, ${todo.recurring}, 0)
    `
  }

  return NextResponse.json({ ...updated, completed: !!updated.completed })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM todos WHERE parent_id = ${id} AND user_id = ${session.userId}`
  const deleted = await sql`DELETE FROM todos WHERE id = ${id} AND user_id = ${session.userId} RETURNING id`
  if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
