import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiWithRoomToken } from './client'
import type { RoomMember } from '../types'

export function useMembers(slug: string) {
  return useQuery({
    queryKey: ['members', slug],
    queryFn: async () => {
      const res = await apiWithRoomToken(slug).get<{ data: RoomMember[] }>(`/api/rooms/${slug}/members`)
      return res.data.data
    },
    enabled: !!slug,
  })
}

export function useAddMember(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; role?: string }) => {
      const res = await apiWithRoomToken(slug).post<{ data: RoomMember }>(`/api/rooms/${slug}/members`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', slug] }),
  })
}

export function useUpdateMember(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; name: string; role?: string }) => {
      const { id, ...body } = data
      const res = await apiWithRoomToken(slug).patch<{ data: RoomMember }>(`/api/rooms/${slug}/members/${id}`, body)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', slug] }),
  })
}

export function useDeleteMember(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiWithRoomToken(slug).delete(`/api/rooms/${slug}/members/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', slug] }),
  })
}
