import { useNavigate, Link } from 'react-router-dom'
import { useActiveRooms } from '../api/rooms'
import { useDelayedFlag } from '../hooks/useDelayedFlag'

const SLOW_HINT_DELAY_MS = 4000

export default function Landing() {
  const { data: rooms, isLoading, error, refetch, isRefetching } = useActiveRooms()
  const navigate = useNavigate()
  const showSlowHint = useDelayedFlag(isLoading, SLOW_HINT_DELAY_MS)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Hero */}
      <div className="px-4 pt-14 pb-10 text-center">
        <p className="text-sm font-semibold tracking-[0.25em] uppercase text-emerald-500 mb-3">
          Community cooking
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          Food Event<br />Planner
        </h1>
        <p className="text-lg text-gray-400 max-w-xs mx-auto">
          Coordinate dishes, ingredients and assignments for your event
        </p>
      </div>

      <main className="max-w-sm mx-auto px-4 pb-12">
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-5" />
                <div className="h-12 bg-gray-200 rounded-2xl" />
              </div>
            ))}
            {showSlowHint && (
              <p className="text-lg text-gray-400 text-center px-4">
                Almost there... this may take up to a minute if the app hasn't been used in a while. Please stay on this page.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500 text-lg mb-4">Server is unavailable right now. Please try again in a bit.</p>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 text-white font-semibold text-lg rounded-2xl px-6 py-3 transition-all"
            >
              {isRefetching ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {!isLoading && rooms?.length === 0 && (
          <p className="text-gray-400 text-center py-16 text-lg">No active events right now.</p>
        )}

        <div className="flex flex-col gap-3">
          {rooms?.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{room.name}</h2>
              {room.description && (
                <p className="text-lg text-gray-400 mb-4">{room.description}</p>
              )}
              <button
                onClick={() => navigate(`/room/${room.slug}`)}
                aria-label={`Enter ${room.name}`}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-lg rounded-2xl py-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
              >
                Enter the room →
              </button>
            </div>
          ))}
        </div>

        {/* Admin link */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/admin/login"
            className="flex items-center gap-2 text-lg font-medium text-gray-500 border border-gray-200 rounded-xl px-5 py-3 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin panel
          </Link>
        </div>
      </main>
    </div>
  )
}
