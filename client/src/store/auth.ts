import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  adminToken: string | null
  roomTokens: Record<string, { token: string; role: 'leader' | 'volunteer' }>
  setAdminToken: (token: string | null) => void
  setRoomToken: (slug: string, token: string, role: 'leader' | 'volunteer') => void
  getRoomAccess: (slug: string) => { token: string; role: 'leader' | 'volunteer' } | null
  clearRoomToken: (slug: string) => void
  clearAll: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      adminToken: null,
      roomTokens: {},
      setAdminToken: (token) => set({ adminToken: token }),
      setRoomToken: (slug, token, role) =>
        set((s) => ({ roomTokens: { ...s.roomTokens, [slug]: { token, role } } })),
      getRoomAccess: (slug) => get().roomTokens[slug] ?? null,
      clearRoomToken: (slug) => set((s) => {
        const { [slug]: _, ...rest } = s.roomTokens
        return { roomTokens: rest }
      }),
      clearAll: () => set({ adminToken: null, roomTokens: {} }),
    }),
    { name: 'fep-auth' }
  )
)
