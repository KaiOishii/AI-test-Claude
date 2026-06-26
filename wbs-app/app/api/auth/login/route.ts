import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import sql from '@/lib/db'
import { createToken, COOKIE } from '@/lib/auth'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`
  const user = rows[0] as (User & { password: string }) | undefined
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
  }

  const token = await createToken(user.id)
  const jar = await cookies()
  jar.set(COOKIE, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })

  return NextResponse.json({ id: user.id, email: user.email, name: user.name })
}
