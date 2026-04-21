import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { useCalendar } from '../context/CalendarContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import CalendarLegend from '../components/calendar/CalendarLegend.jsx'
import CustomEvent from '../components/calendar/CustomEvent.jsx'
import EventModal from '../components/calendar/EventModal.jsx'
import AIRoutineGenerator from '../components/calendar/AIRoutineGenerator.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { createCollegeEvent, updateCollegeEvent, deleteCollegeEvent } from '../services/collegeEvents.js'
import { createStudentEvent, updateStudentEvent, deleteStudentEvent } from '../services/studentEvents.js'
import FilterBar from '../components/dashboard/FilterBar.jsx'
import { checkBatchOverlap } from '../utils/overlapCheck.js'
import { hexToRgba, getContrastText } from '../utils/colorUtils.js'

const localizer = momentLocalizer(moment)

// Time boundaries
const CALENDAR_MIN_FULL = new Date(1970, 0, 1, 0, 0)   // 12:00 AM
const CALENDAR_MIN_LOCKED = new Date(1970, 0, 1, 6, 0)  // 6:00 AM
const CALENDAR_MAX = new Date(1970, 0, 1, 23, 59)       // 11:59 PM

const CALENDAR_VIEWS = ['month', 'week', 'day', 'agenda']
const CALENDAR_STYLE = { minHeight: 700 }

// Hour to auto-scroll to on mount (6 AM)
const SCROLL_TO_HOUR = 6

/**
 * Notion-style event styling: pastel fill + solid left accent border.
 * In dark mode, uses stronger opacity for better contrast.
 */
function eventStyleGetter(event) {
  const isDark = document.documentElement.classList.contains('dark')

  const colorMapLight = {
    lecture:    { bg: 'rgba(99,102,241,0.15)',  accent: '#6366f1', text: '#4338ca' },
    exam:      { bg: 'rgba(244,63,94,0.15)',    accent: '#f43f5e', text: '#be123c' },
    assignment:{ bg: 'rgba(245,158,11,0.15)',   accent: '#f59e0b', text: '#b45309' },
    holiday:   { bg: 'rgba(20,184,166,0.15)',   accent: '#14b8a6', text: '#0f766e' },
    personal:  { bg: 'rgba(16,185,129,0.15)',   accent: '#10b981', text: '#047857' },
  }

  // Dark mode: stronger opacity backgrounds + bright readable text
  const colorMapDark = {
    lecture:    { bg: 'rgba(99,102,241,0.25)',  accent: '#818cf8', text: '#e0e7ff' },
    exam:      { bg: 'rgba(244,63,94,0.25)',    accent: '#fb7185', text: '#ffe4e6' },
    assignment:{ bg: 'rgba(245,158,11,0.25)',   accent: '#fbbf24', text: '#fef3c7' },
    holiday:   { bg: 'rgba(20,184,166,0.25)',   accent: '#2dd4bf', text: '#ccfbf1' },
    personal:  { bg: 'rgba(16,185,129,0.25)',   accent: '#34d399', text: '#d1fae5' },
  }

  const colorMap = isDark ? colorMapDark : colorMapLight

  let colors
  
  if (event.raw?.color) {
    // Force 30% opacity on backgrounds for vivid contrast in both themes
    const bgOpacity = 0.3
    const bgColor = hexToRgba(event.raw.color, bgOpacity)
    
    // We want highly legible text contrast
    const textColor = getContrastText(event.raw.color, isDark)
    
    colors = {
      bg: bgColor,
      accent: event.raw.color,
      text: textColor
    }
  } else if (event.isAiGenerated) {
    colors = isDark
      ? { bg: 'rgba(139,92,246,0.25)', accent: '#a78bfa', text: '#ede9fe' }
      : { bg: 'rgba(139,92,246,0.15)', accent: '#8b5cf6', text: '#6d28d9' }
  } else {
    colors = colorMap[event.type] || colorMap.personal
  }

  return {
    style: {
      backgroundColor: colors.bg,
      borderLeft: `4px solid ${colors.accent}`,
      borderTop: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      borderRadius: '3px',
      color: colors.text,
      fontSize: '12px',
      fontWeight: isDark ? 600 : 500,
      padding: '1px 6px',
      boxShadow: 'none',
      outline: 'none',
    },
  }
}

