import { NextRequest, NextResponse } from "next/server"

// 如果涉及到动态路由，这里有第二个参数params，文件名也需要改成前端一样的[id]
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams
  const id = query.get("id")
  const name = query.get("name")
  console.log(id, name)
  return NextResponse.json({ message: "GET请求" })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // const body = await request.formData()
  // const body = await request.text()
  // const body = await request.arrayBuffer()
  // const body = await request.blob()
  console.log(body)
  return NextResponse.json({ message: "Post请求" })
}
