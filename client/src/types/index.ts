export interface Room {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  isArchived: boolean
  leaderPassword?: string
  volunteerPassword?: string
  createdAt?: string
}

export interface RoomMember {
  id: string
  name: string
  role?: string
  createdAt?: string
}

export interface Attendees {
  totalCount: number
  vegetarianCount: number
}

export interface DishIngredientEntry {
  id: string
  qtyForDish: number
  ingredient: {
    id: string
    name: string
    unit: string
    qtyNeeded: number
    committed: number
    remaining: number
  }
}

export interface Dish {
  id: string
  name: string
  description?: string
  responsiblePerson?: string
  createdAt?: string
  dishIngredients?: DishIngredientEntry[]
}

export interface Ingredient {
  id: string
  name: string
  unit: string
  qtyNeeded: number
  committed: number
  remaining: number
  createdAt?: string
}

export interface AssignmentIngredient {
  id: string
  name: string
  unit: string
}

export interface Assignment {
  id: string
  personName: string
  qtyCommitted: number
  ingredientId: string
  ingredient: AssignmentIngredient
  createdAt?: string
}

// Alias for backward compatibility
export type IngredientWithStats = Ingredient
