import { apiWithRoomToken } from './client'

export type ShareType = 'missing' | 'ingredients' | 'assignments' | 'dishes' | 'members' | 'full'

export async function fetchShareText(slug: string, type: ShareType): Promise<string> {
  const res = await apiWithRoomToken(slug).get<{ data: { text: string } }>(`/api/rooms/${slug}/share?type=${type}`)
  return res.data.data.text
}
