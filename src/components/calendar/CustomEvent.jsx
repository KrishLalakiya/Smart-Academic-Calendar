import { memo } from 'react'

/**
 * Notion-style pastel color scheme:
 *   - bg: light, translucent background fill
 *   - accent: darker solid left-border accent
 *   - text: dark, readable text color
 */
const COLOR_MAP = {
  lecture: { bg: 'rgba(99,102,241,0.15)', accent: '#6366f1', text: '#4338ca' },
  exam: { bg: 'rgba(244,63,94,0.15)', accent: '#f43f5e', text: '#be123c' },
  assignment: { bg: 'rgba(245,158,11,0.15)', accent: '#f59e0b', text: '#b45309' },
  holiday: { bg: 'rgba(20,184,166,0.15)', accent: '#14b8a6', text: '#0f766e' },
  personal: { bg: 'rgba(16,185,129,0.15)', accent: '#10b981', text: '#047857' },
}

const DARK_COLOR_MAP = {
  lecture: { bg: 'rgba(99,102,241,0.28)', accent: '#818cf8', text: '#e0e7ff' },
  exam: { bg: 'rgba(244,63,94,0.28)', accent: '#fb7185', text: '#ffe4e6' },
  assignment: { bg: 'rgba(245,158,11,0.28)', accent: '#fbbf24', text: '#fef3c7' },
  holiday: { bg: 'rgba(20,184,166,0.28)', accent: '#2dd4bf', text: '#ccfbf1' },
  personal: { bg: 'rgba(16,185,129,0.28)', accent: '#34d399', text: '#d1fae5' },
}

const AI_COLORS = {
  light: { bg: 'rgba(139,92,246,0.15)', accent: '#8b5cf6', text: '#6d28d9' },
  dark: { bg: 'rgba(139,92,246,0.28)', accent: '#a78bfa', text: '#ede9fe' },
}

const ICON_MAP = {
  lecture: '📚',
  exam: '📝',
  assignment: '📋',
  holiday: '🎉',
  personal: '✏️',
}

function CustomEvent({ event }) {
  const isDark = document.documentElement.classList.contains('dark')
  const colorMap = isDark ? DARK_COLOR_MAP : COLOR_MAP

  let colors
  if (event.isAiGenerated) {
    colors = isDark ? AI_COLORS.dark : AI_COLORS.light
  } else {
    colors = colorMap[event.type] || colorMap.personal
  }

  const icon = event.isAiGenerated ? '🤖' : ICON_MAP[event.type] || '📌'

  return (
    <div
      className="notion-event-block"
      style={{
        '--event-bg': colors.bg,
        '--event-accent': colors.accent,
        '--event-text': colors.text,
      }}
      title={`${event.title}${event.description ? '\n' + event.description : ''}`}
    >
      <span className="notion-event-icon">{icon}</span>
      <div className="notion-event-content">
        <div className="notion-event-title">{event.title}</div>
        {(event.raw?.classroom || event.raw?.faculty) && (
          <div className="notion-event-meta">
            {[event.raw?.faculty, event.raw?.classroom].filter(Boolean).join(' • ')}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CustomEvent, (prev, next) => {
  const a = prev.event
  const b = next.event
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.type === b.type &&
    a.isAiGenerated === b.isAiGenerated &&
    a.description === b.description &&
    a.raw?.classroom === b.raw?.classroom &&
    a.raw?.faculty === b.raw?.faculty
  )
})
