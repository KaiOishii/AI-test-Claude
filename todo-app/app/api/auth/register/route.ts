import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: '全ての項目を入力してください' }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 409 })
  }

  const hashed = await hash(password, 10)
  const id = randomUUID()
  await sql`INSERT INTO users (id, email, password, name) VALUES (${id}, ${email}, ${hashed}, ${name})`

  const token = await createToken(id)
  const res = NextResponse.json({ success: true })
  res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
  return res
}
