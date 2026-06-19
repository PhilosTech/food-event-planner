import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoomAccess } from '../middleware/auth'
import { AuthedRequest } from '../types'

const router = Router()

// GET /api/rooms/:slug/attendees
router.get('/:slug/attendees', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string

    const room = await prisma.room.findUnique({
      where: { slug },
      include: { attendees: true },
    })

    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const attendees = room.attendees ?? { totalCount: 0, vegetarianCount: 0 }
    res.json({ data: { totalCount: attendees.totalCount, vegetarianCount: attendees.vegetarianCount } })
  } catch (err) {
    next(err)
  }
})

// PUT /api/rooms/:slug/attendees
router.put('/:slug/attendees', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const { totalCount, vegetarianCount } = req.body as { totalCount?: number; vegetarianCount?: number }

    if (totalCount === undefined || vegetarianCount === undefined) {
      res.status(400).json({ error: 'totalCount and vegetarianCount are required' })
      return
    }

    const room = await prisma.room.findUnique({ where: { slug }, select: { id: true } })
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const attendees = await prisma.attendees.upsert({
      where: { roomId: room.id },
      update: { totalCount, vegetarianCount },
      create: { roomId: room.id, totalCount, vegetarianCount },
    })

    res.json({ data: { totalCount: attendees.totalCount, vegetarianCount: attendees.vegetarianCount } })
  } catch (err) {
    next(err)
  }
})

export default router