/**
 * Custom toolbar with date picker and early-hours lock toggle.
 * Receives earlyHoursLocked + onToggleLock via the toolbar props
 * injected through react-big-calendar's components.toolbar.
 */
function CustomToolbar({ label, onNavigate, onView, view, earlyHoursLocked, onToggleLock }) {
  const goToBack = () => onNavigate('PREV')
  const goToNext = () => onNavigate('NEXT')
  const goToCurrent = () => onNavigate('TODAY')
  
  return (
    <div className="rbc-toolbar mb-4 flex-wrap gap-2">
      <span className="rbc-btn-group">
        <button type="button" onClick={goToCurrent}>Today</button>
        <button type="button" onClick={goToBack}>Back</button>
        <button type="button" onClick={goToNext}>Next</button>
      </span>
      <span className="rbc-toolbar-label relative group inline-flex items-center justify-center cursor-pointer">
        {label}
        <input 
          type="date"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            if (e.target.value) {
              const d = new Date(e.target.value + 'T00:00:00')
              onNavigate('DATE', d)
            }
          }}
          title="Jump to date"
        />
        <span className="ml-1.5 opacity-40 group-hover:opacity-100 transition-opacity">📅</span>
      </span>
      <span className="rbc-btn-group">
        {['month', 'week', 'day', 'agenda'].map(v => (
          <button 
            key={v} 
            type="button" 
            className={view === v ? 'rbc-active' : ''} 
            onClick={() => onView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </span>
      {/* Early hours lock toggle */}
      <button
        type="button"
        onClick={onToggleLock}
        title={earlyHoursLocked ? 'Show 12 AM – 5 AM' : 'Hide 12 AM – 5 AM'}
        className={`ml-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
          earlyHoursLocked
            ? 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-[#2a2a2a] dark:text-zinc-400 dark:hover:bg-[#252525]'
            : 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300'
        }`}
      >
        <span>{earlyHoursLocked ? '🔒' : '🔓'}</span>
        <span className="hidden sm:inline">{earlyHoursLocked ? '12–05 AM Hidden' : '12–05 AM Visible'}</span>
      </button>
    </div>
  )
}

/**
 * Event types considered "daily classes" — hidden in month view.
 * Exams, assignments, and holidays always remain visible.
 */
const DAILY_CLASS_TYPES = new Set(['lecture'])

export default function Dashboard() {
  const { user, isAdmin, isStudent } = useAuth()
  const { allEvents, collegeEvents, rawCollegeEvents, loading, error } = useCalendar()
  const toast = useToast()

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createSlot, setCreateSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Early hours lock: when true, calendar starts at 6 AM (no scrolling to midnight)
  const [earlyHoursLocked, setEarlyHoursLocked] = useState(true)
  const calendarMin = earlyHoursLocked ? CALENDAR_MIN_LOCKED : CALENDAR_MIN_FULL

  // Filters State
  const [activeBatch, setActiveBatch] = useState('2029')
  const [activeGroup, setActiveGroup] = useState(isAdmin ? 'All' : 'A')
  const [hideEnglishIII, setHideEnglishIII] = useState(false)

  // Ref for the calendar wrapper to enable auto-scroll
  const calendarWrapperRef = useRef(null)

  // Auto-scroll to 6 AM when early hours are unlocked.
  // When locked, 6 AM is already the first slot — no scroll needed.
  useEffect(() => {
    if (loading || earlyHoursLocked) return
    if (view === 'month' || view === 'agenda') return

    const timer = setTimeout(() => {
      const wrapper = calendarWrapperRef.current
      if (!wrapper) return

      const timeContent = wrapper.querySelector('.rbc-time-content')
      if (!timeContent) return

      // Calculate: total scrollable height / 24 hours * target hour
      const totalHeight = timeContent.scrollHeight
      const hourHeight = totalHeight / 24
      const scrollTarget = hourHeight * SCROLL_TO_HOUR

      timeContent.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    }, 400)

    return () => clearTimeout(timer)
  }, [loading, view, earlyHoursLocked])

  // Apply Filters to Calendar Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // 1. Personal events always show
      if (event.source !== 'college') return true

      // 2. Batch check
      if (event.raw?.batch && event.raw.batch !== activeBatch) return false

      // 3. Group check (allow if Admin chose 'All', or if event is for 'All', or exact match)
      if (activeGroup !== 'All' && event.raw?.group !== 'All' && event.raw?.group !== activeGroup) {
        return false
      }

      // 4. English III check
      if (hideEnglishIII && event.raw?.subject?.toLowerCase().includes('english')) {
        return false
      }

      // 5. Month-view filter: hide daily lecture classes to reduce clutter
      if (view === 'month' && DAILY_CLASS_TYPES.has(event.type)) {
        return false
      }

      return true
    })
  }, [allEvents, activeBatch, activeGroup, hideEnglishIII, view])

  // Upcoming exams for AI generator (next 30 days)
  const upcomingExams = useMemo(() => {
    const now = new Date()
    const thirtyDaysLater = new Date(now)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    return collegeEvents
      .filter((e) => {
        const eventDate = new Date(e.start)
        return (
          (e.type === 'exam' || e.type === 'assignment') &&
          eventDate >= now &&
          eventDate <= thirtyDaysLater
        )
      })
      .map((e) => ({
        title: e.title,
        date: e.raw?.date || e.start.toISOString().split('T')[0],
        type: e.type,
      }))
  }, [collegeEvents])

  // Handle clicking on an existing event
  const handleSelectEvent = useCallback((event) => {
    if (event.source === 'college' && !isAdmin) {
      setSelectedEvent({ ...event, readOnly: true })
    } else {
      setSelectedEvent(event)
    }
  }, [isAdmin])

  // Handle clicking empty slot to create
  const handleSelectSlot = useCallback(({ start, end }) => {
    const date = start.toISOString().split('T')[0]
    const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    setCreateSlot({ date, startTime, endTime })
    setShowCreateModal(true)
  }, [])

  // Create event handler with overlap validation
  async function handleCreate(payload) {
    if (submitting) return

    // Overlap check for college events
    if (isAdmin && payload.batch) {
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
    setShowCreateModal(false)
    setCreateSlot(null)
    try {
      if (isAdmin) {
        await createCollegeEvent({ ...payload, createdBy: user.uid })
      } else {
        await createStudentEvent({ ...payload, studentId: user.uid })
      }
      toast.success(`"${payload.title}" added to your calendar`)
    } catch (err) {
      console.error('Create event failed:', err)
      toast.error(err?.message || 'Could not save event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Edit event handler with overlap validation
  async function handleEdit(payload) {
    if (!selectedEvent?.id || submitting) return
    const source = selectedEvent.source
    const id = selectedEvent.id

    // Overlap check for college events during edit
    if (source === 'college' && payload.batch) {
      const { hasOverlap, conflictingEvent } = checkBatchOverlap(
        payload,
        rawCollegeEvents,
        id,
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
    setSelectedEvent(null)
    try {
      if (source === 'college') {
        await updateCollegeEvent(id, payload)
      } else {
        await updateStudentEvent(id, payload)
      }
      toast.success('Event updated')
    } catch (err) {
      console.error('Update event failed:', err)
      toast.error(err?.message || 'Could not update event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!selectedEvent?.id || submitting) return
    const source = selectedEvent.source
    const id = selectedEvent.id
    setSubmitting(true)
    setSelectedEvent(null)
    try {
      if (source === 'college') {
        await deleteCollegeEvent(id)
      } else {
        await deleteStudentEvent(id)
      }
      toast.success('Event deleted')
    } catch (err) {
      console.error('Delete event failed:', err)
      toast.error(err?.message || 'Could not delete event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const calendarComponents = useMemo(() => ({
    event: CustomEvent,
    toolbar: (props) => (
      <CustomToolbar
        {...props}
        earlyHoursLocked={earlyHoursLocked}
        onToggleLock={() => setEarlyHoursLocked(!earlyHoursLocked)}
      />
    )
  }), [earlyHoursLocked])

  // scrollToTime: react-big-calendar's built-in prop to set the initial scroll position
  const scrollToTime = useMemo(() => {
    const d = new Date()
    d.setHours(SCROLL_TO_HOUR, 0, 0, 0)
    return d
  }, [])

  const name = user?.displayName?.split(' ')[0] || 'there'

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="card p-6 text-center">
          <div className="text-base font-semibold text-red-700">Failed to load calendar</div>
          <p className="mt-1 text-sm text-red-500">{error.message || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hey {name} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            {isAdmin
              ? 'Manage your college schedule'
              : 'Your unified academic & personal calendar'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isStudent && (
            <AIRoutineGenerator
              upcomingExams={upcomingExams}
              studentId={user?.uid}
            />
          )}
          <button
            onClick={() => {
              setCreateSlot({
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
              })
              setShowCreateModal(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl dark:shadow-indigo-900/30"
          >
            <span className="text-base">+</span>
            {isAdmin ? 'College Event' : 'Personal Event'}
          </button>
        </div>
      </div>

      <FilterBar
        batch={activeBatch} setBatch={setActiveBatch}
        group={activeGroup} setGroup={setActiveGroup}
        hideEnglishIII={hideEnglishIII} setHideEnglishIII={setHideEnglishIII}
      />

      {/* Legend */}
      <div className="mb-4">
        <CalendarLegend />
        {view === 'month' && (
          <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500 italic">
            💡 Daily lectures are hidden in month view. Switch to Week or Day view to see all classes.
          </p>
        )}
      </div>

      {/* Calendar */}
      {loading ? (
        <Spinner label="Loading your calendar…" />
      ) : (
        <div className="card overflow-hidden border-slate-200/60 shadow-lg shadow-slate-100/50 dark:shadow-none dark:border-[#232323]">
          <div className="calendar-wrapper p-2 md:p-4" ref={calendarWrapperRef}>
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={setCurrentDate}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter}
              components={calendarComponents}
              views={CALENDAR_VIEWS}
              defaultView="week"
              min={calendarMin}
              max={CALENDAR_MAX}
              step={30}
              timeslots={2}
              popup
              style={CALENDAR_STYLE}
              scrollToTime={scrollToTime}
              dayLayoutAlgorithm="no-overlap"
              formats={{ dayFormat: 'dddd, DD' }}
            />
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <EventModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateSlot(null) }}
        onSubmit={handleCreate}
        initial={createSlot}
        mode={isAdmin ? 'college' : 'student'}
        submitting={submitting}
      />

      {/* Edit Event Modal */}
      {selectedEvent && !selectedEvent.readOnly && (
        <EventModal
          open={true}
          onClose={() => setSelectedEvent(null)}
          onSubmit={handleEdit}
          onDelete={handleDelete}
          initial={selectedEvent}
          mode={selectedEvent.source === 'college' ? 'college' : 'student'}
          submitting={submitting}
        />
      )}

      {/* Read-only event view for students viewing college events */}
      {selectedEvent?.readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md overflow-hidden shadow-2xl dark:border-[#2a2a2a]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 dark:border-[#2a2a2a] dark:from-indigo-900/15 dark:to-purple-900/15">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  College Event
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-[#1e1e1e]"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Title</div>
                <div className="text-sm font-medium text-slate-800 dark:text-zinc-100">{selectedEvent.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Date</div>
                  <div className="text-sm text-slate-700 dark:text-zinc-200">{selectedEvent.raw?.date}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Time</div>
                  <div className="text-sm text-slate-700 dark:text-zinc-200">
                    {selectedEvent.raw?.startTime} – {selectedEvent.raw?.endTime}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Type</div>
                <div className="text-sm capitalize text-slate-700 dark:text-zinc-200">{selectedEvent.type}</div>
              </div>
              {selectedEvent.description && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Description</div>
                  <div className="text-sm text-slate-600 dark:text-zinc-400">{selectedEvent.description}</div>
                </div>
              )}
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-300">
                🔒 College events are read-only for students
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
