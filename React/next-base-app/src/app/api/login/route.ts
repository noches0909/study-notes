import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const body = await request.json()
  if (body.admin === "admin" && body.password === "123456") {
    const cookieStroe = await cookies()
    cookieStroe.set("token", "123456789", {
      maxAge: 60 * 60 * 24 * 39, // 30天有效期
      httpOnly: true, // 只能在服务器端访问
    })
    return NextResponse.json({ code: 1, message: "登录成功" })
  } else {
    return NextResponse.json({ code: 0, message: "登录失败" })
  }
}

export async function GET() {
  const cookieStroe = await cookies()
  const token = cookieStroe.get("token")
  if (token && token.value === "123456789") {
    return NextResponse.json({ code: 1 })
  } else {
    return NextResponse.json({ code: 0 })
  }
}
