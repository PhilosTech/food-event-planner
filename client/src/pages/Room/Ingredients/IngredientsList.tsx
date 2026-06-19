import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoomAccess } from '../../../hooks/useRoomAccess'
import { useIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient } from '../../../api/ingredients'
import { fetchShareText } from '../../../api/share'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { StatBadge } from '../../../components/ui/StatBadge'
import { ShareModal } from '../../../components/ShareModal'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui/Toast'
import type { Ingredient } from '../../../types'

interface EditState {
  ingredient: Ingredient
  name: string
  unit: string
  qtyNeeded: string
}

export default function IngredientsList() {
  const { slug, canEdit } = useRoomAccess()
  const navigate = useNavigate()
  const { data: ingredients, isLoading } = useIngredients(slug)
  const createIngredient = useCreateIngredient(slug)
  const updateIngredient = useUpdateIngredient(slug)
  const deleteIngredient = useDeleteIngredient(slug)
  const { toasts, showToast, removeToast } = useToast()

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newQty, setNewQty] = useState('')

  const [editState, setEditState] = useState<EditState | null>(null)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Ingredient | null>(null)

  const handleDelete = () => {
    if (!deleteConfirm) return
    deleteIngredient.mutate(deleteConfirm.id, {
      onSuccess: () => { setDeleteConfirm(null); showToast('Ingredient deleted', 'success') },
      onError: () => showToast('Failed to delete', 'error'),
    })
  }

  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [shareTitle, setShareTitle] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  const handleAdd = () => {
    if (!newName.trim() || !newUnit.trim() || !newQty) return
    createIngredient.mutate(
      { name: newName.trim(), unit: newUnit.trim(), qtyNeeded: Number(newQty) },
      {
        onSuccess: () => {
          setAddOpen(false); setNewName(''); setNewUnit(''); setNewQty('')
          showToast('Ingredient added', 'success')
        },
        onError: () => showToast('Failed to add', 'error'),
      }
    )
  }

  const handleEditConfirm = () => {
    if (!editState) return
    setConfirmEdit(false)
    updateIngredient.mutate(
      { id: editState.ingredient.id, name: editState.name, unit: editState.unit, qtyNeeded: Number(editState.qtyNeeded) },
      {
        onSuccess: () => { setEditState(null); showToast('Updated', 'success') },
        onError: () => showToast('Failed to update', 'error'),
      }
    )
  }

  const openShare = async (type: 'missing' | 'ingredients') => {
    setShareLoading(true)
    try {
      const text = await fetchShareText(slug, type)
      setShareText(text)
      setShareTitle(type === 'missing' ? 'Still Needed' : 'Ingredients List')
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
        <Breadcrumb items={[{ label: 'Home', href: `/room/${slug}/home` }, { label: 'All Ingredients' }]} />

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Ingredients</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => openShare('missing')} loading={shareLoading} aria-label="Share missing">
              Missing
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openShare('ingredients')} loading={shareLoading} aria-label="Share full list">
              List
            </Button>
            {canEdit && (
              <Button size="sm" onClick={() => setAddOpen(true)} aria-label="Add ingredient">
                + Add
              </Button>
            )}
          </div>
        </div>

        {isLoading && <p className="text-gray-400 text-lg">Loading...</p>}

        <div className="flex flex-col gap-2">
          {ingredients?.map((ing) => (
            <button
              key={ing.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 w-full text-left hover:border-emerald-200 hover:shadow-md active:bg-emerald-50 transition-all active:scale-[0.99]"
              onClick={() => navigate(`/room/${slug}/ingredients/${ing.id}`)}
              aria-label={`View assignments for ${ing.name}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${ing.remaining <= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                aria-label={ing.remaining <= 0 ? 'Covered' : 'Needs more'}
              />
              <div className="flex-1 min-w-0 text-left">
                <span className="text-lg font-medium text-gray-900 block leading-snug">{ing.name}</span>
                <span className="sm:hidden block mt-2">
                  <StatBadge needed={ing.qtyNeeded} committed={ing.committed} unit={ing.unit} />
                </span>
              </div>
              <span className="hidden sm:block shrink-0">
                <StatBadge needed={ing.qtyNeeded} committed={ing.committed} unit={ing.unit} />
              </span>
              {canEdit && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditState({ ingredient: ing, name: ing.name, unit: ing.unit, qtyNeeded: String(ing.qtyNeeded) }) }}
                    className="text-emerald-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-emerald-50 transition-colors shrink-0"
                    aria-label={`Edit ${ing.name}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(ing) }}
                    className="text-red-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                    aria-label={`Delete ${ing.name}`}
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

        {!isLoading && ingredients?.length === 0 && (
          <p className="text-gray-400 text-center py-12 text-lg">No ingredients yet.</p>
        )}
      </main>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Ingredient">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <Input label="Unit (kg, pcs, L...)" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} required />
          <Input label="Quantity needed" type="number" min="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} required />
          <div className="flex justify-end">
            <Button onClick={handleAdd} loading={createIngredient.isPending} size="md">Add</Button>
          </div>
        </div>
      </Modal>

      {editState && (
        <Modal isOpen={true} onClose={() => setEditState(null)} title="Edit Ingredient">
          <div className="flex flex-col gap-4">
            <Input label="Name" value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })} />
            <Input label="Unit" value={editState.unit} onChange={(e) => setEditState({ ...editState, unit: e.target.value })} />
            <Input label="Quantity needed" type="number" min="0" value={editState.qtyNeeded} onChange={(e) => setEditState({ ...editState, qtyNeeded: e.target.value })} />
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
        message={`Delete "${deleteConfirm?.name}"? All assignments for this ingredient will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} title={shareTitle} text={shareText} />
    </div>
  )
}

