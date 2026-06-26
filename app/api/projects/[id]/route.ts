import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Project } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rows = await sql`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count,
      COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.id = ${id} AND p.user_id = ${session.userId}
    GROUP BY p.id
  ` as Project[]

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${session.userId}`
  const project = existing[0] as Project | undefined
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const now = new Date().toISOString()
  const patch = {
    name:        body.name        !== undefined ? body.name                  : project.name,
    description: body.description !== undefined ? (body.description || null) : project.description,
    start_date:  body.start_date  !== undefined ? (body.start_date || null)  : project.start_date,
    due_date:    body.due_date    !== undefined ? (body.due_date || null)    : project.due_date,
    status:      body.status      !== undefined ? body.status                : project.status,
    progress:    body.progress    !== undefined ? body.progress              : project.progress,
  }

  const [updated] = await sql`
    UPDATE projects SET
      name        = ${patch.name},
      description = ${patch.description},
      start_date  = ${patch.start_date},
      due_date    = ${patch.due_date},
      status      = ${patch.status},
      progress    = ${patch.progress},
      updated_at  = ${now}
    WHERE id = ${id} AND user_id = ${session.userId}
    RETURNING *
  ` as Project[]

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const deleted = await sql`DELETE FROM projects WHERE id = ${id} AND user_id = ${session.userId} RETURNING id`
  if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
