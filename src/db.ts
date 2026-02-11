import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { PrismaNeonHTTP } from '@prisma/adapter-neon'
import { PrismaClient } from './generated/prisma'

// HTTP-Adapter für Vercel/Serverless (kein WebSocket/ws nötig)
const sql = neon(process.env.DATABASE_URL!)
const adapter = new PrismaNeonHTTP(sql)
export const prisma = new PrismaClient({ adapter })
