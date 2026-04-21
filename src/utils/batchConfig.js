/**
 * Batch → Group configuration map.
 * Controls which group options are available for each batch.
 * Used by FilterBar, EventModal, and seed logic.
 */
export const BATCH_GROUP_MAP = {
  '2028': ['A', 'B'],
  '2029': ['A', 'B', 'C'],
  '2030': ['A', 'B', 'C'],
}

export const ALL_BATCHES = Object.keys(BATCH_GROUP_MAP)

/**
 * Returns the available group codes for a given batch.
 * Falls back to ['A', 'B', 'C'] if batch is unknown.
 */
export function getGroupsForBatch(batch) {
  return BATCH_GROUP_MAP[batch] || ['A', 'B', 'C']
}
