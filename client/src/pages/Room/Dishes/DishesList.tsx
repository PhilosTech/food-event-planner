import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoomAccess } from '../../../hooks/useRoomAccess'
import { useDishes, useCreateDish, useUpdateDish, useDeleteDish } from '../../../api/dishes'
import { fetchShareText } from '../../../api/share'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { ShareModal } from '../../../components/ShareModal'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui/Toast'
import type { Dish } from '../../../types'

interface EditState {
  dish: Dish
  name: string
  responsiblePerson: string
}

export default function DishesList() {
  const { slug, canEdit } = useRoomAccess()
  const navigate = useNavigate()
  const { data: dishes, isLoading } = useDishes(slug)
  const createDish = useCreateDish(slug)
  const updateDish = useUpdateDish(slug)
  const deleteDish = useDeleteDish(slug)
  const { toasts, showToast, removeToast } = useToast()

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPerson, setNewPerson] = useState('')

  const [editState, setEditState] = useState<EditState | null>(null)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Dish | null>(null)

  const handleDelete = () => {
    if (!deleteConfirm) return
    deleteDish.mutate(deleteConfirm.id, {
      onSuccess: () => { setDeleteConfirm(null); showToast('Dish deleted', 'success') },
      onError: () => showToast('Failed to delete', 'error'),
    })
  }

  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  const existingPersons = [...new Set(dishes?.map((d) => d.responsiblePerson).filter(Boolean) as string[])]

  const grouped = React.useMemo(() => {
    if (!dishes) return new Map<string, Dish[]>()
    const map = new Map<string, Dish[]>()
    for (const d of dishes) {
      const key = d.responsiblePerson ?? '__unassigned__'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    const unassigned = map.get('__unassigned__')
    map.delete('__unassigned__')
    if (unassigned) map.set('__unassigned__', unassigned)
    return map
  }, [dishes])

  const handleAdd = () => {
    if (!newName.trim()) return
    createDish.mutate(
      { name: newName.trim(), description: newDesc.trim() || undefined, responsiblePerson: newPerson.trim() || undefined },
      {
        onSuccess: () => {
          setAddOpen(false); setNewName(''); setNewDesc(''); setNewPerson('')
          showToast('Dish added', 'success')
        },
        onError: () => showToast('Failed to add dish', 'error'),
      }
    )
  }

  const handleEditConfirm = () => {
    if (!editState) return
    setConfirmEdit(false)
    updateDish.mutate(
      { id: editState.dish.id, name: editState.name, responsiblePerson: editState.responsiblePerson || undefined },
      {
        onSuccess: () => { setEditState(null); showToast('Dish updated', 'success') },
        onError: () => showToast('Failed to update', 'error'),
      }
    )
  }

  const openShare = async () => {
    setShareLoading(true)
    try {
      const text = await fetchShareText(slug, 'dishes')
      setShareText(text)
      setShareOpen(true)
    } catch {
      showToast('Failed to load', 'error')
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Breadcrumb items={[{ label: 'Home', href: `/room/${slug}/home` }, { label: 'Dishes' }]} />

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Dishes</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={openShare} loading={shareLoading} aria-label="Share dish list">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </Button>
            {canEdit && (
              <Button size="sm" onClick={() => setAddOpen(true)} aria-label="Add dish">
                + Add dish
              </Button>
            )}
          </div>
        </div>

        {isLoading && <p className="text-gray-400 text-lg">Loading...</p>}

        {[...grouped.entries()].map(([person, personDishes]) => (
          <div key={person} className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-emerald-700">
                  {person === '__unassigned__' ? '?' : person[0]?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {person === '__unassigned__' ? 'Unassigned' : person}
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {personDishes.map((dish) => (
                <button
                  key={dish.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 w-full text-left hover:border-emerald-200 hover:shadow-md active:bg-emerald-50 transition-all active:scale-[0.99]"
                  onClick={() => navigate(`/room/${slug}/dishes/${dish.id}`)}
                  aria-label={`View ${dish.name}`}
                >
                  <span className="flex-1 text-lg font-medium text-gray-900">{dish.name}</span>
                  {canEdit && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditState({ dish, name: dish.name, responsiblePerson: dish.responsiblePerson ?? '' }) }}
                        className="text-emerald-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-emerald-50 transition-colors shrink-0"
                        aria-label={`Edit ${dish.name}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(dish) }}
                        className="text-red-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                        aria-label={`Delete ${dish.name}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && dishes?.length === 0 && (
          <p className="text-gray-400 text-center py-12 text-lg">No dishes yet.</p>
        )}
      </main>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Dish">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dish name" required />
          <Input label="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Responsible person (optional)</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              list="persons-datalist"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              placeholder="Person name"
            />
            <datalist id="persons-datalist">
              {existingPersons.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} loading={createDish.isPending} size="md">Add</Button>
          </div>
        </div>
      </Modal>

      {editState && (
        <Modal isOpen={true} onClose={() => setEditState(null)} title="Edit Dish">
          <div className="flex flex-col gap-4">
            <Input label="Name" value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })} />
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Responsible person</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                list="persons-datalist-edit"
                value={editState.responsiblePerson}
                onChange={(e) => setEditState({ ...editState, responsiblePerson: e.target.value })}
              />
              <datalist id="persons-datalist-edit">
                {existingPersons.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setConfirmEdit(true)} size="md">Save</Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={confirmEdit}
        message={`Save changes to "${editState?.name}"?`}
        onConfirm={handleEditConfirm}
        onCancel={() => { setConfirmEdit(false); setEditState(null) }}
        confirmLabel="Save"
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        message={`Delete "${deleteConfirm?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Dish List" text={shareText} />
    </div>
  )
}

