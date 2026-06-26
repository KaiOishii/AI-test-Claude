import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name').all(session.userId)
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'カテゴリ名を入力してください' }, { status: 400 })

  const id = randomUUID()
  db.prepare('INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)').run(id, name, session.userId)

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  return NextResponse.json(category, { status: 201 })
}
