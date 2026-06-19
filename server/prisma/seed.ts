import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env before seeding')
  }

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash: await bcrypt.hash(password, 10) },
    create: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
    },
  })
  console.log('Admin:', admin.username)

  // Sample room for dev - no passwords set, admin must configure via dashboard
  const room = await prisma.room.upsert({
    where: { slug: 'lunch-event' },
    update: {},
    create: {
      slug: 'lunch-event',
      name: 'Lunch Event',
      description: 'Community lunch - Saturday',
      isActive: false,
      isArchived: false,
    },
  })
  console.log('Room:', room.name)

  await prisma.attendees.upsert({
    where: { roomId: room.id },
    update: {},
    create: { roomId: room.id, totalCount: 30, vegetarianCount: 5 },
  })

  const chicken = await prisma.ingredient.create({
    data: { roomId: room.id, name: 'Chicken', unit: 'kg', qtyNeeded: 10 },
  })
  const rice = await prisma.ingredient.create({
    data: { roomId: room.id, name: 'Rice', unit: 'kg', qtyNeeded: 5 },
  })
  const oil = await prisma.ingredient.create({
    data: { roomId: room.id, name: 'Oil', unit: 'L', qtyNeeded: 2 },
  })

  await prisma.dish.create({
    data: {
      roomId: room.id,
      name: 'Fried Chicken',
      responsiblePerson: 'Maria',
      dishIngredients: {
        create: [
          { ingredientId: chicken.id, qtyForDish: 8 },
          { ingredientId: oil.id, qtyForDish: 1.5 },
        ],
      },
    },
  })

  await prisma.dish.create({
    data: {
      roomId: room.id,
      name: 'Rice with Vegetables',
      responsiblePerson: 'Maria',
      dishIngredients: { create: [{ ingredientId: rice.id, qtyForDish: 5 }] },
    },
  })

  await prisma.dish.create({
    data: { roomId: room.id, name: 'Chocolate Cake', responsiblePerson: 'Peter' },
  })

  await prisma.assignment.createMany({
    data: [
      { ingredientId: chicken.id, personName: 'Maria', qtyCommitted: 5 },
      { ingredientId: chicken.id, personName: 'Peter', qtyCommitted: 3 },
      { ingredientId: rice.id, personName: 'Anna', qtyCommitted: 5 },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
