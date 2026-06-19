import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiWithRoomToken } from './client';
import type { Attendees } from '../types';

export function useAttendees(slug: string) {
  return useQuery({
    queryKey: ['attendees', slug],
    queryFn: async () => {
      const res = await apiWithRoomToken(slug).get<{ data: Attendees }>(`/api/rooms/${slug}/attendees`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useUpdateAttendees(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Attendees) => {
      const res = await apiWithRoomToken(slug).put<{ data: Attendees }>(`/api/rooms/${slug}/attendees`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees', slug] }),
  });
}
