import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Room } from '../types';

export function useActiveRooms() {
  return useQuery({
    queryKey: ['rooms', 'active'],
    queryFn: async () => {
      const res = await api.get<{ data: Room[] }>('/api/rooms/active');
      return res.data.data;
    },
  });
}

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get<{ data: Room[] }>('/api/rooms');
      return res.data.data;
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Room> & { leaderPassword: string; volunteerPassword: string }) => {
      const res = await api.post<{ data: Room }>('/api/rooms', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (slug: string) => {
      await api.delete(`/api/rooms/${slug}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      qc.invalidateQueries({ queryKey: ['rooms', 'active'] })
    },
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, ...data }: Partial<Room> & { slug: string; leaderPassword?: string; volunteerPassword?: string }) => {
      const res = await api.patch<{ data: Room }>(`/api/rooms/${slug}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['rooms', 'active'] });
    },
  });
}
