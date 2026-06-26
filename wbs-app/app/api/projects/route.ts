import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { Project } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = db.prepare(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_task_count,
      COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
      COALESCE(SUM(t.actual_hours), 0) as total_actual_hours
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all(session.userId) as Project[]

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, start_date, due_date, status } = await req.json()
  if (!name) return NextResponse.json({ error: 'プロジェクト名を入力してください' }, { status: 400 })

  const id = randomUUID()
  db.prepare(`
    INSERT INTO projects (id, user_id, name, description, start_date, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, session.userId, name, description || null, start_date || null, due_date || null, status || 'active')

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project
  return NextResponse.json(project, { status: 201 })
}
