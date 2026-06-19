import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiWithRoomToken } from './client'
import type { Ingredient } from '../types'

export function useIngredients(slug: string) {
  return useQuery({
    queryKey: ['ingredients', slug],
    queryFn: async () => {
      const res = await apiWithRoomToken(slug).get<{ data: Ingredient[] }>(`/api/rooms/${slug}/ingredients`)
      return res.data.data
    },
    enabled: !!slug,
  })
}

export function useCreateIngredient(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; unit: string; qtyNeeded: number }) => {
      const res = await apiWithRoomToken(slug).post<{ data: Ingredient }>(`/api/rooms/${slug}/ingredients`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients', slug] }),
  })
}

export function useUpdateIngredient(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; unit?: string; qtyNeeded?: number }) => {
      const res = await apiWithRoomToken(slug).patch<{ data: Ingredient }>(`/api/rooms/${slug}/ingredients/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients', slug] }),
  })
}

export function useDeleteIngredient(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiWithRoomToken(slug).delete(`/api/rooms/${slug}/ingredients/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients', slug] }),
  })
}
