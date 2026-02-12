import 'dotenv/config'
import { PrismaClient } from './generated/prisma'

// Standard-PrismaClient ohne Adapter – funktioniert mit Neon-Pooler auf Vercel
// (WebSocket-Adapter hat "mask is not a function", HTTP-Adapter hat DateTime-Bug)
export const prisma = new PrismaClient()
