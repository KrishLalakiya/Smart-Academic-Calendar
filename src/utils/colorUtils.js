/**
 * Utility functions for handling dynamic colors and text contrast.
 */

/**
 * Converts a hex color string to an RGBA string with the specified opacity.
 * @param {string} hex - The hex color (e.g., "#ff0000" or "ff0000").
 * @param {number} opacity - The opacity value between 0 and 1.
 * @returns {string} The RGBA color string.
 */
export function hexToRgba(hex, opacity = 1) {
  if (!hex) return `rgba(0, 0, 0, ${opacity})`
  
  // Remove hash if present
  hex = hex.replace(/^#/, '')
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Calculates the ideal text color (light or dark) given a background hex color
 * to ensure maximum contrast and legibility. Uses the YIQ formula.
 * @param {string} hexBg - The hex color of the background.
 * @param {boolean} isDarkTheme - Whether the current theme is dark.
 * @returns {string} The ideal text color hex or rgba.
 */
export function getContrastText(hexBg, isDarkTheme = false) {
  if (!hexBg) return isDarkTheme ? '#f8fafc' : '#0f172a' // slate-50 or slate-900

  // Remove hash
  let hex = hexBg.replace(/^#/, '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')

  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0

  // Standard YIQ formula for perceived brightness
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  // For dark mode, the event block backgrounds are semi-transparent over a dark surface.
  // Generally, inside dark mode, standard white text is always perfectly legible 
  // on our 20% opacity backgrounds. But for the solid accent, we can calculate it.
  // Wait, the background is mostly dark in dark mode anyway?
  // Let's just use YIQ. If yiq >= 128 it's a light color, < 128 is dark.
  
  return yiq >= 128 ? '#0f172a' : '#ffffff'
}
