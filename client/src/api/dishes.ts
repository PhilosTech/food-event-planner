import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiWithRoomToken } from './client'
import type { Dish } from '../types'

export function useDishes(slug: string) {
  return useQuery({
    queryKey: ['dishes', slug],
    queryFn: async () => {
      const res = await apiWithRoomToken(slug).get<{ data: Dish[] }>(`/api/rooms/${slug}/dishes`)
      return res.data.data
    },
    enabled: !!slug,
  })
}

export function useCreateDish(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; responsiblePerson?: string }) => {
      const res = await apiWithRoomToken(slug).post<{ data: Dish }>(`/api/rooms/${slug}/dishes`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dishes', slug] }),
  })
}

export function useUpdateDish(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; responsiblePerson?: string }) => {
      const res = await apiWithRoomToken(slug).patch<{ data: Dish }>(`/api/rooms/${slug}/dishes/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dishes', slug] }),
  })
}

export function useDeleteDish(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiWithRoomToken(slug).delete(`/api/rooms/${slug}/dishes/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dishes', slug] }),
  })
}

export function useLinkIngredient(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ dishId, ingredientId, qtyForDish }: { dishId: string; ingredientId: string; qtyForDish: number }) => {
      const res = await apiWithRoomToken(slug).post(`/api/rooms/${slug}/dishes/${dishId}/ingredients`, { ingredientId, qtyForDish })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dishes', slug] })
      qc.invalidateQueries({ queryKey: ['ingredients', slug] })
    },
  })
}

export function useUnlinkIngredient(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ dishId, ingId }: { dishId: string; ingId: string }) => {
      await apiWithRoomToken(slug).delete(`/api/rooms/${slug}/dishes/${dishId}/ingredients/${ingId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dishes', slug] })
      qc.invalidateQueries({ queryKey: ['ingredients', slug] })
    },
  })
}
