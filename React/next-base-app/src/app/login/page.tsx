"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const router = useRouter()
  const [admin, setAdmin] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = () => {
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ admin, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 1) {
          router.push("/home")
        } else {
          alert("登录失败")
        }
      })
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-secondary via-white to-secondary/60 px-4 text-foreground">
      <div className="relative isolate w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.45)] backdrop-blur">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.04),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(0,0,0,0.04),transparent_35%)]"
          aria-hidden
        />
        <div className="relative grid gap-8 p-8 sm:p-10">
          <header className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Account
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">欢迎登录</h1>
            <p className="text-sm text-muted-foreground">输入用户名和密码，开始你的探索之旅。</p>
          </header>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>用户名</span>
            <Input
              placeholder="输入用户名"
              autoComplete="username"
              required
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>密码</span>
            <Input
              type="password"
              placeholder="输入密码"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <Button className="w-full" onClick={handleLogin}>
            登录
          </Button>
        </div>
      </div>
    </main>
  )
}
