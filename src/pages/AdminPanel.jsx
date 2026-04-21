import { useState } from 'react'
import { useCalendar } from '../context/CalendarContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import EventModal from '../components/calendar/EventModal.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import {
  createCollegeEvent,
  updateCollegeEvent,
  deleteCollegeEvent,
  deleteMultipleCollegeEvents,
} from '../services/collegeEvents.js'
import { runTimetableSeed } from '../utils/seedTimetable.js'
import { checkBatchOverlap } from '../utils/overlapCheck.js'
import { memo, useMemo, useEffect } from 'react'

const typeColors = {
  lecture: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  exam: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  assignment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  holiday: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}

const typeIcons = {
  lecture: '📚',
  exam: '📝',
  assignment: '📋',
  holiday: '🎉',
}

export default function AdminPanel() {
  const { user } = useAuth()
  const { rawCollegeEvents, loading, error } = useCalendar()
  const toast = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [seeding, setSeeding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'title' | 'type'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    window.DEBUG_RUN_SEED = () => runTimetableSeed(user?.uid)
    return () => delete window.DEBUG_RUN_SEED
  }, [user])

  const filteredAndSortedEvents = useMemo(() => {
    let result = [...rawCollegeEvents]

    // 1. Type Filter
    if (filter !== 'all') {
      result = result.filter((e) => e.type === filter)
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      )
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA, valB
      if (sortBy === 'date') {
        valA = a.date
        valB = b.date
      } else if (sortBy === 'title') {
        valA = a.title.toLowerCase()
        valB = b.title.toLowerCase()
      } else {
        valA = a.type
        valB = b.type
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [rawCollegeEvents, filter, searchQuery, sortBy, sortOrder])

  const allVisibleIds = filteredAndSortedEvents.map(e => e.id)
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected


  async function handleCreate(payload) {
    if (submitting) return

    // Overlap check: prevent scheduling two classes for the same batch at the same time
    if (payload.batch) {
      const { hasOverlap, conflictingEvent } = checkBatchOverlap(
        payload,
        rawCollegeEvents,
      )
      if (hasOverlap) {
        toast.error(
          `Cannot schedule: This batch already has a class during this time slot. Conflicts with "${conflictingEvent?.title}".`,
          { duration: 6000 },
        )
        return
      }
    }

    setSubmitting(true)
    setShowCreate(false)
    try {
      await createCollegeEvent({ ...payload, createdBy: user.uid })
      toast.success(`"${payload.title}" added to college calendar`)
    } catch (err) {
      console.error('Failed to create event:', err)
      toast.error(err?.message || 'Could not create event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(payload) {
    if (!editing?.id || submitting) return
    const id = editing.id

    // Overlap check: prevent scheduling two classes for the same batch at the same time
    if (payload.batch) {
      const { hasOverlap, conflictingEvent } = checkBatchOverlap(
        payload,
        rawCollegeEvents,
        id, // exclude the event being edited
      )
      if (hasOverlap) {
        toast.error(
          `Cannot schedule: This batch already has a class during this time slot. Conflicts with "${conflictingEvent?.title}".`,
          { duration: 6000 },
        )
        return
      }
    }

    setSubmitting(true)
    setEditing(null)
    try {
      await updateCollegeEvent(id, payload)
      toast.success('Event updated')
    } catch (err) {
      console.error('Failed to update event:', err)
      toast.error(err?.message || 'Could not update event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editing?.id || submitting) return
    const id = editing.id
    setSubmitting(true)
    setEditing(null)
    try {
      await deleteCollegeEvent(id)
      setSelectedIds(prev => prev.filter(sid => sid !== id))
      toast.success('Event deleted')
    } catch (err) {
      console.error('Failed to delete event:', err)
      toast.error(err?.message || 'Could not delete event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0 || submitting) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected events?`)) return

    setSubmitting(true)
    try {
      await deleteMultipleCollegeEvents(selectedIds)
      toast.success(`${selectedIds.length} events deleted`)
      setSelectedIds([])
    } catch (err) {
      console.error('Bulk delete failed:', err)
      toast.error('Failed to delete selected events')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)))
    } else {
      setSelectedIds(prev => {
        const newIds = allVisibleIds.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="card p-6 text-center">
          <div className="text-base font-semibold text-red-700">Error loading events</div>
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            🛡️ Admin Panel
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Manage official college events, lectures, and exam schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={async () => {
              if (seeding) return
              setSeeding(true)
              try {
                const count = await runTimetableSeed(user.uid)
                toast.success(`Successfully seeded ${count} events!`)
                setSelectedIds([]) // Clear selection if any
              } catch (err) {
                console.error('Seeding error:', err)
                toast.error('Seeding failed: ' + err.message)
              } finally {
                setSeeding(false)
              }
            }}
            disabled={seeding}
          >
            {seeding ? '🌱 Seeding...' : '🌱 Seed Timetable'}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            + New College Event
          </Button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search events by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-[#232323] dark:bg-[#161616] dark:text-zinc-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-2 pr-8 text-xs font-medium dark:border-[#232323] dark:bg-[#161616] dark:text-zinc-200"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="type">Type</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium hover:bg-slate-50 dark:border-[#232323] dark:bg-[#161616] dark:text-zinc-200 dark:hover:bg-[#1e1e1e]"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '🔼' : '🔽'}
          </button>
        </div>
      </div>

      {/* Type Filters & Bulk Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'lecture', label: '📚 Lectures' },
            { value: 'exam', label: '📝 Exams' },
            { value: 'assignment', label: '📋 Assignments' },
            { value: 'holiday', label: '🎉 Holidays' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1e1e1e] dark:text-zinc-400 dark:hover:bg-[#292929]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 animate-in slide-in-from-right-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              🗑️ Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* List Header with Select All */}
      {filteredAndSortedEvents.length > 0 && (
        <div className="mb-2 flex items-center px-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-600">
          <div className="flex w-8 items-center justify-center mr-4">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={el => el && (el.indeterminate = isSomeSelected)}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-slate-300 transition focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <div className="flex-1">Event Details</div>
          <div className="w-32 text-right">Date & Time</div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <Spinner label="Loading events…" />
      ) : filteredAndSortedEvents.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-base font-semibold text-slate-700 dark:text-zinc-200">
            No events found
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
            {searchQuery || filter !== 'all' ? 'Try a different search/filter or ' : ''}Create your first college event to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedEvents.map((event) => {
            const isSelected = selectedIds.includes(event.id)
            return (
              <div
                key={event.id}
                onClick={() => setEditing(event)}
                className={`group card relative flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'border-indigo-400 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-900/10' 
                    : 'hover:border-indigo-200 dark:hover:border-indigo-800'
                }`}
              >
                {/* Selection Checkbox */}
                <div 
                  className="flex w-8 items-center justify-center mr-0 sm:mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(event.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 transition focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>

                <div className="text-2xl">
                  {typeIcons[event.type] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-zinc-100 truncate">
                      {event.title}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeColors[event.type] || 'bg-slate-100 text-slate-600'}`}>
                      {event.type}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500 truncate">
                      {event.description}
                    </p>
                  )}
                </div>
                
                {/* Quick Actions - Visible on Hover (unless selecting) */}
                {!isSelected && (
                  <div className="absolute right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-[#161616]/90 pl-4 py-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(event)
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-[#252525] dark:hover:text-indigo-400 trasition-colors"
                      title="Quick Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
                          setSubmitting(true)
                          try {
                            await deleteCollegeEvent(event.id)
                            setSelectedIds(prev => prev.filter(sid => sid !== event.id))
                            toast.success('Event deleted')
                          } catch (err) {
                            toast.error('Failed to delete event')
                          } finally {
                            setSubmitting(false)
                          }
                        }
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                      title="Quick Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}

                <div className={`shrink-0 text-right transition-opacity duration-200 ${!isSelected && 'group-hover:opacity-40'}`}>
                  <div className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                    {event.date}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-zinc-500">
                    {event.startTime && event.endTime
                      ? `${event.startTime} – ${event.endTime}`
                      : 'All day'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredAndSortedEvents.length > 0 && (
        <div className="mt-4 text-center text-xs text-slate-400 dark:text-zinc-600">
          Showing {filteredAndSortedEvents.length} of {rawCollegeEvents.length} events
          {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
        </div>
      )}


      {/* Create Modal */}
      <EventModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        mode="college"
        submitting={submitting}
      />

      {/* Edit Modal */}
      {editing && (
        <EventModal
          open={true}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
          onDelete={handleDelete}
          initial={editing}
          mode="college"
          submitting={submitting}
        />
      )}
    </div>
  )
}
