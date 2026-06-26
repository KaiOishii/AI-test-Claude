import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await sql`SELECT * FROM categories WHERE user_id = ${session.userId} ORDER BY name`
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'カテゴリ名を入力してください' }, { status: 400 })

  const id = randomUUID()
  const [category] = await sql`
    INSERT INTO categories (id, name, user_id) VALUES (${id}, ${name}, ${session.userId})
    RETURNING *
  `
  return NextResponse.json(category, { status: 201 })
}
