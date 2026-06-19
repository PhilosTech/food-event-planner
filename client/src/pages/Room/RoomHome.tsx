import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoomAccess } from '../../hooks/useRoomAccess'
import { useActiveRooms } from '../../api/rooms'
import { fetchShareText } from '../../api/share'
import { useAuthStore } from '../../store/auth'
import { ShareModal } from '../../components/ShareModal'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui/Toast'

const NAV_CARDS = [
  { label: 'Attendees', emoji: '👥', path: 'attendees' },
  { label: 'Dishes', emoji: '🍽️', path: 'dishes' },
  { label: 'Ingredients', emoji: '🧂', path: 'ingredients' },
  { label: 'Assignments', emoji: '📋', path: 'assignments' },
  { label: 'Team', emoji: '🙋', path: 'members' },
]

export default function RoomHome() {
  const { slug } = useRoomAccess()
  const navigate = useNavigate()
  const { data: rooms } = useActiveRooms()
  const room = rooms?.find((r) => r.slug === slug)
  const clearRoomToken = useAuthStore((s) => s.clearRoomToken)
  const { toasts, showToast, removeToast } = useToast()

  const handleExit = () => {
    clearRoomToken(slug)
    navigate('/')
  }

  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  const openOverview = async () => {
    setShareLoading(true)
    try {
      const text = await fetchShareText(slug, 'full')
      setShareText(text)
      setShareOpen(true)
    } catch {
      showToast('Failed to load overview', 'error')
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="px-4 pt-8 pb-2 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{room?.name ?? '...'}</h1>
        {room?.description && <p className="text-lg text-gray-500 mt-1">{room.description}</p>}
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {NAV_CARDS.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(`/room/${slug}/${card.path}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-3 hover:border-emerald-200 hover:shadow-md transition-all active:scale-95"
              aria-label={`Go to ${card.label}`}
            >
              <span className="text-4xl" aria-hidden="true">{card.emoji}</span>
              <span className="text-lg font-medium text-gray-800">{card.label}</span>
            </button>
          ))}
          <button
            onClick={handleExit}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-3 hover:border-red-200 hover:shadow-md transition-all active:scale-95"
            aria-label="Leave room"
          >
            <span className="text-4xl" aria-hidden="true">🚪</span>
            <span className="text-lg font-medium text-red-400">Exit</span>
          </button>
        </div>

        <button
          onClick={openOverview}
          disabled={shareLoading}
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-center gap-2 text-lg font-medium text-gray-600 hover:border-emerald-200 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          aria-label="Share full overview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {shareLoading ? 'Loading...' : 'Share full overview'}
        </button>
      </main>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Full Overview" text={shareText} />
    </div>
  )
}
