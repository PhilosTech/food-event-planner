import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiWithRoomToken } from './client'
import type { Assignment } from '../types'

export function useAssignments(slug: string) {
  return useQuery({
    queryKey: ['assignments', slug],
    queryFn: async () => {
      const res = await apiWithRoomToken(slug).get<{ data: Assignment[] }>(`/api/rooms/${slug}/assignments`)
      return res.data.data
    },
    enabled: !!slug,
  })
}

export function useCreateAssignment(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { ingredientId: string; personName: string; qtyCommitted: number }) => {
      const res = await apiWithRoomToken(slug).post<{ data: Assignment }>(`/api/rooms/${slug}/assignments`, data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', slug] })
      qc.invalidateQueries({ queryKey: ['ingredients', slug] })
    },
  })
}

export function useUpdateAssignment(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; personName?: string; qtyCommitted?: number }) => {
      const res = await apiWithRoomToken(slug).patch<{ data: Assignment }>(`/api/rooms/${slug}/assignments/${id}`, data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', slug] })
      qc.invalidateQueries({ queryKey: ['ingredients', slug] })
    },
  })
}

export function useDeleteAssignment(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiWithRoomToken(slug).delete(`/api/rooms/${slug}/assignments/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', slug] })
      qc.invalidateQueries({ queryKey: ['ingredients', slug] })
    },
  })
}
