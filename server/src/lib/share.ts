import { Ingredient, Assignment, Dish, RoomMember } from '@prisma/client'

type IngredientWithAssignments = Ingredient & { assignments: Assignment[] }

function computeCommitted(ingredient: IngredientWithAssignments) {
  return ingredient.assignments.reduce((sum, a) => sum + a.qtyCommitted, 0)
}

export function formatMissingOnly(roomName: string, ingredients: IngredientWithAssignments[]): string {
  const missing = ingredients.filter(i => computeCommitted(i) < i.qtyNeeded)
  if (missing.length === 0) return `${roomName} - All ingredients covered! ✓`
  const lines = missing.map(i => {
    const remaining = i.qtyNeeded - computeCommitted(i)
    return `- ${i.name}: need ${remaining} ${i.unit} more`
  })
  return `${roomName} - Still needed:\n${lines.join('\n')}`
}

export function formatIngredientsList(roomName: string, ingredients: IngredientWithAssignments[]): string {
  if (ingredients.length === 0) return `${roomName} - No ingredients added yet`
  const lines = ingredients.map(i => {
    const committed = computeCommitted(i)
    const remaining = i.qtyNeeded - committed
    const status = remaining <= 0 ? '✓' : `${remaining} ${i.unit} still needed`
    return `- ${i.name}: ${i.qtyNeeded} ${i.unit} total (${status})`
  })
  return `${roomName} - Ingredients:\n${lines.join('\n')}`
}

export function formatAssignmentsList(roomName: string, ingredients: IngredientWithAssignments[]): string {
  const byPerson: Record<string, string[]> = {}
  for (const i of ingredients) {
    for (const a of i.assignments) {
      if (!byPerson[a.personName]) byPerson[a.personName] = []
      byPerson[a.personName].push(`${i.name} x${a.qtyCommitted} ${i.unit}`)
    }
  }
  const people = Object.entries(byPerson)
  if (people.length === 0) return `${roomName} - No assignments yet`
  const lines = people.map(([person, items]) => `- ${person}: ${items.join(', ')}`)
  return `${roomName} - Who brings what:\n${lines.join('\n')}`
}

export function formatDishesList(roomName: string, dishes: Dish[]): string {
  if (dishes.length === 0) return `${roomName} - No dishes added yet`
  const lines = dishes.map(d => {
    const person = d.responsiblePerson ? ` - ${d.responsiblePerson}` : ''
    return `- ${d.name}${person}`
  })
  return `${roomName} - Dishes:\n${lines.join('\n')}`
}

export function formatMembersList(roomName: string, members: RoomMember[]): string {
  if (members.length === 0) return `${roomName} - No team members yet`
  const lines = members.map(m => `- ${m.name}${m.role ? `: ${m.role}` : ''}`)
  return `${roomName} - Team:\n${lines.join('\n')}`
}

export function formatFullOverview(
  roomName: string,
  dishes: Dish[],
  ingredients: IngredientWithAssignments[],
  members: RoomMember[]
): string {
  const sections: string[] = [`${roomName} - Full overview`]

  if (members.length > 0) {
    sections.push('\nTeam:')
    for (const m of members) {
      sections.push(`- ${m.name}${m.role ? `: ${m.role}` : ''}`)
    }
  }

  sections.push('\nDishes:')
  if (dishes.length === 0) {
    sections.push('  (none yet)')
  } else {
    for (const d of dishes) {
      sections.push(`- ${d.name}${d.responsiblePerson ? ` - ${d.responsiblePerson}` : ''}`)
    }
  }

  sections.push('\nIngredients:')
  if (ingredients.length === 0) {
    sections.push('  (none yet)')
  } else {
    for (const i of ingredients) {
      const committed = computeCommitted(i)
      const remaining = i.qtyNeeded - committed
      sections.push(`- ${i.name}: ${i.qtyNeeded} ${i.unit} needed${remaining > 0 ? `, ${remaining} still missing` : ' ✓'}`)
    }
  }

  const byPerson: Record<string, string[]> = {}
  for (const i of ingredients) {
    for (const a of i.assignments) {
      if (!byPerson[a.personName]) byPerson[a.personName] = []
      byPerson[a.personName].push(`${i.name} x${a.qtyCommitted} ${i.unit}`)
    }
  }

  sections.push('\nWho brings what:')
  const people = Object.entries(byPerson)
  if (people.length === 0) {
    sections.push('  (no assignments yet)')
  } else {
    for (const [person, items] of people) {
      sections.push(`- ${person}: ${items.join(', ')}`)
    }
  }

  return sections.join('\n')
}
