import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import sql from '@/lib/db'
import { createToken, COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'すべての項目を入力してください' }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const id = randomUUID()
  await sql`INSERT INTO users (id, email, password, name) VALUES (${id}, ${email}, ${hashed}, ${name})`

  const token = await createToken(id)
  const jar = await cookies()
  jar.set(COOKIE, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })

  return NextResponse.json({ id, email, name }, { status: 201 })
}
