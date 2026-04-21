/**
 * Check whether a new/updated event overlaps with an existing event
 * for the same batch + group combination.
 *
 * @param {Object}   newEvent          - The event being created/updated
 * @param {string}   newEvent.date     - ISO date string (YYYY-MM-DD)
 * @param {string}   newEvent.startTime - "HH:mm"
 * @param {string}   newEvent.endTime   - "HH:mm"
 * @param {string}   newEvent.batch     - Batch identifier (e.g. "2029")
 * @param {string}   newEvent.group     - Group identifier (e.g. "A", "B", "C", "All")
 * @param {Array}    existingEvents     - Array of raw Firestore college event objects
 * @param {string|null} excludeId       - Event ID to exclude (for updates)
 * @returns {{ hasOverlap: boolean, conflictingEvent: Object|null }}
 */
export function checkBatchOverlap(newEvent, existingEvents, excludeId = null) {
  if (!newEvent.batch || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
    return { hasOverlap: false, conflictingEvent: null }
  }

  const newStart = toMinutes(newEvent.startTime)
  const newEnd = toMinutes(newEvent.endTime)

  for (const existing of existingEvents) {
    // Skip the event being edited
    if (excludeId && existing.id === excludeId) continue

    // Must be same date
    if (existing.date !== newEvent.date) continue

    // Must be same batch
    if (existing.batch !== newEvent.batch) continue

    // Group overlap check: "All" overlaps with everything
    if (
      newEvent.group !== 'All' &&
      existing.group !== 'All' &&
      existing.group !== newEvent.group
    ) {
      continue
    }

    // Check time intersection
    const existStart = toMinutes(existing.startTime)
    const existEnd = toMinutes(existing.endTime)

    // Two intervals [a,b) and [c,d) overlap iff a < d && c < b
    if (newStart < existEnd && existStart < newEnd) {
      return { hasOverlap: true, conflictingEvent: existing }
    }
  }

  return { hasOverlap: false, conflictingEvent: null }
}

/**
 * Convert "HH:mm" to total minutes since midnight.
 */
function toMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
