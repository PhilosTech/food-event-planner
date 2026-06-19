import { useState, useEffect } from 'react'
import { useRoomAccess } from '../../hooks/useRoomAccess'
import { useAttendees, useUpdateAttendees } from '../../api/attendees'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/ui/Toast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

export default function Attendees() {
  const { slug, canEdit } = useRoomAccess()
  const { data, isLoading, error } = useAttendees(slug)
  const updateAttendees = useUpdateAttendees(slug)
  const { toasts, showToast, removeToast } = useToast()

  const [total, setTotal] = useState('')
  const [vegetarian, setVegetarian] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (data) {
      setTotal(String(data.totalCount))
      setVegetarian(String(data.vegetarianCount))
    }
  }, [data])

  const handleConfirm = () => {
    setConfirmOpen(false)
    updateAttendees.mutate(
      { totalCount: Number(total), vegetarianCount: Number(vegetarian) },
      {
        onSuccess: () => showToast('Saved!', 'success'),
        onError: () => showToast('Failed to save', 'error'),
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Breadcrumb items={[{ label: 'Home', href: `/room/${slug}/home` }, { label: 'Attendees' }]} />
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendees</h1>

        {isLoading && <p className="text-gray-400 text-lg">Loading...</p>}
        {error && <p className="text-red-500 text-lg">Failed to load.</p>}

        {data && (
          <div className="flex flex-col gap-4">
            {canEdit ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 max-w-xs">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-1">Total guests</label>
                  <input
                    type="number"
                    min="0"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-1">Vegetarian</label>
                  <input
                    type="number"
                    min="0"
                    value={vegetarian}
                    onChange={(e) => setVegetarian(e.target.value)}
                    className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-2xl font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
                  />
                </div>
                <Button onClick={() => setConfirmOpen(true)} loading={updateAttendees.isPending} size="md" className="self-start">
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center flex-1">
                  <p className="text-lg text-gray-400 mb-1">Total</p>
                  <p className="text-4xl font-bold text-gray-900">{data.totalCount}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center flex-1">
                  <p className="text-lg text-gray-400 mb-1">Vegetarian</p>
                  <p className="text-4xl font-bold text-emerald-600">{data.vegetarianCount}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmOpen}
          message={`Set to ${total} total, ${vegetarian} vegetarian?`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
          confirmLabel="Save"
        />
      </main>
    </div>
  )
}

