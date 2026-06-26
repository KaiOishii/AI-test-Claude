import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'カテゴリ名を入力してください' }, { status: 400 })

  const result = db.prepare('UPDATE categories SET name = ? WHERE id = ? AND user_id = ?').run(name, id, session.userId)
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, session.userId)
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
