import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRoomAccess } from '../../../hooks/useRoomAccess'
import { useIngredients } from '../../../api/ingredients'
import { useAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment } from '../../../api/assignments'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { StatBadge } from '../../../components/ui/StatBadge'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui/Toast'
import type { Assignment } from '../../../types'

interface EditAssignment {
  assignment: Assignment
  personName: string
  qty: string
}

export default function IngredientDetail() {
  const { slug, isLeader, canEdit } = useRoomAccess()
  const { ingredientId } = useParams<{ ingredientId: string }>()
  const { data: ingredients, isLoading } = useIngredients(slug)
  const { data: assignments } = useAssignments(slug)
  const createAssignment = useCreateAssignment(slug)
  const updateAssignment = useUpdateAssignment(slug)
  const deleteAssignment = useDeleteAssignment(slug)
  const { toasts, showToast, removeToast } = useToast()

  const ingredient = ingredients?.find((i) => i.id === ingredientId)
  const ingAssignments = assignments?.filter((a) => a.ingredientId === ingredientId) ?? []

  const [newPerson, setNewPerson] = useState('')
  const [newQty, setNewQty] = useState('')
  const [addError, setAddError] = useState('')

  const [editState, setEditState] = useState<EditAssignment | null>(null)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAdd = () => {
    setAddError('')
    if (!newPerson.trim() || !newQty) { setAddError('Fill in all fields'); return }
    if (!ingredientId) return
    createAssignment.mutate(
      { ingredientId, personName: newPerson.trim(), qtyCommitted: Number(newQty) },
      {
        onSuccess: () => { setNewPerson(''); setNewQty(''); showToast('Assignment added', 'success') },
        onError: () => showToast('Failed to add', 'error'),
      }
    )
  }

  const handleEditConfirm = () => {
    if (!editState) return
    setConfirmEdit(false)
    updateAssignment.mutate(
      { id: editState.assignment.id, personName: editState.personName, qtyCommitted: Number(editState.qty) },
      {
        onSuccess: () => { setEditState(null); showToast('Updated', 'success') },
        onError: () => showToast('Failed to update', 'error'),
      }
    )
  }

  const handleDelete = (id: string) => {
    deleteAssignment.mutate(id, {
      onSuccess: () => { setDeleteConfirm(null); showToast('Deleted', 'success') },
      onError: () => showToast('Failed to delete', 'error'),
    })
  }

  if (isLoading) return <div className="p-4 text-gray-500">Loading...</div>
  if (!ingredient) return <div className="p-4 text-gray-500">Ingredient not found.</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Home', href: `/room/${slug}/home` },
          { label: 'All Ingredients', href: `/room/${slug}/ingredients` },
          { label: ingredient.name },
        ]} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{ingredient.name}</h1>
          <StatBadge needed={ingredient.qtyNeeded} committed={ingredient.committed} unit={ingredient.unit} />
          {ingredient.remaining > 0 && (
            <p className="text-lg text-orange-600 mt-2">Still needed: {ingredient.remaining} {ingredient.unit}</p>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Assignments</h2>

        <div className="flex flex-col gap-2 mb-6">
          {ingAssignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {editState?.assignment.id === a.id ? (
                <div className="flex flex-col gap-2">
                  <Input value={editState.personName} onChange={(e) => setEditState({ ...editState, personName: e.target.value })} aria-label="Person name" />
                  <Input type="number" min="0" value={editState.qty} onChange={(e) => setEditState({ ...editState, qty: e.target.value })} aria-label="Quantity" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setConfirmEdit(true)}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditState(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-medium text-gray-900">{a.personName}</p>
                    <p className="text-lg text-gray-500">{a.qtyCommitted} {ingredient.unit}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditState({ assignment: a, personName: a.personName, qty: String(a.qtyCommitted) })} className="text-blue-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors" aria-label={`Edit ${a.personName}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      {isLeader && (
                        <button onClick={() => setDeleteConfirm(a.id)} className="text-red-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors" aria-label={`Delete ${a.personName}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {ingAssignments.length === 0 && <p className="text-lg text-gray-500">No assignments yet.</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Assignment</h3>
          <div className="flex flex-col gap-3">
            <Input placeholder="Person name" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} aria-label="Person name" />
            <Input type="number" min="0" placeholder={`Quantity (${ingredient.unit})`} value={newQty} onChange={(e) => setNewQty(e.target.value)} error={addError} aria-label="Quantity" />
            <Button onClick={handleAdd} loading={createAssignment.isPending} size="lg">Add</Button>
          </div>
        </div>
      </main>

      <ConfirmDialog isOpen={confirmEdit} message="Save changes to this assignment?" onConfirm={handleEditConfirm} onCancel={() => setConfirmEdit(false)} confirmLabel="Save" />
      <ConfirmDialog isOpen={deleteConfirm !== null} message="Delete this assignment?" onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm) }} onCancel={() => setDeleteConfirm(null)} confirmLabel="Delete" confirmVariant="danger" />
    </div>
  )
}

