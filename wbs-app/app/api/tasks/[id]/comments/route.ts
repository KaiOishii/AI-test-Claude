import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { TaskComment } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const comments = await sql`
    SELECT c.*, u.name as user_name FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ${id}
    ORDER BY c.created_at ASC
  ` as TaskComment[]

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()
  if (!body) return NextResponse.json({ error: 'コメントを入力してください' }, { status: 400 })

  const commentId = randomUUID()
  const [comment] = await sql`
    INSERT INTO task_comments (id, task_id, user_id, body)
    VALUES (${commentId}, ${id}, ${session.userId}, ${body})
    RETURNING *
  ` as TaskComment[]

  const [withUser] = await sql`
    SELECT c.*, u.name as user_name FROM task_comments c
    JOIN users u ON c.user_id = u.id WHERE c.id = ${comment.id}
  ` as TaskComment[]

  return NextResponse.json(withUser, { status: 201 })
}
