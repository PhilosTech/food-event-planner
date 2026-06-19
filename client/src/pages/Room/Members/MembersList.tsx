import { useState } from 'react'
import { useRoomAccess } from '../../../hooks/useRoomAccess'
import { useMembers, useAddMember, useUpdateMember, useDeleteMember } from '../../../api/members'
import { fetchShareText } from '../../../api/share'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { ShareModal } from '../../../components/ShareModal'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui/Toast'
import type { RoomMember } from '../../../types'

interface EditState {
  member: RoomMember
  name: string
  role: string
}

export default function MembersList() {
  const { slug, isLeader, canEdit } = useRoomAccess()
  const { data: members, isLoading } = useMembers(slug)
  const addMember = useAddMember(slug)
  const updateMember = useUpdateMember(slug)
  const deleteMember = useDeleteMember(slug)
  const { toasts, showToast, removeToast } = useToast()

  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  const openShare = async () => {
    setShareLoading(true)
    try {
      const text = await fetchShareText(slug, 'members')
      setShareText(text)
      setShareOpen(true)
    } catch {
      showToast('Failed to load', 'error')
    } finally {
      setShareLoading(false)
    }
  }

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')

  const [editState, setEditState] = useState<EditState | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    addMember.mutate(
      { name: newName.trim(), role: newRole.trim() || undefined },
      {
        onSuccess: () => {
          setAddOpen(false); setNewName(''); setNewRole('')
          showToast('Member added', 'success')
        },
        onError: () => showToast('Failed to add', 'error'),
      }
    )
  }

  const handleUpdate = () => {
    if (!editState) return
    updateMember.mutate(
      { id: editState.member.id, name: editState.name, role: editState.role || undefined },
      {
        onSuccess: () => { setEditState(null); showToast('Updated', 'success') },
        onError: () => showToast('Failed to update', 'error'),
      }
    )
  }

  const handleDelete = (id: string) => {
    deleteMember.mutate(id, {
      onSuccess: () => showToast('Removed', 'success'),
      onError: () => showToast('Failed to remove', 'error'),
    })
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Breadcrumb items={[{ label: 'Home', href: `/room/${slug}/home` }, { label: 'Team' }]} />

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={openShare} loading={shareLoading} aria-label="Share team">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </Button>
            {canEdit && (
              <Button size="sm" onClick={() => setAddOpen(true)} aria-label="Add member">
                + Add
              </Button>
            )}
          </div>
        </div>

        {isLoading && <p className="text-gray-400 text-lg">Loading...</p>}

        {!isLoading && members?.length === 0 && (
          <p className="text-gray-400 text-center py-12 text-lg">No team members yet.</p>
        )}

        <div className="flex flex-col gap-2">
          {members?.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-emerald-700">{m.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium text-gray-900">{m.name}</p>
                {m.role && <p className="text-sm text-gray-400 truncate">{m.role}</p>}
              </div>
              {canEdit && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditState({ member: m, name: m.name, role: m.role ?? '' })}
                    className="text-emerald-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-emerald-50 transition-colors"
                    aria-label={`Edit ${m.name}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {isLeader && (
                    <button
                      onClick={() => setDeleteConfirm(m.id)}
                      className="text-red-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${m.name}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add person">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Maria" required />
          <Input label="Role (optional)" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Cooks main dish" />
          <div className="flex justify-end">
            <Button onClick={handleAdd} loading={addMember.isPending} size="md">Add</Button>
          </div>
        </div>
      </Modal>

      {editState && (
        <Modal isOpen={true} onClose={() => setEditState(null)} title="Edit person">
          <div className="flex flex-col gap-4">
            <Input label="Name" value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })} />
            <Input label="Role" value={editState.role} onChange={(e) => setEditState({ ...editState, role: e.target.value })} />
            <div className="flex justify-end">
              <Button onClick={handleUpdate} loading={updateMember.isPending} size="md">Save</Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        message="Remove this person from the team?"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        confirmLabel="Remove"
        confirmVariant="danger"
      />

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Team" text={shareText} />
    </div>
  )
}

