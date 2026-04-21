import { collection, doc, writeBatch, serverTimestamp, getDocs, deleteDoc, query } from 'firebase/firestore'
import { db } from '../services/firebase.js'

const seedData = [
  // GROUP A
  { g: 'A', s: 'Fundamental DSA', f: 'Utkarsh', d: 'Monday', st: '10:30', et: '12:45', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'DSA Lab', f: '', d: 'Monday', st: '12:45', et: '14:00', c: 'Class A - 2nd Floor', t: 'assignment' },
  { g: 'A', s: 'Lunch', f: '', d: 'Monday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'A', s: 'React', f: 'Mrinal', d: 'Monday', st: '15:00', et: '17:00', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'React Lab', f: '', d: 'Monday', st: '17:00', et: '18:00', c: 'Class A - 2nd Floor', t: 'assignment' },
  { g: 'A', s: 'Prob & Stats', f: 'Akansha', d: 'Tuesday', st: '12:30', et: '14:15', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'Lunch', f: '', d: 'Tuesday', st: '14:15', et: '15:00', c: '', t: 'holiday' },
  { g: 'A', s: 'English III', f: 'Noor', d: 'Tuesday', st: '15:00', et: '16:30', c: 'Class B1 - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'Fundamental DSA', f: 'Utkarsh', d: 'Wednesday', st: '10:30', et: '12:45', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'DSA Lab', f: '', d: 'Wednesday', st: '12:45', et: '14:00', c: 'Class A - 2nd Floor', t: 'assignment' },
  { g: 'A', s: 'Lunch', f: '', d: 'Wednesday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'A', s: 'Fundamental DSA', f: 'Utkarsh', d: 'Thursday', st: '10:30', et: '12:45', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'DSA Lab', f: '', d: 'Thursday', st: '12:45', et: '14:00', c: 'Class A - 2nd Floor', t: 'assignment' },
  { g: 'A', s: 'Lunch', f: '', d: 'Thursday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'A', s: 'English III', f: 'Noor', d: 'Thursday', st: '15:00', et: '16:30', c: 'Class B1 - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'Prob & Stats', f: 'Akansha', d: 'Friday', st: '12:30', et: '14:15', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'Lunch', f: '', d: 'Friday', st: '14:15', et: '15:00', c: '', t: 'holiday' },
  { g: 'A', s: 'React', f: 'Mrinal', d: 'Friday', st: '15:00', et: '17:00', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'A', s: 'React Lab', f: '', d: 'Friday', st: '17:00', et: '18:00', c: 'Class A - 2nd Floor', t: 'assignment' },

  // GROUP B
  { g: 'B', s: 'React', f: 'Mrinal', d: 'Monday', st: '10:30', et: '12:45', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'React Lab', f: '', d: 'Monday', st: '12:45', et: '14:00', c: 'Class A - 1st Floor', t: 'assignment' },
  { g: 'B', s: 'Lunch', f: '', d: 'Monday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'B', s: 'Fundamental DSA', f: 'Navdeep', d: 'Monday', st: '15:00', et: '17:15', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'DSA Lab', f: '', d: 'Monday', st: '17:15', et: '18:30', c: 'Class C - 2nd Floor', t: 'assignment' },
  { g: 'B', s: 'English III', f: 'Fiza', d: 'Tuesday', st: '11:30', et: '13:15', c: 'Class B1 - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'Lunch', f: '', d: 'Tuesday', st: '13:15', et: '14:15', c: '', t: 'holiday' },
  { g: 'B', s: 'Prob & Stats', f: 'Ayush', d: 'Tuesday', st: '14:15', et: '16:15', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'React', f: 'Mrinal', d: 'Wednesday', st: '10:30', et: '12:45', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'React Lab', f: '', d: 'Wednesday', st: '12:45', et: '14:00', c: 'Class A - 1st Floor', t: 'assignment' },
  { g: 'B', s: 'Lunch', f: '', d: 'Wednesday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'B', s: 'Fundamental DSA', f: 'Navdeep', d: 'Wednesday', st: '15:00', et: '17:15', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'DSA Lab', f: '', d: 'Wednesday', st: '17:15', et: '18:30', c: 'Class A - 2nd Floor', t: 'assignment' },
  { g: 'B', s: 'English III', f: 'Fiza', d: 'Thursday', st: '11:30', et: '13:15', c: 'Class B1 - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'Lunch', f: '', d: 'Thursday', st: '13:15', et: '14:15', c: '', t: 'holiday' },
  { g: 'B', s: 'Prob & Stats', f: 'Ayush', d: 'Thursday', st: '14:15', et: '16:15', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'Lunch', f: '', d: 'Friday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'B', s: 'Fundamental DSA', f: 'Navdeep', d: 'Friday', st: '15:00', et: '17:15', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'B', s: 'DSA Lab', f: '', d: 'Friday', st: '17:15', et: '18:30', c: 'Class C - 2nd Floor', t: 'assignment' },

  // GROUP C
  { g: 'C', s: 'Fundamental DSA', f: 'Navdeep', d: 'Monday', st: '10:30', et: '12:45', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'DSA Lab', f: '', d: 'Monday', st: '12:45', et: '14:00', c: 'Class C - 2nd Floor', t: 'assignment' },
  { g: 'C', s: 'Lunch', f: '', d: 'Monday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'C', s: 'English III', f: 'Fiza', d: 'Monday', st: '15:00', et: '16:30', c: 'Class B1 - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'Fundamental DSA', f: 'Navdeep', d: 'Tuesday', st: '10:30', et: '12:45', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'DSA Lab', f: '', d: 'Tuesday', st: '12:45', et: '14:00', c: 'Class C - 2nd Floor', t: 'assignment' },
  { g: 'C', s: 'Lunch', f: '', d: 'Tuesday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'C', s: 'Prob & Stats', f: 'Akansha', d: 'Tuesday', st: '15:00', et: '16:45', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'English III', f: 'Fiza', d: 'Wednesday', st: '11:30', et: '13:15', c: 'Class B1 - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'Lunch', f: '', d: 'Wednesday', st: '13:15', et: '14:30', c: '', t: 'holiday' },
  { g: 'C', s: 'React', f: 'Mrinal', d: 'Wednesday', st: '14:30', et: '16:45', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'React Lab', f: '', d: 'Wednesday', st: '16:45', et: '17:45', c: 'Class C - 2nd Floor', t: 'assignment' },
  { g: 'C', s: 'Fundamental DSA', f: 'Navdeep', d: 'Thursday', st: '10:30', et: '12:45', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'DSA Lab', f: '', d: 'Thursday', st: '12:45', et: '14:00', c: 'Class C - 2nd Floor', t: 'assignment' },
  { g: 'C', s: 'Lunch', f: '', d: 'Thursday', st: '14:00', et: '15:00', c: '', t: 'holiday' },
  { g: 'C', s: 'Prob & Stats', f: 'Akansha', d: 'Thursday', st: '15:00', et: '16:45', c: 'Class A - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'React', f: 'Mrinal', d: 'Friday', st: '10:30', et: '12:45', c: 'Class C - 2nd Floor', t: 'lecture' },
  { g: 'C', s: 'React Lab', f: '', d: 'Friday', st: '12:45', et: '14:00', c: 'Class C - 2nd Floor', t: 'assignment' },
  { g: 'C', s: 'Lunch', f: '', d: 'Friday', st: '14:00', et: '15:00', c: '', t: 'holiday' }
]

// ==========================================
// BATCH 2028 - GROUP A & GROUP B (Full Week)
// ==========================================
const seedData2028 = [
  // ========== GROUP A — MONDAY ==========
  { g: 'A', s: 'LLD 101', f: 'Kshitij', d: 'Monday', st: '13:45', et: '16:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'LLD Lab', f: '', d: 'Monday', st: '16:00', et: '17:15', c: 'Class A - 1st Floor', t: 'assignment' },

  // ========== GROUP A — TUESDAY ==========
  { g: 'A', s: 'DSA IV', f: 'Ayush', d: 'Tuesday', st: '10:00', et: '12:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'DSA IV Lab', f: '', d: 'Tuesday', st: '12:00', et: '12:30', c: 'Class A - 1st Floor', t: 'assignment' },
  { g: 'A', s: 'JS Programming', f: 'Mrinal', d: 'Tuesday', st: '13:45', et: '16:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'JS Programming Lab', f: '', d: 'Tuesday', st: '16:00', et: '17:00', c: 'Class A - 1st Floor', t: 'assignment' },

  // ========== GROUP A — WEDNESDAY ==========
  { g: 'A', s: 'LLD 101', f: 'Kshitij', d: 'Wednesday', st: '13:45', et: '16:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'LLD Lab', f: '', d: 'Wednesday', st: '16:00', et: '17:15', c: 'Class A - 1st Floor', t: 'assignment' },

  // ========== GROUP A — THURSDAY ==========
  { g: 'A', s: 'DSA IV', f: 'Ayush', d: 'Thursday', st: '10:00', et: '12:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'DSA IV Lab', f: '', d: 'Thursday', st: '12:00', et: '12:30', c: 'Class A - 1st Floor', t: 'assignment' },
  { g: 'A', s: 'JS Programming', f: 'Mrinal', d: 'Thursday', st: '13:45', et: '16:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'JS Programming Lab', f: '', d: 'Thursday', st: '16:00', et: '17:00', c: 'Class A - 1st Floor', t: 'assignment' },

  // ========== GROUP A — FRIDAY ==========
  { g: 'A', s: 'LLD 101', f: 'Kshitij', d: 'Friday', st: '13:45', et: '16:00', c: 'Class A - 1st Floor', t: 'lecture' },
  { g: 'A', s: 'LLD Lab', f: '', d: 'Friday', st: '16:00', et: '17:15', c: 'Class A - 1st Floor', t: 'assignment' },

  // ========== GROUP B — MONDAY ==========
  { g: 'B', s: 'LLD 101', f: 'Kshitij', d: 'Monday', st: '10:00', et: '12:00', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'LLD Lab', f: '', d: 'Monday', st: '12:00', et: '12:45', c: 'Class B - 1st Floor', t: 'assignment' },
  { g: 'B', s: 'DSA IV', f: 'Ayush', d: 'Monday', st: '14:00', et: '16:00', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'DSA IV Lab', f: '', d: 'Monday', st: '16:00', et: '16:30', c: 'Class B - 1st Floor', t: 'assignment' },

  // ========== GROUP B — TUESDAY ==========
  { g: 'B', s: 'JS Programming', f: 'Mrinal', d: 'Tuesday', st: '10:00', et: '12:00', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'JS Programming Lab', f: '', d: 'Tuesday', st: '12:00', et: '13:00', c: 'Class B - 1st Floor', t: 'assignment' },
  { g: 'B', s: 'LLD 101', f: 'Kshitij', d: 'Tuesday', st: '14:00', et: '16:15', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'LLD Lab', f: '', d: 'Tuesday', st: '16:15', et: '17:30', c: 'Class B - 1st Floor', t: 'assignment' },

  // ========== GROUP B — WEDNESDAY ==========
  { g: 'B', s: 'LLD 101', f: 'Kshitij', d: 'Wednesday', st: '14:00', et: '16:15', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'LLD Lab', f: '', d: 'Wednesday', st: '16:15', et: '17:30', c: 'Class B - 1st Floor', t: 'assignment' },

  // ========== GROUP B — THURSDAY ==========
  { g: 'B', s: 'JS Programming', f: 'Mrinal', d: 'Thursday', st: '10:00', et: '12:00', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'JS Programming Lab', f: '', d: 'Thursday', st: '12:00', et: '13:00', c: 'Class B - 1st Floor', t: 'assignment' },
  { g: 'B', s: 'DSA IV', f: 'Ayush', d: 'Thursday', st: '14:00', et: '16:00', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'DSA IV Lab', f: '', d: 'Thursday', st: '16:00', et: '16:30', c: 'Class B - 1st Floor', t: 'assignment' },

  // ========== GROUP B — FRIDAY ==========
  { g: 'B', s: 'LLD 101', f: 'Kshitij', d: 'Friday', st: '14:00', et: '16:15', c: 'Class B - 1st Floor', t: 'lecture' },
  { g: 'B', s: 'LLD Lab', f: '', d: 'Friday', st: '16:15', et: '17:30', c: 'Class B - 1st Floor', t: 'assignment' },

  // ========== SHARED — Product Management (Wed & Fri mornings) ==========
  { g: 'All', s: 'Product Management', f: '', d: 'Wednesday', st: '10:30', et: '12:00', c: 'Class B 1st Floor', t: 'lecture' },
  { g: 'All', s: 'Product Management', f: '', d: 'Friday', st: '10:30', et: '12:00', c: 'Class B 1st Floor', t: 'lecture' },

  // ========== SHARED — LUNCH (Mon–Fri) ==========
  { g: 'All', s: 'Lunch', f: '', d: 'Monday', st: '12:45', et: '13:45', c: '', t: 'holiday' },
  { g: 'All', s: 'Lunch', f: '', d: 'Tuesday', st: '12:45', et: '13:45', c: '', t: 'holiday' },
  { g: 'All', s: 'Lunch', f: '', d: 'Wednesday', st: '12:45', et: '13:45', c: '', t: 'holiday' },
  { g: 'All', s: 'Lunch', f: '', d: 'Thursday', st: '12:45', et: '13:45', c: '', t: 'holiday' },
  { g: 'All', s: 'Lunch', f: '', d: 'Friday', st: '12:45', et: '13:45', c: '', t: 'holiday' },
]

function parseTime(timeStr) {
  // "10:30 AM" -> "10:30"
  const [time, period] = timeStr.trim().split(' ')
  let [hours, minutes] = time.split(':')
  hours = parseInt(hours, 10)
  
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

const dayMap = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
}

async function clearAllCollegeEvents() {
  const colRef = collection(db, 'collegeEvents')
  const snap = await getDocs(query(colRef))
  const BATCH_SIZE = 500
  const docs = snap.docs
  
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = docs.slice(i, i + BATCH_SIZE)
    chunk.forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
}

export async function runTimetableSeed(adminUid) {
  if (!db) throw new Error('Firestore not initialized')
  
  // Progress UI overlay for monitoring
  const progressDiv = document.createElement('div')
  progressDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:#18181b;color:white;padding:20px;border-radius:12px;border:1px solid #3f3f46;box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);font-size:12px;font-family:monospace;max-width:300px;'
  progressDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;color:#818cf8;">🚀 Seed in Progress...</div><div id="seed-status">Initializing...</div>'
  document.body.appendChild(progressDiv)
  const setStatus = (txt) => { document.getElementById('seed-status').innerText = txt }

  try {
    setStatus('Clearing old events...')
    await clearAllCollegeEvents()
    
    const today = new Date()
    const startSunday = new Date(today)
    startSunday.setDate(today.getDate() - today.getDay())
    startSunday.setHours(0, 0, 0, 0)
    
    const eventsToCreate = []
    
    // ---------- BATCH 2029 (existing) ----------
    setStatus(`Processing ${seedData.length} entries for Batch 2029...`)
    for (const item of seedData) {
      const dayOfWeek = dayMap[item.d]
      if (dayOfWeek === undefined) continue

      for (let w = 0; w < 16; w++) {
        const targetDate = new Date(startSunday)
        targetDate.setDate(startSunday.getDate() + dayOfWeek + (w * 7))
        
        eventsToCreate.push({
          title: item.f ? `${item.s} (${item.f})` : item.s,
          date: targetDate.toISOString().split('T')[0],
          startTime: item.st,
          endTime: item.et,
          description: `Room: ${item.c || 'TBA'} | Group: ${item.g}`,
          type: item.t,
          batch: '2029',
          group: item.g,
          subject: item.s,
          faculty: item.f,
          classroom: item.c,
          createdBy: adminUid,
          createdAt: serverTimestamp(),
        })
      }
    }

    // ---------- BATCH 2028 (new) ----------
    setStatus(`Processing ${seedData2028.length} entries for Batch 2028...`)
    for (const item of seedData2028) {
      const dayOfWeek = dayMap[item.d]
      if (dayOfWeek === undefined) continue

      for (let w = 0; w < 16; w++) {
        const targetDate = new Date(startSunday)
        targetDate.setDate(startSunday.getDate() + dayOfWeek + (w * 7))
        
        eventsToCreate.push({
          title: item.f ? `${item.s} (${item.f})` : item.s,
          date: targetDate.toISOString().split('T')[0],
          startTime: item.st,
          endTime: item.et,
          description: `Room: ${item.c || 'TBA'} | Group: ${item.g}`,
          type: item.t,
          batch: '2028',
          group: item.g === 'All' ? 'All' : item.g,
          subject: item.s,
          faculty: item.f,
          classroom: item.c,
          createdBy: adminUid,
          createdAt: serverTimestamp(),
        })
      }
    }

    setStatus(`Pushing ${eventsToCreate.length} events...`)
    const BATCH_SIZE = 500
    for (let i = 0; i < eventsToCreate.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      const chunk = eventsToCreate.slice(i, i + BATCH_SIZE)
      const colRef = collection(db, 'collegeEvents')
      chunk.forEach(ev => batch.set(docRef(colRef), ev))
      await batch.commit()
      setStatus(`Progress: ${Math.min(i + BATCH_SIZE, eventsToCreate.length)} / ${eventsToCreate.length}`)
    }
    
    setStatus('✅ Seeding Complete!')
    setTimeout(() => progressDiv.remove(), 3000)
    return eventsToCreate.length
  } catch (err) {
    setStatus('❌ Error occurred!')
    console.error('[Seed Error]', err)
    progressDiv.style.borderColor = '#ef4444'
    progressDiv.innerHTML += `<div style="color:#ef4444;margin-top:10px;">${err.message}</div>`
    throw err
  }
}

// Global helper for internal batch ref
function docRef(col) { return doc(col) }
