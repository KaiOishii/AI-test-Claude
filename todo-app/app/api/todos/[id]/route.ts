import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, session.userId)
  if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { title, memo, completed, category_id, due_date } = await req.json()
  db.prepare(`
    UPDATE todos SET
      title = COALESCE(?, title),
      memo = ?,
      completed = COALESCE(?, completed),
      category_id = ?,
      due_date = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(title || null, memo !== undefined ? memo : null, completed !== undefined ? (completed ? 1 : 0) : null, category_id !== undefined ? category_id : null, due_date !== undefined ? due_date : null, id, session.userId)

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, session.userId)
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
