import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoomAccess } from '../middleware/auth'
import { AuthedRequest } from '../types'

const router = Router()

async function getRoom(slug: string) {
  return prisma.room.findUnique({ where: { slug }, select: { id: true } })
}

// GET /api/rooms/:slug/dishes
router.get('/:slug/dishes', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const dishes = await prisma.dish.findMany({
      where: { roomId: room.id },
      include: {
        dishIngredients: {
          include: {
            ingredient: {
              include: {
                assignments: { select: { qtyCommitted: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const enriched = dishes.map(dish => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      responsiblePerson: dish.responsiblePerson,
      createdAt: dish.createdAt,
      dishIngredients: dish.dishIngredients.map(di => {
        const committed = di.ingredient.assignments.reduce(
          (sum: number, a: { qtyCommitted: number }) => sum + a.qtyCommitted,
          0
        )
        return {
          id: di.id,
          qtyForDish: di.qtyForDish,
          ingredient: {
            id: di.ingredient.id,
            name: di.ingredient.name,
            unit: di.ingredient.unit,
            qtyNeeded: di.ingredient.qtyNeeded,
            committed,
            remaining: di.ingredient.qtyNeeded - committed,
          },
        }
      }),
    }))

    res.json({ data: enriched })
  } catch (err) {
    next(err)
  }
})

// POST /api/rooms/:slug/dishes
router.post('/:slug/dishes', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const { name, description, responsiblePerson } = req.body as {
      name?: string
      description?: string
      responsiblePerson?: string
    }

    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const dish = await prisma.dish.create({
      data: { roomId: room.id, name, description, responsiblePerson },
    })

    res.status(201).json({ data: dish })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/rooms/:slug/dishes/:id
router.patch('/:slug/dishes/:id', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const id = req.params['id'] as string
    const { name, description, responsiblePerson } = req.body as {
      name?: string
      description?: string
      responsiblePerson?: string
    }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const existing = await prisma.dish.findFirst({ where: { id, roomId: room.id }, select: { id: true } })
    if (!existing) {
      res.status(404).json({ error: 'Dish not found' })
      return
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (responsiblePerson !== undefined) updateData.responsiblePerson = responsiblePerson

    const dish = await prisma.dish.update({ where: { id }, data: updateData })
    res.json({ data: dish })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/rooms/:slug/dishes/:id
router.delete('/:slug/dishes/:id', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const id = req.params['id'] as string

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const existing = await prisma.dish.findFirst({ where: { id, roomId: room.id }, select: { id: true } })
    if (!existing) {
      res.status(404).json({ error: 'Dish not found' })
      return
    }

    await prisma.dish.delete({ where: { id } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

// POST /api/rooms/:slug/dishes/:dishId/ingredients
router.post('/:slug/dishes/:dishId/ingredients', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const dishId = req.params['dishId'] as string
    const { ingredientId, qtyForDish } = req.body as { ingredientId?: string; qtyForDish?: number }

    if (!ingredientId || qtyForDish === undefined) {
      res.status(400).json({ error: 'ingredientId and qtyForDish are required' })
      return
    }

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const dish = await prisma.dish.findFirst({ where: { id: dishId, roomId: room.id }, select: { id: true } })
    if (!dish) {
      res.status(404).json({ error: 'Dish not found' })
      return
    }

    const ingredient = await prisma.ingredient.findFirst({ where: { id: ingredientId, roomId: room.id }, select: { id: true } })
    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found in this room' })
      return
    }

    const dishIngredient = await prisma.dishIngredient.upsert({
      where: { dishId_ingredientId: { dishId, ingredientId } },
      update: { qtyForDish },
      create: { dishId, ingredientId, qtyForDish },
    })

    res.json({ data: dishIngredient })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/rooms/:slug/dishes/:dishId/ingredients/:ingredientId
router.delete('/:slug/dishes/:dishId/ingredients/:ingredientId', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const dishId = req.params['dishId'] as string
    const ingredientId = req.params['ingredientId'] as string

    const room = await getRoom(slug)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const dish = await prisma.dish.findFirst({ where: { id: dishId, roomId: room.id }, select: { id: true } })
    if (!dish) {
      res.status(404).json({ error: 'Dish not found' })
      return
    }

    await prisma.dishIngredient.delete({
      where: { dishId_ingredientId: { dishId, ingredientId } },
    })

    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export default router
