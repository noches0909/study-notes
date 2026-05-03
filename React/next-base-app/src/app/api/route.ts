import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
    },
  })
  return NextResponse.json(user)
}

export async function PUT(request: NextRequest) {
  const { id, name, email } = await request.json()
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
    },
  })
  return NextResponse.json(user)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  await prisma.user.delete({
    where: { id },
  })
  return NextResponse.json({ message: "User deleted" })
}
