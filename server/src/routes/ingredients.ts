import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoomAccess } from '../middleware/auth'
import { AuthedRequest } from '../types'

const router = Router()

async function getRoom(slug: string) {
  return prisma.room.findUnique({ where: { slug }, select: { id: true } })
}

function sumCommitted(assignments: { qtyCommitted: number }[]): number {
  return assignments.reduce((sum, a) => sum + a.qtyCommitted, 0)
}

// GET /api/rooms/:slug/ingredients
router.get('/:slug/ingredients', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const ingredients = await prisma.ingredient.findMany({
      where: { roomId: room.id },
      include: { assignments: { select: { qtyCommitted: true } } },
      orderBy: { createdAt: 'asc' },
    })

    const data = ingredients.map(i => {
      const committed = sumCommitted(i.assignments)
      return { id: i.id, name: i.name, unit: i.unit, qtyNeeded: i.qtyNeeded, committed, remaining: i.qtyNeeded - committed, createdAt: i.createdAt }
    })

    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// POST /api/rooms/:slug/ingredients
router.post('/:slug/ingredients', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const { name, unit, qtyNeeded } = req.body as { name?: string; unit?: string; qtyNeeded?: number }

    if (!name || !unit || qtyNeeded === undefined) {
      res.status(400).json({ error: 'name, unit, and qtyNeeded are required' })
      return
    }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const ingredient = await prisma.ingredient.create({
      data: { roomId: room.id, name, unit, qtyNeeded },
    })

    res.status(201).json({
      data: { id: ingredient.id, name: ingredient.name, unit: ingredient.unit, qtyNeeded: ingredient.qtyNeeded, committed: 0, remaining: ingredient.qtyNeeded, createdAt: ingredient.createdAt },
    })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/rooms/:slug/ingredients/:id
router.patch('/:slug/ingredients/:id', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const id = req.params['id'] as string
    const { name, unit, qtyNeeded } = req.body as { name?: string; unit?: string; qtyNeeded?: number }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const existing = await prisma.ingredient.findFirst({ where: { id, roomId: room.id }, select: { id: true } })
    if (!existing) {
      res.status(404).json({ error: 'Ingredient not found' })
      return
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (unit !== undefined) updateData.unit = unit
    if (qtyNeeded !== undefined) updateData.qtyNeeded = qtyNeeded

    const updated = await prisma.ingredient.update({
      where: { id },
      data: updateData,
      include: { assignments: { select: { qtyCommitted: true } } },
    })

    const committed = sumCommitted(updated.assignments)
    res.json({
      data: { id: updated.id, name: updated.name, unit: updated.unit, qtyNeeded: updated.qtyNeeded, committed, remaining: updated.qtyNeeded - committed, createdAt: updated.createdAt },
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/rooms/:slug/ingredients/:id
router.delete('/:slug/ingredients/:id', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const id = req.params['id'] as string

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const existing = await prisma.ingredient.findFirst({ where: { id, roomId: room.id }, select: { id: true } })
    if (!existing) {
      res.status(404).json({ error: 'Ingredient not found' })
      return
    }

    await prisma.ingredient.delete({ where: { id } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export default router
