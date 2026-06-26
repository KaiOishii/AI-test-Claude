import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'カテゴリ名を入力してください' }, { status: 400 })

  const updated = await sql`
    UPDATE categories SET name = ${name} WHERE id = ${id} AND user_id = ${session.userId}
    RETURNING *
  `
  if (updated.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const deleted = await sql`DELETE FROM categories WHERE id = ${id} AND user_id = ${session.userId} RETURNING id`
  if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
