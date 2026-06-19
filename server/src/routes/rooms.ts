import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/password'
import { requireAdmin } from '../middleware/auth'
import { AuthedRequest } from '../types'

const router = Router()

const ROOM_PUBLIC_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
} as const

const ROOM_ADMIN_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  isActive: true,
  isArchived: true,
  leaderPassword: true,
  volunteerPassword: true,
  createdAt: true,
} as const

// GET /api/rooms/active (public)
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: ROOM_PUBLIC_SELECT,
    })
    res.json({ data: rooms })
  } catch (err) {
    next(err)
  }
})

// GET /api/rooms (admin)
router.get('/', requireAdmin, async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({
      select: ROOM_ADMIN_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: rooms })
  } catch (err) {
    next(err)
  }
})

// POST /api/rooms (admin)
router.post('/', requireAdmin, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, slug, leaderPassword, volunteerPassword } = req.body as {
      name?: string
      description?: string
      slug?: string
      leaderPassword?: string
      volunteerPassword?: string
    }

    if (!name || !slug) {
      res.status(400).json({ error: 'name and slug are required' })
      return
    }

    const [leaderPasswordHash, volunteerPasswordHash] = await Promise.all([
      leaderPassword ? hashPassword(leaderPassword) : Promise.resolve(null),
      volunteerPassword ? hashPassword(volunteerPassword) : Promise.resolve(null),
    ])

    const room = await prisma.room.create({
      data: { name, description, slug, leaderPassword: leaderPassword ?? null, leaderPasswordHash, volunteerPassword: volunteerPassword ?? null, volunteerPasswordHash },
      select: ROOM_ADMIN_SELECT,
    })

    res.status(201).json({ data: room })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/rooms/:slug (admin)
router.patch('/:slug', requireAdmin, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const { name, description, isActive, isArchived, leaderPassword, volunteerPassword } = req.body as {
      name?: string
      description?: string
      isActive?: boolean
      isArchived?: boolean
      leaderPassword?: string
      volunteerPassword?: string
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    if (isArchived !== undefined) {
      updateData.isArchived = isArchived
      if (isArchived) updateData.isActive = false
    }
    if (leaderPassword) {
      updateData.leaderPassword = leaderPassword
      updateData.leaderPasswordHash = await hashPassword(leaderPassword)
    }
    if (volunteerPassword) {
      updateData.volunteerPassword = volunteerPassword
      updateData.volunteerPasswordHash = await hashPassword(volunteerPassword)
    }

    const room = await prisma.room.update({
      where: { slug },
      data: updateData,
      select: ROOM_ADMIN_SELECT,
    })

    res.json({ data: room })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/rooms/:slug (admin)
router.delete('/:slug', requireAdmin, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const room = await prisma.room.findUnique({ where: { slug }, select: { isActive: true } })
    if (room?.isActive) {
      res.status(400).json({ error: 'Cannot delete an active room. Deactivate it first.' })
      return
    }
    await prisma.room.delete({ where: { slug } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export default router
