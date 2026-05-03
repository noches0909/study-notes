import { PrismaClient } from "@/generated/prisma/client" // 引入生成的客户端代码
import { PrismaPg } from "@prisma/adapter-pg" // 引入适配器
const pool = new PrismaPg({
  // 创建连接池
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({
  // 创建客户端
  adapter: pool,
})

export default prisma // 导出客户端实例
