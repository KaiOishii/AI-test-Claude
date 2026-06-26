import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import sql from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
  }

  const users = await sql`SELECT id, password FROM users WHERE email = ${email}`
  const user = users[0] as { id: string; password: string } | undefined
  if (!user) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
  }

  const valid = await compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
  }

  const token = await createToken(user.id)
  const res = NextResponse.json({ success: true })
  res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
  return res
}
