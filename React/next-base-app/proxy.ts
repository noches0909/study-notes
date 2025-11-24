import { NextRequest, NextResponse, ProxyConfig } from "next/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function proxy(request: NextRequest) {
  // 处理跨域
  const response = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  const { pathname } = request.nextUrl

  // 处理 /home 开头的请求
  if (pathname.startsWith("/home")) {
    return NextResponse.next()
  }
}

// 匹配app下的子路径，匹配到的会进入到 proxy 函数中处理
export const config: ProxyConfig = {
  // ['^(/home/.*)$'] 支持正则写法
  // matcher: ["/home/:path*", "/api/:path*"],
  matcher: [
    {
      source: "/home/:path*",
      // has表示满足条件才能进入 proxy 函数处理
      has: [
        {
          // type有三个值：header、cookie、query
          type: "header",
          key: "x-proxy-header",
          value: "my-proxy",
        },
      ],
      // missing表示不满足条件才能进入 proxy 函数处理
      missing: [],
    },
  ],
}
