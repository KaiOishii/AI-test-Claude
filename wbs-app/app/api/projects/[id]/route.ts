import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Project } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = db.prepare(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count,
      COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.id = ? AND p.user_id = ?
    GROUP BY p.id
  `).get(id, session.userId) as Project | undefined

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, description, start_date, due_date, status, progress } = await req.json()

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      start_date = COALESCE(?, start_date),
      due_date = COALESCE(?, due_date),
      status = COALESCE(?, status),
      progress = COALESCE(?, progress),
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    name ?? null, description !== undefined ? (description || null) : null,
    start_date !== undefined ? (start_date || null) : null,
    due_date !== undefined ? (due_date || null) : null,
    status ?? null, progress ?? null, id, session.userId
  )

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(id, session.userId)
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
