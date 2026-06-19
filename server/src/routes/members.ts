import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoomAccess } from '../middleware/auth'
import { AuthedRequest as RoomAuthedRequest } from '../types'

const router = Router()

// GET /api/rooms/:slug/members
router.get('/:slug/members', requireRoomAccess(), async (req: RoomAuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const room = await prisma.room.findUnique({ where: { slug }, select: { id: true } })
    if (!room) { res.status(404).json({ error: 'Room not found' }); return }

    const members = await prisma.roomMember.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ data: members })
  } catch (err) {
    next(err)
  }
})

// POST /api/rooms/:slug/members
router.post('/:slug/members', requireRoomAccess(), async (req: RoomAuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const { name, role } = req.body as { name?: string; role?: string }

    if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return }

    const room = await prisma.room.findUnique({ where: { slug }, select: { id: true } })
    if (!room) { res.status(404).json({ error: 'Room not found' }); return }

    const member = await prisma.roomMember.create({
      data: { roomId: room.id, name: name.trim(), role: role?.trim() || null },
    })
    res.status(201).json({ data: member })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/rooms/:slug/members/:id
router.patch('/:slug/members/:id', requireRoomAccess(), async (req: RoomAuthedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string
    const { name, role } = req.body as { name?: string; role?: string }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (role !== undefined) data.role = role.trim() || null

    const member = await prisma.roomMember.update({ where: { id }, data })
    res.json({ data: member })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/rooms/:slug/members/:id (leader only)
router.delete('/:slug/members/:id', requireRoomAccess('leader'), async (req: RoomAuthedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string
    await prisma.roomMember.delete({ where: { id } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export default router
