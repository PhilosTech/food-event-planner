import React, { useState } from 'react'
import { useRoomAccess } from '../../../hooks/useRoomAccess'
import { useAssignments } from '../../../api/assignments'
import { fetchShareText } from '../../../api/share'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { ShareModal } from '../../../components/ShareModal'
import { useToast } from '../../../hooks/useToast'
import { ToastContainer } from '../../../components/ui/Toast'

export default function AssignmentsList() {
  const { slug } = useRoomAccess()
  const { data: assignments, isLoading } = useAssignments(slug)
  const { toasts, showToast, removeToast } = useToast()

  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [shareTitle, setShareTitle] = useState('Who Brings What')
  const [shareLoading, setShareLoading] = useState(false)

  const grouped = React.useMemo(() => {
    if (!assignments) return new Map<string, typeof assignments>()
    const map = new Map<string, typeof assignments>()
    for (const a of assignments) {
      if (!map.has(a.personName)) map.set(a.personName, [])
      map.get(a.personName)!.push(a)
    }
    return map
  }, [assignments])

  const openShareAll = async () => {
    setShareLoading(true)
    try {
      const text = await fetchShareText(slug, 'assignments')
      setShareTitle('Who Brings What')
      setShareText(text)
      setShareOpen(true)
    } catch {
      showToast('Failed to load', 'error')
    } finally {
      setShareLoading(false)
    }
  }

  const openSharePerson = (person: string, personAssignments: NonNullable<typeof assignments>) => {
    const lines = personAssignments.map((a) => `- ${a.ingredient.name}: ${a.qtyCommitted} ${a.ingredient.unit}`)
    const text = `${person}'s list:\n${lines.join('\n')}`
    setShareTitle(`${person}'s list`)
    setShareText(text)
    setShareOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-xl mx-auto px-4 py-6">
        <Breadcrumb items={[{ label: 'Home', href: `/room/${slug}/home` }, { label: 'All Assignments' }]} />

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Who brings what</h1>
          <Button variant="secondary" size="sm" onClick={openShareAll} loading={shareLoading} aria-label="Share all assignments">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            All
          </Button>
        </div>

        {isLoading && <p className="text-gray-400 text-lg">Loading...</p>}

        {[...grouped.entries()].map(([person, personAssignments]) => (
          <div key={person} className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-emerald-700">{person[0]?.toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 flex-1">{person}</h2>
              <button
                onClick={() => openSharePerson(person, personAssignments!)}
                className="text-emerald-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-emerald-50 transition-colors shrink-0"
                aria-label={`Share ${person}'s list`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {personAssignments!.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">{a.ingredient.name}</span>
                  <span className="text-lg font-semibold text-emerald-600">{a.qtyCommitted} {a.ingredient.unit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && assignments?.length === 0 && (
          <p className="text-gray-400 text-center py-12 text-lg">No assignments yet.</p>
        )}
      </main>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} title={shareTitle} text={shareText} />
    </div>
  )
}

