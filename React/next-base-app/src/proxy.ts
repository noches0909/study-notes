import { NextRequest, NextResponse } from "next/server"
import Negotiator from "negotiator"
import { match } from "@formatjs/intl-localematcher"

import { locales, defaultLocale } from "@dict/index" // 导入项目支持的语言和默认语言

export default function proxy(req: NextRequest, res: NextResponse) {
  // 如果请求路径为根路径，则直接返回 首页不做任何处理
  if (req.nextUrl.pathname === "/") {
    return NextResponse.next()
  }
  //如果路径已经包含所支持的语言，则直接返回 例如 /zh/about /zs/home 等
  if (locales.some((locale) => req.nextUrl.pathname.startsWith(`/${locale}`))) {
    return NextResponse.next()
  }
  // 获取请求头
  const headers = {
    "accept-language": req.headers.get("accept-language") || "",
  }
  // 解析请求头
  const negotiator = new Negotiator({ headers })
  // 获取语言
  const language = negotiator.languages()
  //['zh-CN', 'zh', 'en-US', 'en', 'ja']  // 按优先级从高到低排序
  const lang = match(language, locales, defaultLocale)
  //language-浏览器支持的语言 locales-项目支持的语言 defaultLocale-项目默认语言
  // 匹配语言例如 zh-CN 则 lang 返回 zh en-US 则 lang 返回 en 如果没有匹配到则返回默认语言defaultLocale
  const pathname = req.nextUrl.pathname
  // 拼接语言
  req.nextUrl.pathname = `/${lang}${pathname}`
  // 重定向 例如用户访问的是/home 我们则读取语言后重定向到/zh/home 给它增加语言前缀
  return NextResponse.redirect(req.nextUrl)
}
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)", //跳过内部匹配路径
  ],
}
