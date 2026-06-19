import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import roomsRoutes from './routes/rooms'
import dishesRoutes from './routes/dishes'
import ingredientsRoutes from './routes/ingredients'
import assignmentsRoutes from './routes/assignments'
import attendeesRoutes from './routes/attendees'
import shareRoutes from './routes/share'
import membersRoutes from './routes/members'

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) return
  const existing = await prisma.admin.findUnique({ where: { username } })
  if (!existing) {
    await prisma.admin.create({
      data: { username, passwordHash: await bcrypt.hash(password, 10) },
    })
    console.log(`Admin "${username}" created`)
  }
}

const app = express()
const PORT = process.env.PORT ?? 3001

const clientUrl = (process.env.CLIENT_URL ?? 'http://localhost:5173').replace(/\/$/, '')
app.use(cors({ origin: clientUrl }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomsRoutes)
app.use('/api/rooms', dishesRoutes)
app.use('/api/rooms', ingredientsRoutes)
app.use('/api/rooms', assignmentsRoutes)
app.use('/api/rooms', attendeesRoutes)
app.use('/api/rooms', shareRoutes)
app.use('/api/rooms', membersRoutes)

app.use(errorHandler)

app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`)
  await ensureAdmin()
})
