import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoomAccess } from '../../../hooks/useRoomAccess'
import { useDishes, useUpdateDish, useLinkIngredient, useUnlinkIngredient } from '../../../api/dishes'
import { useIngredients } from '../../../api/ingredients'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { StatBadge } from '../../../components/ui/StatBadge'
import { Input } from '../../../components/ui/Input'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui/Toast'

export default function DishDetail() {
  const { slug, canEdit } = useRoomAccess()
  const { dishId } = useParams<{ dishId: string }>()
  const navigate = useNavigate()
  const { data: dishes, isLoading } = useDishes(slug)
  const { data: allIngredients } = useIngredients(slug)
  const updateDish = useUpdateDish(slug)
  const linkIngredient = useLinkIngredient(slug)
  const unlinkIngredient = useUnlinkIngredient(slug)
  const { toasts, showToast, removeToast } = useToast()

  const dish = dishes?.find((d) => d.id === dishId)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPerson, setEditPerson] = useState('')
  const [confirmEditOpen, setConfirmEditOpen] = useState(false)

  const [linkOpen, setLinkOpen] = useState(false)
  const [selectedIngId, setSelectedIngId] = useState<string | null>(null)
  const [qtyForDish, setQtyForDish] = useState('')

  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null)

  const linkedIngredients = dish?.dishIngredients ?? []
  const linkedIngIds = new Set(linkedIngredients.map((di) => di.ingredient.id))
  const unlinkedIngredients = allIngredients?.filter((ing) => !linkedIngIds.has(ing.id)) ?? []

  const openEdit = () => {
    if (!dish) return
    setEditName(dish.name)
    setEditDesc(dish.description ?? '')
    setEditPerson(dish.responsiblePerson ?? '')
    setEditOpen(true)
  }

  const handleEditConfirm = () => {
    if (!dish) return
    setConfirmEditOpen(false)
    updateDish.mutate(
      { id: dish.id, name: editName, description: editDesc || undefined, responsiblePerson: editPerson || undefined },
      {
        onSuccess: () => showToast('Dish updated', 'success'),
        onError: () => showToast('Failed to update', 'error'),
      }
    )
  }

  const handleLink = () => {
    if (!dish || !selectedIngId || !qtyForDish) return
    linkIngredient.mutate(
      { dishId: dish.id, ingredientId: selectedIngId, qtyForDish: Number(qtyForDish) },
      {
        onSuccess: () => {
          setLinkOpen(false)
          setSelectedIngId(null)
          setQtyForDish('')
          showToast('Ingredient linked', 'success')
        },
        onError: () => showToast('Failed to link', 'error'),
      }
    )
  }

  const handleUnlink = (ingId: string) => {
    if (!dish) return
    unlinkIngredient.mutate(
      { dishId: dish.id, ingId },
      {
        onSuccess: () => { setUnlinkConfirm(null); showToast('Ingredient unlinked', 'success') },
        onError: () => showToast('Failed to unlink', 'error'),
      }
    )
  }

  if (isLoading) return <div className="p-4 text-gray-500">Loading...</div>
  if (!dish) return <div className="p-4 text-gray-500">Dish not found.</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Home', href: `/room/${slug}/home` },
          { label: 'Dishes', href: `/room/${slug}/dishes` },
          { label: dish.name },
        ]} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{dish.name}</h1>
              {dish.description && <p className="text-lg text-gray-500 mt-1">{dish.description}</p>}
              {dish.responsiblePerson && (
                <p className="text-lg text-gray-600 mt-2">Responsible: <span className="font-medium">{dish.responsiblePerson}</span></p>
              )}
            </div>
            {canEdit && (
              <button onClick={openEdit} className="text-blue-400 hover:text-blue-600 p-1 shrink-0" aria-label="Edit dish">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
          {canEdit && <Button variant="secondary" size="sm" onClick={() => setLinkOpen(true)}>Link ingredient</Button>}
        </div>

        {linkedIngredients.length === 0 && (
          <p className="text-lg text-gray-500 mb-4">No ingredients linked.</p>
        )}

        <div className="flex flex-col gap-2 mb-6">
          {linkedIngredients.map((di) => (
            <div key={di.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-3">
              <button
                className="text-lg font-medium text-gray-900 flex-1 text-left"
                onClick={() => navigate(`/room/${slug}/ingredients/${di.ingredient.id}`)}
                aria-label={`View ${di.ingredient.name}`}
              >
                {di.ingredient.name}
              </button>
              <StatBadge needed={di.qtyForDish} committed={di.ingredient.committed} unit={di.ingredient.unit} />
              {canEdit && (
                <button
                  onClick={() => setUnlinkConfirm(di.ingredient.id)}
                  className="text-red-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                  aria-label={`Unlink ${di.ingredient.name}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Dish">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="Description (optional)" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          <Input label="Responsible person (optional)" value={editPerson} onChange={(e) => setEditPerson(e.target.value)} />
          <Button onClick={() => { setEditOpen(false); setConfirmEditOpen(true) }} size="lg">Save</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmEditOpen}
        message={`Save changes to "${editName}"?`}
        onConfirm={handleEditConfirm}
        onCancel={() => setConfirmEditOpen(false)}
        confirmLabel="Save"
      />

      <Modal isOpen={linkOpen} onClose={() => setLinkOpen(false)} title="Link Ingredient">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Ingredient</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedIngId ?? ''}
              onChange={(e) => setSelectedIngId(e.target.value || null)}
              aria-label="Select ingredient"
            >
              <option value="">Select ingredient...</option>
              {unlinkedIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
          </div>
          <Input
            label="Quantity for this dish"
            type="number"
            min="0"
            value={qtyForDish}
            onChange={(e) => setQtyForDish(e.target.value)}
          />
          <Button onClick={handleLink} loading={linkIngredient.isPending} size="lg" disabled={!selectedIngId || !qtyForDish}>
            Link
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={unlinkConfirm !== null}
        message="Remove this ingredient from the dish?"
        onConfirm={() => { if (unlinkConfirm) handleUnlink(unlinkConfirm) }}
        onCancel={() => setUnlinkConfirm(null)}
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </div>
  )
}

