import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../store/auth'
import { useActiveRooms } from '../api/rooms'
import { api } from '../api/client'
import { useDelayedFlag } from '../hooks/useDelayedFlag'

const SLOW_HINT_DELAY_MS = 4000

export default function RoomEntry() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const getRoomAccess = useAuthStore((s) => s.getRoomAccess)
  const setRoomToken = useAuthStore((s) => s.setRoomToken)
  const { data: rooms } = useActiveRooms()
  const room = rooms?.find((r) => r.slug === slug)

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const showSlowHint = useDelayedFlag(loading, SLOW_HINT_DELAY_MS)

  useEffect(() => {
    const access = getRoomAccess(slug)
    if (access) {
      navigate(`/room/${slug}/home`, { replace: true })
    }
  }, [slug, getRoomAccess, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ data: { token: string; role: string } }>('/api/auth/room/enter', { slug, password })
      const { token, role } = res.data.data
      setRoomToken(slug, token, role as 'leader' | 'volunteer')
      navigate(`/room/${slug}/home`, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Wrong password. Try again.')
      } else {
        setError('Server is unavailable right now. Please try again in a bit.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex flex-col">
      {/* Back link */}
      <div className="px-4 pt-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lg font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        {/* Room name hero */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold tracking-[0.25em] uppercase text-emerald-500 mb-2">
            You are joining
          </p>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            {room?.name ?? slug}
          </h1>
          {room?.description && (
            <p className="text-lg text-gray-400 mt-2 max-w-xs mx-auto">{room.description}</p>
          )}
        </div>

        {/* Password form */}
        <div className="w-full max-w-xs">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="room-password" className="block text-lg font-medium text-gray-700 mb-2">
                Enter password
              </label>
              <input
                id="room-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                required
                autoFocus
                autoComplete="current-password"
                className={`w-full border rounded-2xl px-4 py-3.5 text-lg text-center tracking-widest focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-300 focus:ring-red-300 bg-red-50'
                    : 'border-gray-200 focus:ring-emerald-400 bg-white'
                }`}
              />
              {error && (
                <p className="text-lg text-red-500 text-center mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 text-white font-semibold text-lg rounded-2xl py-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            >
              {loading ? 'Checking...' : 'Enter the room →'}
            </button>
            {showSlowHint && (
              <p className="text-lg text-gray-400 text-center">
                Almost there... this may take up to a minute if the app hasn't been used in a while. Please stay on this page.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}
