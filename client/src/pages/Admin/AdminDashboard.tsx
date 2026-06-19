import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../../api/rooms'
import { useAuthStore } from '../../store/auth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui/Toast'
import type { Room } from '../../types'

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

type ConfirmAction =
  | { type: 'deactivate'; room: Room }
  | { type: 'activate'; room: Room }
  | { type: 'archive'; room: Room }
  | { type: 'restore'; room: Room }
  | { type: 'delete'; room: Room }

export default function AdminDashboard() {
  useAdminAuth()
  const navigate = useNavigate()
  const { data: rooms, isLoading } = useRooms()
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()
  const clearAll = useAuthStore((s) => s.clearAll)
  const { toasts, showToast, removeToast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newLeaderPwd, setNewLeaderPwd] = useState('')
  const [newVolPwd, setNewVolPwd] = useState('')

  const [detailRoom, setDetailRoom] = useState<Room | null>(null)
  const [showLeaderPwd, setShowLeaderPwd] = useState(false)
  const [showVolPwd, setShowVolPwd] = useState(false)

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const handleCreate = () => {
    if (!newName.trim() || !newSlug.trim()) return
    createRoom.mutate(
      { name: newName.trim(), slug: newSlug.trim(), description: newDesc.trim() || undefined, leaderPassword: newLeaderPwd, volunteerPassword: newVolPwd, isActive: false, isArchived: false },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setNewName(''); setNewSlug(''); setNewDesc(''); setNewLeaderPwd(''); setNewVolPwd('')
          showToast('Room created', 'success')
        },
        onError: () => showToast('Failed to create room', 'error'),
      }
    )
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    const { type, room } = confirmAction
    const updateData =
      type === 'deactivate' ? { isActive: false } :
      type === 'activate'   ? { isActive: true } :
      type === 'archive'    ? { isArchived: true } :
      type === 'restore'    ? { isArchived: false } :
      null

    if (updateData) {
      updateRoom.mutate(
        { slug: room.slug, ...updateData },
        {
          onSuccess: () => showToast(
            type === 'deactivate' ? 'Room deactivated' :
            type === 'activate'   ? 'Room activated' :
            type === 'archive'    ? 'Room archived' :
            'Room restored',
            'success'
          ),
          onError: () => showToast('Failed to update', 'error'),
        }
      )
    } else {
      deleteRoom.mutate(room.slug, {
        onSuccess: () => showToast('Room deleted', 'success'),
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to delete'
          showToast(msg, 'error')
        },
      })
    }
    setConfirmAction(null)
  }

  const handleLogout = () => {
    clearAll()
    navigate('/')
  }

  const activeRooms   = rooms?.filter((r) => r.isActive) ?? []
  const inactiveRooms = rooms?.filter((r) => !r.isActive && !r.isArchived) ?? []
  const archivedRooms = rooms?.filter((r) => r.isArchived) ?? []

  const confirmMessage = () => {
    if (!confirmAction) return ''
    const name = confirmAction.room.name
    switch (confirmAction.type) {
      case 'deactivate': return `Deactivate "${name}"? It will be hidden from the landing page but all data stays.`
      case 'activate':   return `Activate "${name}"? It will appear on the landing page.`
      case 'archive':    return `Archive "${name}"? It will be stored in archive. You can restore it later.`
      case 'restore':    return `Restore "${name}" to inactive state? You can activate it afterwards.`
      case 'delete':     return `Delete "${name}" and ALL its data? This cannot be undone.`
    }
  }

  const openDetail = (room: Room) => {
    setDetailRoom(room)
    setShowLeaderPwd(false)
    setShowVolPwd(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <header className="max-w-xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-widest uppercase text-emerald-500 mb-0.5">Admin</p>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-none">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-lg font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-white/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Site
          </Link>
          <button
            onClick={handleLogout}
            className="text-lg font-semibold text-red-500 border border-red-200 bg-white rounded-xl px-4 py-2 hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <Button onClick={() => setCreateOpen(true)} size="md" className="w-full mb-6">
          + Create new room
        </Button>

        {isLoading && <p className="text-gray-400 text-lg">Loading...</p>}

        {activeRooms.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-3">Active</h2>
            <div className="flex flex-col gap-3">
              {activeRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onView={() => openDetail(room)}
                  onEdit={() => navigate(`/admin/rooms/${room.slug}`)}
                  onDeactivate={() => setConfirmAction({ type: 'deactivate', room })}
                />
              ))}
            </div>
          </section>
        )}

        {inactiveRooms.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-3">Inactive</h2>
            <div className="flex flex-col gap-3">
              {inactiveRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onView={() => openDetail(room)}
                  onEdit={() => navigate(`/admin/rooms/${room.slug}`)}
                  onActivate={() => setConfirmAction({ type: 'activate', room })}
                  onArchive={() => setConfirmAction({ type: 'archive', room })}
                  onDelete={() => setConfirmAction({ type: 'delete', room })}
                />
              ))}
            </div>
          </section>
        )}

        {!isLoading && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v4m4-4v4" />
              </svg>
              <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Archived</h2>
            </div>

            {archivedRooms.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl py-8 px-4 text-center">
                <p className="text-lg text-gray-400">No archived rooms yet</p>
                <p className="text-sm text-gray-300 mt-1">Archived rooms will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {archivedRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onView={() => openDetail(room)}
                    onEdit={() => navigate(`/admin/rooms/${room.slug}`)}
                    onRestore={() => setConfirmAction({ type: 'restore', room })}
                    onDelete={() => setConfirmAction({ type: 'delete', room })}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {!isLoading && rooms?.length === 0 && (
          <p className="text-gray-400 text-center py-12 text-lg">No rooms yet. Create your first one above.</p>
        )}
      </main>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Room">
        <div className="flex flex-col gap-4">
          <Input
            label="Room name"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }}
            required
          />
          <Input label="Slug (URL)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required />
          <Input label="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <Input label="Leader password (optional)" type="password" value={newLeaderPwd} onChange={(e) => setNewLeaderPwd(e.target.value)} />
          <Input label="Volunteer password (optional)" type="password" value={newVolPwd} onChange={(e) => setNewVolPwd(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={handleCreate} loading={createRoom.isPending} size="md">Create</Button>
          </div>
        </div>
      </Modal>

      {detailRoom && (
        <Modal isOpen={true} onClose={() => setDetailRoom(null)} title={detailRoom.name}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span className={`text-lg font-semibold ${
                  detailRoom.isActive ? 'text-emerald-600' :
                  detailRoom.isArchived ? 'text-gray-400' :
                  'text-amber-500'
                }`}>
                  {detailRoom.isActive ? '● Active' : detailRoom.isArchived ? '○ Archived' : '◐ Inactive'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-400 mb-1">URL slug</p>
                <span className="text-lg font-mono text-gray-700">/{detailRoom.slug}</span>
              </div>
            </div>

            {detailRoom.description && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-lg text-gray-800">{detailRoom.description}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-4">
              <p className="text-sm font-bold text-amber-700 uppercase tracking-wider">Access passwords</p>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-400 mb-1">Leader (organizer)</p>
                  <p className="font-mono text-lg font-semibold text-gray-900 tracking-wider">
                    {showLeaderPwd
                      ? (detailRoom.leaderPassword || <span className="text-gray-300 font-normal text-lg">not set</span>)
                      : '••••••••'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowLeaderPwd((v) => !v)}
                  className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    showLeaderPwd ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {showLeaderPwd ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="h-px bg-amber-100" />

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-400 mb-1">Volunteer</p>
                  <p className="font-mono text-lg font-semibold text-gray-900 tracking-wider">
                    {showVolPwd
                      ? (detailRoom.volunteerPassword || <span className="text-gray-300 font-normal text-lg">not set</span>)
                      : '••••••••'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowVolPwd((v) => !v)}
                  className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    showVolPwd ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {showVolPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {detailRoom.createdAt && (
              <p className="text-sm text-gray-300 text-right">
                Created {new Date(detailRoom.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        message={confirmMessage()}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        confirmLabel={
          confirmAction?.type === 'deactivate' ? 'Deactivate' :
          confirmAction?.type === 'activate'   ? 'Activate' :
          confirmAction?.type === 'archive'    ? 'Archive' :
          confirmAction?.type === 'restore'    ? 'Restore' :
          'Delete forever'
        }
        confirmVariant={
          confirmAction?.type === 'activate' || confirmAction?.type === 'restore' ? 'primary' : 'danger'
        }
      />
    </div>
  )
}

interface RoomCardProps {
  room: Room
  onView: () => void
  onEdit: () => void
  onDeactivate?: () => void
  onActivate?: () => void
  onArchive?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

function RoomCard({ room, onView, onEdit, onDeactivate, onActivate, onArchive, onRestore, onDelete }: RoomCardProps) {
  const status = room.isActive ? 'active' : room.isArchived ? 'archived' : 'inactive'

  const badgeClass =
    status === 'active'   ? 'bg-emerald-100 text-emerald-700' :
    status === 'inactive' ? 'bg-amber-100 text-amber-600' :
    'bg-gray-100 text-gray-500'

  const badgeLabel =
    status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Archived'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <button className="w-full text-left mb-4" onClick={onView} aria-label={`View details for ${room.name}`}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{room.name}</h2>
          <span className={`text-lg px-3 py-1 rounded-full font-semibold shrink-0 ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="text-lg text-gray-500 font-mono mt-1">/{room.slug}</p>
        {room.description && <p className="text-lg text-gray-500 mt-1 truncate">{room.description}</p>}
      </button>

      {status === 'active' && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onView} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all active:scale-95">
            Details
          </button>
          <button onClick={onEdit} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200 transition-all active:scale-95">
            Edit
          </button>
          <button onClick={onDeactivate} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all active:scale-95">
            Deactivate
          </button>
        </div>
      )}

      {status === 'inactive' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onView} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all active:scale-95">
              Details
            </button>
            <button onClick={onEdit} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200 transition-all active:scale-95">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={onActivate} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all active:scale-95">
              Activate
            </button>
            <button onClick={onArchive} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all active:scale-95">
              Archive
            </button>
            <button onClick={onDelete} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all active:scale-95">
              Delete
            </button>
          </div>
        </div>
      )}

      {status === 'archived' && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onView} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all active:scale-95">
            Details
          </button>
          <button onClick={onEdit} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200 transition-all active:scale-95">
            Edit
          </button>
          <button onClick={onRestore} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all active:scale-95">
            Restore
          </button>
          <button onClick={onDelete} className="text-lg font-semibold py-2.5 px-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all active:scale-95">
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
