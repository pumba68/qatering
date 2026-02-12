import 'dotenv/config'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from './generated/prisma'
import ws from 'ws'

// WebSocket-Adapter (PrismaNeonHTTP hat DateTime-Bug bei createdAt/updatedAt)
neonConfig.webSocketConstructor = ws
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaNeon(pool)
export const prisma = new PrismaClient({ adapter })
