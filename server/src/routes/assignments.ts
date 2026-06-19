import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoomAccess } from '../middleware/auth'
import { AuthedRequest } from '../types'

const router = Router()

const INGREDIENT_SELECT = { id: true, name: true, unit: true } as const

async function getRoom(slug: string) {
  return prisma.room.findUnique({ where: { slug }, select: { id: true } })
}

// GET /api/rooms/:slug/assignments
router.get('/:slug/assignments', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const assignments = await prisma.assignment.findMany({
      where: { ingredient: { roomId: room.id } },
      include: { ingredient: { select: INGREDIENT_SELECT } },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ data: assignments })
  } catch (err) {
    next(err)
  }
})

// POST /api/rooms/:slug/assignments
router.post('/:slug/assignments', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const { ingredientId, personName, qtyCommitted } = req.body as {
      ingredientId?: string
      personName?: string
      qtyCommitted?: number
    }

    if (!ingredientId || !personName || qtyCommitted === undefined) {
      res.status(400).json({ error: 'ingredientId, personName, and qtyCommitted are required' })
      return
    }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const ingredient = await prisma.ingredient.findFirst({ where: { id: ingredientId, roomId: room.id }, select: { id: true } })
    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found in this room' })
      return
    }

    const assignment = await prisma.assignment.create({
      data: { ingredientId, personName, qtyCommitted },
      include: { ingredient: { select: INGREDIENT_SELECT } },
    })

    res.status(201).json({ data: assignment })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/rooms/:slug/assignments/:id
router.patch('/:slug/assignments/:id', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const id = req.params['id'] as string
    const { personName, qtyCommitted } = req.body as { personName?: string; qtyCommitted?: number }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const existing = await prisma.assignment.findFirst({
      where: { id, ingredient: { roomId: room.id } },
      select: { id: true },
    })
    if (!existing) {
      res.status(404).json({ error: 'Assignment not found' })
      return
    }

    const updateData: Record<string, unknown> = {}
    if (personName !== undefined) updateData.personName = personName
    if (qtyCommitted !== undefined) updateData.qtyCommitted = qtyCommitted

    const assignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: { ingredient: { select: INGREDIENT_SELECT } },
    })

    res.json({ data: assignment })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/rooms/:slug/assignments/:id
router.delete('/:slug/assignments/:id', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const id = req.params['id'] as string

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const existing = await prisma.assignment.findFirst({
      where: { id, ingredient: { roomId: room.id } },
      select: { id: true },
    })
    if (!existing) {
      res.status(404).json({ error: 'Assignment not found' })
      return
    }

    await prisma.assignment.delete({ where: { id } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export default router
