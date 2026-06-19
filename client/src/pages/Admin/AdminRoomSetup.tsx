import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useRooms, useUpdateRoom } from '../../api/rooms'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui/Toast'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-lg font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white transition-all'

export default function AdminRoomSetup() {
  useAdminAuth()
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: rooms, isLoading } = useRooms()
  const updateRoom = useUpdateRoom()
  const { toasts, showToast, removeToast } = useToast()

  const room = rooms?.find((r) => r.slug === slug)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [leaderPwd, setLeaderPwd] = useState('')
  const [volPwd, setVolPwd] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (room) {
      setName(room.name)
      setDesc(room.description ?? '')
    }
  }, [room])

  const handleConfirm = () => {
    setConfirmOpen(false)
    updateRoom.mutate(
      {
        slug,
        name,
        description: desc || undefined,
        ...(leaderPwd && { leaderPassword: leaderPwd }),
        ...(volPwd && { volunteerPassword: volPwd }),
      },
      {
        onSuccess: () => showToast('Saved!', 'success'),
        onError: () => showToast('Failed to save', 'error'),
      }
    )
  }

  if (isLoading) return <div className="p-8 text-gray-400 text-center">Loading...</div>
  if (!room) return <div className="p-8 text-gray-400 text-center">Room not found.</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="">
        <div className="max-w-xl mx-auto px-4 pt-6 pb-2 flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase text-emerald-500">Edit room</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{room.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Basic info */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Basic info</h2>

          <Field label="Room name">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room name"
              required
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description visible on landing page"
            />
          </Field>

        </section>

        {/* Passwords */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Change passwords</h2>
          <p className="text-lg text-gray-400 -mt-2">Leave blank to keep current password.</p>

          <Field label="Leader password">
            <input
              className={inputClass}
              type="password"
              value={leaderPwd}
              onChange={(e) => setLeaderPwd(e.target.value)}
              placeholder="New leader password"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Volunteer password">
            <input
              className={inputClass}
              type="password"
              value={volPwd}
              onChange={(e) => setVolPwd(e.target.value)}
              placeholder="New volunteer password"
              autoComplete="new-password"
            />
          </Field>
        </section>

        {/* Save */}
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={updateRoom.isPending || !name.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 active:scale-95 text-white font-semibold text-lg rounded-2xl py-4 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          {updateRoom.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </main>

      <ConfirmDialog
        isOpen={confirmOpen}
        message={`Save changes to "${name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Save"
      />
    </div>
  )
}
