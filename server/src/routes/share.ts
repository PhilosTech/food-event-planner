import { Router, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoomAccess } from '../middleware/auth'
import {
  formatMissingOnly,
  formatIngredientsList,
  formatAssignmentsList,
  formatDishesList,
  formatMembersList,
  formatFullOverview,
} from '../lib/share'
import { AuthedRequest } from '../types'

const router = Router()

// GET /api/rooms/:slug/share?type=missing|ingredients|assignments|dishes|members|full
router.get('/:slug/share', requireRoomAccess(), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params['slug'] as string
    const type = (req.query['type'] as string) ?? 'missing'

    const room = await prisma.room.findUnique({
      where: { slug },
      include: {
        dishes: { orderBy: { createdAt: 'asc' } },
        ingredients: {
          include: { assignments: true },
          orderBy: { createdAt: 'asc' },
        },
        members: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    let text: string
    switch (type) {
      case 'ingredients':
        text = formatIngredientsList(room.name, room.ingredients)
        break
      case 'assignments':
        text = formatAssignmentsList(room.name, room.ingredients)
        break
      case 'dishes':
        text = formatDishesList(room.name, room.dishes)
        break
      case 'members':
        text = formatMembersList(room.name, room.members)
        break
      case 'full':
        text = formatFullOverview(room.name, room.dishes, room.ingredients, room.members)
        break
      default:
        text = formatMissingOnly(room.name, room.ingredients)
    }

    res.json({ data: { text } })
  } catch (err) {
    next(err)
  }
})

export default router
