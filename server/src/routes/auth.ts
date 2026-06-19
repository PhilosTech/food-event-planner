import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { verifyPassword } from '../lib/password'
import { signAdminToken, signRoomToken } from '../lib/jwt'

const router = Router()

// POST /api/auth/admin/login
router.post('/admin/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string }
    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' })
      return
    }

    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const ok = await verifyPassword(password, admin.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = signAdminToken({ adminId: admin.id, role: 'admin' })
    res.json({ data: { token } })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/room/enter
router.post('/room/enter', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, password } = req.body as { slug?: string; password?: string }
    if (!slug || !password) {
      res.status(400).json({ error: 'slug and password are required' })
      return
    }

    const room = await prisma.room.findFirst({ where: { slug, isActive: true } })
    if (!room) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }

    let role: 'leader' | 'volunteer' | null = null

    if (room.leaderPasswordHash && await verifyPassword(password, room.leaderPasswordHash)) {
      role = 'leader'
    } else if (room.volunteerPasswordHash && await verifyPassword(password, room.volunteerPasswordHash)) {
      role = 'volunteer'
    }

    if (!role) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }

    const token = signRoomToken({ roomSlug: slug, role })
    res.json({ data: { token, role } })
  } catch (err) {
    next(err)
  }
})

export default router
