import { 
  fetchAppointments,
  fetchDoctorLiveQueue, 
  callNextPatientApi, 
  updateAppointmentStatusApi, 
  updateDoctorScheduleApi,
  API_BASE_URL 
} from './supabase';
import { mockDoctors } from './doctors';
import { getCurrentDoctor } from './doctorAuth';

export interface QueueAppointment {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientEmail: string;
  bloodGroup?: string;
  location?: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "10:30 AM"
  problemDescription: string;
  problemCategory: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'skipped' | 'cancelled' | 'scheduled';
  vitals?: {
    bp: string;
    pulse: string;
    temp: string;
    weight: string;
  };
  clinicalNotes?: string;
  prescription?: string;
  calledAt?: string;
  completedAt?: string;
}

export interface DoctorScheduleSettings {
  doctorId: string;
  workingDays: string[];
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // minutes: 15, 20, 30
  breakStart: string; // "13:00"
  breakEnd: string; // "14:00"
  onLeaveDates: string[]; // YYYY-MM-DD
  clinicStatus: 'active' | 'on_break' | 'delayed' | 'offline';
  statusMessage?: string;
}

const QUEUE_STORAGE_KEY = 'caretrack_live_queue_data';
const SCHEDULE_STORAGE_KEY = 'caretrack_doctor_schedules';

// Format today's date in local YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Doctor Unique Prefix Helper ───────────────────────────────────────────
export function getDoctorTokenPrefix(doctorName?: string): string {
  if (!doctorName) return 'OPD';
  const clean = doctorName.replace(/^Dr\.?\s*/i, '').trim();
  const lower = clean.toLowerCase();

  if (lower.startsWith('ananya')) return 'A';
  if (lower.startsWith('amit')) return 'AP';
  if (lower.startsWith('arjun')) return 'AJ';
  if (lower.startsWith('sneha')) return 'S';
  if (lower.startsWith('sanjay')) return 'SD';
  if (lower.startsWith('suresh')) return 'SN';
  if (lower.startsWith('priya')) return 'PS';
  if (lower.startsWith('pooja')) return 'P';
  if (lower.startsWith('ramesh')) return 'R';
  if (lower.startsWith('rajesh')) return 'RG';
  if (lower.startsWith('kavitha')) return 'K';
  if (lower.startsWith('deepa')) return 'D';
  if (lower.startsWith('meera')) return 'M';
  if (lower.startsWith('vikram')) return 'V';
  if (lower.startsWith('lakshmi')) return 'L';
  if (lower.startsWith('nisha')) return 'N';

  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, Math.min(2, clean.length)).toUpperCase();
}

// ─── Chronological Time Sorting Utilities ──────────────────────────────────
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr || typeof timeStr !== 'string') return 9999;
  const clean = timeStr.trim().toUpperCase();

  // Match 12-hour format e.g. "04:40 PM", "4:40 PM", "10:00AM", "12:00 PM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3];

    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  // Match 24-hour format e.g. "16:40"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 9999;
}

export function compareAppointmentsByTime(
  a: { appointmentTime?: string; tokenNumber?: string },
  b: { appointmentTime?: string; tokenNumber?: string }
): number {
  const timeA = parseTimeToMinutes(a.appointmentTime);
  const timeB = parseTimeToMinutes(b.appointmentTime);

  if (timeA !== timeB) {
    return timeA - timeB;
  }

  // Tie-breaker: by token number (e.g. A-01 before A-02)
  return (a.tokenNumber || '').localeCompare(b.tokenNumber || '', undefined, { numeric: true });
}

// ─── Real-Time Server-Sent Events (SSE) Listener ────────────────────────────
let sseConnection: EventSource | null = null;
let pollTimer: any = null;

export function dispatchQueueUpdate(detail?: any) {
  try {
    if (detail) {
      window.dispatchEvent(new CustomEvent('medisync:queue-update', { detail }));
      window.dispatchEvent(new CustomEvent('caretrack:queue-update', { detail }));
    } else {
      window.dispatchEvent(new Event('medisync:queue-update'));
      window.dispatchEvent(new Event('caretrack:queue-update'));
    }
  } catch {}
}

export function initQueueSync(doctorId?: string) {
  if (typeof window === 'undefined') return;

  // Initial fetch of all appointments from backend
  syncQueueFromBackend(doctorId);

  if (!sseConnection) {
    try {
      sseConnection = new EventSource(`${API_BASE_URL}/queue/stream`);

      sseConnection.addEventListener('queue-update', (event) => {
        try {
          const detail = JSON.parse((event as MessageEvent).data);
          syncQueueFromBackend(doctorId || detail.doctorId);
          dispatchQueueUpdate(detail);
        } catch {
          syncQueueFromBackend(doctorId);
          dispatchQueueUpdate();
        }
      });

      sseConnection.addEventListener('schedule-update', () => {
        syncQueueFromBackend(doctorId);
        dispatchQueueUpdate();
      });

      sseConnection.onerror = () => {
        // Fallback polling if SSE is reconnecting
        if (!pollTimer) {
          pollTimer = setInterval(() => {
            syncQueueFromBackend(doctorId);
          }, 4000);
        }
      };
    } catch (e) {
      console.warn('SSE connection initialization error, using polling', e);
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          syncQueueFromBackend(doctorId);
        }, 4000);
      }
    }
  }
}

// Fetch live data from backend and sync all doctor appointments into local reactive cache
export async function syncQueueFromBackend(doctorId?: string): Promise<void> {
  try {
    const allDbAppts = await fetchAppointments();

    if (allDbAppts && Array.isArray(allDbAppts)) {
      // Purge any dummy records like 'Test Patient' or 'Ramesh Verma'
      const cleanDbAppts = allDbAppts.filter((a: any) => {
        const name = (a.patientName || '').toLowerCase();
        return name !== 'test patient' && name !== 'ramesh verma' && !name.includes('dummy');
      });

      const todayStr = getTodayDateString();
      const mapped: QueueAppointment[] = cleanDbAppts.map((a: any) => {
        const isToday = a.appointmentDate === todayStr;
        let tokenNumber = a.tokenNumber || '';
        const docCleanName = (a.doctor?.fullName || a.doctor?.full_name || a.doctorName || 'Doctor').replace(/^Dr\.?\s*/i, '').trim();
        const prefix = (docCleanName[0] || 'A').toUpperCase();
        if (!tokenNumber) {
          tokenNumber = `${prefix}-01`;
        }

        let status = (a.status as any) || (isToday ? 'waiting' : 'scheduled');
        if (!isToday && (status === 'waiting' || status === 'in-consultation')) {
          status = 'scheduled';
        }

        return {
          id: a.id,
          tokenNumber,
          patientName: a.patientName || 'Patient',
          patientAge: a.patientAge || 30,
          patientPhone: a.patientPhone || '',
          patientEmail: a.patientEmail || '',
          bloodGroup: a.bloodGroup || '',
          location: a.location || '',
          doctorId: a.doctor?.id || a.doctorId || '',
          doctorName: a.doctor?.fullName || a.doctor?.full_name || a.doctorName || 'Doctor',
          specialization: a.doctor?.specialization || a.problemCategory || a.specialization || 'Consultation',
          appointmentDate: a.appointmentDate,
          appointmentTime: a.appointmentTime || '10:00 AM',
          problemDescription: a.problemDescription || '',
          problemCategory: a.problemCategory || '',
          status,
        vitals: {
          bp: a.vitalsBp || '120/80 mmHg',
          pulse: a.vitalsPulse || '74 bpm',
          temp: a.vitalsTemp || '98.6 °F',
          weight: a.vitalsWeight || '68 kg',
        },
        clinicalNotes: a.clinicalNotes || '',
        prescription: a.prescription || '',
        calledAt: a.calledAt || '',
        completedAt: a.completedAt || '',
        };
      });

      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(mapped));
      dispatchQueueUpdate();
    }

    if (doctorId) {
      await fetchDoctorLiveQueue(doctorId);
    }
  } catch (err) {
    console.warn('Backend sync failed, maintaining local cache', err);
  }
}

// ─── Local Storage Cache Helpers ────────────────────────────────────────────
export function loadAllAppointments(): QueueAppointment[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: QueueAppointment[] = JSON.parse(raw);
    
    // Purge any legacy dummy appointments (Ramesh Verma, apt-c1, etc.)
    const realAppointments = parsed.filter((item) => {
      const isDummyId = typeof item.id === 'string' && item.id.startsWith('apt-c');
      const isDummyName = [
        'Ramesh Verma',
        'Sujatha Reddy',
        'Venkatesh Murthy',
        'Padma Lakshmi',
        'Kishore Kumar',
        'Siddharth Verma'
      ].includes(item.patientName);
      return !isDummyId && !isDummyName;
    });

    const todayStr = getTodayDateString();
    const usedByDate = new Map<string, Set<string>>();

    realAppointments.forEach((item) => {
      const d = item.appointmentDate || todayStr;
      if (!usedByDate.has(d)) usedByDate.set(d, new Set());
      const used = usedByDate.get(d)!;

      const currentToken = (item.tokenNumber || '').trim().toUpperCase();
      // Deduplicate: if token is missing or already taken on this appointment date
      if (!currentToken || used.has(currentToken)) {
        const prefix = getDoctorTokenPrefix(item.doctorName);
        let maxSeq = 0;
        const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
        used.forEach((t) => {
          const m = t.match(re);
          if (m) {
            const seq = parseInt(m[1], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        });
        let nextSeq = maxSeq + 1;
        let uniqueToken = `${prefix}-${String(nextSeq).padStart(2, '0')}`;
        while (used.has(uniqueToken)) {
          nextSeq++;
          uniqueToken = `${prefix}-${String(nextSeq).padStart(2, '0')}`;
        }
        item.tokenNumber = uniqueToken;
        used.add(uniqueToken);
      } else {
        used.add(currentToken);
      }

      if (item.appointmentDate && item.appointmentDate > todayStr) {
        if (item.status === 'in-consultation' || item.status === 'waiting') {
          item.status = 'scheduled';
        }
      }
    });

    if (realAppointments.length !== parsed.length) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(realAppointments));
    }

    return realAppointments;
  } catch {
    return [];
  }
}

export function saveAllAppointments(appts: QueueAppointment[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(appts));
    dispatchQueueUpdate();
  } catch (e) {
    console.error('Failed to save appointments to localStorage', e);
  }
}

// Get appointments for a specific doctor
export function getAppointmentsForDoctor(doctorId: string, doctorName?: string): QueueAppointment[] {
  const all = loadAllAppointments();
  if (!doctorId && !doctorName) return [];

  // Determine current active doctor context if available
  const session = getCurrentDoctor();
  const currentDoc = session?.doctor;

  let searchId = doctorId || '';
  let searchName = doctorName || '';

  // If doctorId matches current session doctor or doctor name matches session doctor
  if (currentDoc) {
    if (currentDoc.id === doctorId || currentDoc.full_name?.toLowerCase().includes((doctorId || '').toLowerCase())) {
      searchId = currentDoc.id;
      searchName = searchName || currentDoc.full_name || '';
    }
  }

  // Lookup in mockDoctors by id or name
  const foundInMock = mockDoctors.find(
    (d) => d.id === searchId || (searchName && (d.full_name || '').toLowerCase() === searchName.toLowerCase())
  );
  if (foundInMock) {
    searchName = searchName || foundInMock.full_name || '';
  }

  const cleanTargetName = searchName.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
  const nameKeywords = cleanTargetName.split(/\s+/).filter((w) => w.length > 2);

  return all.filter((a) => {
    // 1. Direct ID match
    if (a.doctorId && (a.doctorId === searchId || a.doctorId === doctorId)) {
      return true;
    }

    // 2. Doctor Name match
    if (a.doctorName) {
      const cleanApptName = a.doctorName.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();

      if (cleanTargetName && (cleanApptName === cleanTargetName || cleanApptName.includes(cleanTargetName) || cleanTargetName.includes(cleanApptName))) {
        return true;
      }

      if (nameKeywords.length > 0 && nameKeywords.some((kw) => cleanApptName.includes(kw))) {
        return true;
      }
    }

    // 3. Match if doctorId string itself contains doctor's name (e.g. 'karthik' in doctorId)
    if (doctorId && typeof doctorId === 'string') {
      const cleanInput = doctorId.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
      if (cleanInput.length > 2 && a.doctorName && a.doctorName.toLowerCase().includes(cleanInput)) {
        return true;
      }
    }

    return false;
  }).sort((a, b) => {
    if (a.appointmentDate && b.appointmentDate && a.appointmentDate !== b.appointmentDate) {
      return a.appointmentDate.localeCompare(b.appointmentDate);
    }
    return compareAppointmentsByTime(a, b);
  });
}

// Get live waiting queue for a specific doctor (waiting & in-consultation) FOR TODAY ONLY
export function getLiveQueueForDoctor(doctorId: string, doctorName?: string): {
  currentPatient: QueueAppointment | null;
  waitingQueue: QueueAppointment[];
  completedToday: QueueAppointment[];
} {
  const doctorAppts = getAppointmentsForDoctor(doctorId, doctorName);
  const todayStr = getTodayDateString();
  const todayOnly = doctorAppts.filter((a) => a.appointmentDate === todayStr);

  const currentPatient = todayOnly.find((a) => a.status === 'in-consultation') || null;
  const waitingQueue = todayOnly
    .filter((a) => a.status === 'waiting' && Boolean(a.tokenNumber))
    .sort(compareAppointmentsByTime);
  const completedToday = todayOnly
    .filter((a) => a.status === 'completed')
    .sort(compareAppointmentsByTime);

  return { currentPatient, waitingQueue, completedToday };
}

// ─── Action: Call Next Patient (Backend Connected) ──────────────────────────
export async function callNextPatient(doctorId: string, doctorName?: string): Promise<{ success: boolean; calledPatient: QueueAppointment | null }> {
  try {
    // 1. Send action to backend
    const res = await callNextPatientApi(doctorId);
    if (res.success && res.calledPatient) {
      // 2. Refresh local state
      await syncQueueFromBackend(doctorId);
      const updatedQueue = getLiveQueueForDoctor(doctorId, doctorName);
      return { success: true, calledPatient: updatedQueue.currentPatient };
    }
  } catch (err) {
    console.warn('Backend callNextPatient failed, using local fallback', err);
  }

  // Fallback to local queue advance (Today's queue only)
  const all = loadAllAppointments();
  const doctorAppts = getAppointmentsForDoctor(doctorId, doctorName);
  const todayStr = getTodayDateString();
  const todayOnly = doctorAppts.filter((a) => a.appointmentDate === todayStr);

  const currentActive = todayOnly.find((a) => a.status === 'in-consultation');
  if (currentActive) {
    currentActive.status = 'completed';
    currentActive.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const waitingList = todayOnly
    .filter((a) => a.status === 'waiting' && Boolean(a.tokenNumber))
    .sort(compareAppointmentsByTime);

  const nextWaiting = waitingList[0] || null;
  if (!nextWaiting) {
    saveAllAppointments(all);
    return { success: false, calledPatient: null };
  }

  nextWaiting.status = 'in-consultation';
  nextWaiting.calledAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  saveAllAppointments(all);
  return { success: true, calledPatient: nextWaiting };
}

// ─── Action: Complete Consultation (Backend Connected) ───────────────────────
export async function completeConsultation(
  appointmentId: string,
  clinicalNotes?: string,
  prescription?: string
): Promise<boolean> {
  try {
    await updateAppointmentStatusApi(appointmentId, {
      status: 'completed',
      clinicalNotes,
      prescription,
    });
    syncQueueFromBackend();
  } catch (err) {
    console.warn('Backend completeConsultation failed, updating local cache', err);
  }

  const all = loadAllAppointments();
  const target = all.find((a) => a.id === appointmentId);
  if (!target) return false;

  target.status = 'completed';
  target.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (clinicalNotes) target.clinicalNotes = clinicalNotes;
  if (prescription) target.prescription = prescription;

  saveAllAppointments(all);
  return true;
}

// ─── Action: Skip / Move to End of Queue (Backend Connected) ─────────────────
export async function skipPatient(appointmentId: string, reason?: string): Promise<boolean> {
  try {
    await updateAppointmentStatusApi(appointmentId, {
      status: 'skipped',
      clinicalNotes: reason ? `Patient skipped: ${reason}` : undefined,
    });
    syncQueueFromBackend();
  } catch (err) {
    console.warn('Backend skipPatient failed, updating local cache', err);
  }

  const all = loadAllAppointments();
  const target = all.find((a) => a.id === appointmentId);
  if (!target) return false;

  target.status = 'skipped';
  if (reason) target.clinicalNotes = `Patient skipped: ${reason}`;

  saveAllAppointments(all);
  return true;
}

// ─── Action: Reschedule Appointment (Backend Connected) ──────────────────────
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<boolean> {
  try {
    await updateAppointmentStatusApi(appointmentId, {
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: 'waiting',
    });
    syncQueueFromBackend();
  } catch (err) {
    console.warn('Backend rescheduleAppointment failed, updating local cache', err);
  }

  const all = loadAllAppointments();
  const target = all.find((a) => a.id === appointmentId);
  if (!target) return false;

  target.appointmentDate = newDate;
  target.appointmentTime = newTime;
  target.status = 'waiting';

  saveAllAppointments(all);
  return true;
}

// ─── Action: Cancel Appointment (Backend Connected) ──────────────────────────
export async function cancelAppointment(appointmentId: string, reason?: string): Promise<boolean> {
  try {
    await updateAppointmentStatusApi(appointmentId, {
      status: 'cancelled',
      clinicalNotes: reason ? `Cancelled: ${reason}` : undefined,
    });
    syncQueueFromBackend();
  } catch (err) {
    console.warn('Backend cancelAppointment failed, updating local cache', err);
  }

  const all = loadAllAppointments();
  const target = all.find((a) => a.id === appointmentId);
  if (!target) return false;

  target.status = 'cancelled';
  if (reason) target.clinicalNotes = `Cancelled: ${reason}`;

  saveAllAppointments(all);
  return true;
}

// ─── Schedule & Working Hours Settings ───────────────────────────────────────
export function getDoctorScheduleSettings(doctorId: string): DoctorScheduleSettings {
  try {
    const raw = localStorage.getItem(`${SCHEDULE_STORAGE_KEY}_${doctorId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback below
  }

  return {
    doctorId,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 20,
    breakStart: '13:00',
    breakEnd: '14:00',
    onLeaveDates: [],
    clinicStatus: 'active',
    statusMessage: 'In Clinic · Calling patients on time',
  };
}

export async function saveDoctorScheduleSettings(settings: DoctorScheduleSettings): Promise<void> {
  try {
    localStorage.setItem(`${SCHEDULE_STORAGE_KEY}_${settings.doctorId}`, JSON.stringify(settings));
    dispatchQueueUpdate();

    // Persist to backend database
    await updateDoctorScheduleApi(settings.doctorId, settings);
  } catch (e) {
    console.error('Failed to save schedule settings', e);
  }
}

// ─── Patient-facing Queue View Helper ────────────────────────────────────────
export function getPatientQueueStatus(tokenNumber?: string): {
  currentToken: string;
  userToken: string;
  doctorName: string;
  specialty: string;
  patientsAhead: number;
  estimatedWait: number;
  clinicStatus: string;
  isCurrentTurn: boolean;
  status: 'waiting' | 'in-consultation' | 'completed' | 'skipped' | 'cancelled';
  appointmentDate?: string;
  appointmentTime?: string;
  clinicalNotes?: string;
  prescription?: string;
  calledAt?: string;
  completedAt?: string;
} {
  const all = loadAllAppointments();

  if (all.length === 0) {
    return {
      currentToken: '--',
      userToken: tokenNumber || '--',
      doctorName: 'Specialist Physician',
      specialty: 'Outpatient Care',
      patientsAhead: 0,
      estimatedWait: 0,
      clinicStatus: 'Clinic Ready',
      isCurrentTurn: false,
      status: 'waiting',
    };
  }

  const userAppt = tokenNumber
    ? all.find((a) => a.tokenNumber.toUpperCase() === tokenNumber.toUpperCase() || a.tokenNumber === tokenNumber)
    : (all.find((a) => a.status === 'in-consultation') || all.find((a) => a.status === 'waiting') || all[0]);

  if (!userAppt) {
    return {
      currentToken: '--',
      userToken: tokenNumber || '--',
      doctorName: 'Specialist Physician',
      specialty: 'Outpatient Care',
      patientsAhead: 0,
      estimatedWait: 0,
      clinicStatus: 'Clinic Ready',
      isCurrentTurn: false,
      status: 'waiting',
    };
  }

  const doctorAppts = getAppointmentsForDoctor(userAppt.doctorId, userAppt.doctorName);
  const currentServing = doctorAppts.find((a) => a.status === 'in-consultation');
  const waitingList = doctorAppts.filter((a) => a.status === 'waiting');

  const userIndex = waitingList.findIndex((a) => a.id === userAppt.id || a.tokenNumber === userAppt.tokenNumber);
  const isCurrentTurn = Boolean(currentServing && (currentServing.id === userAppt.id || currentServing.tokenNumber === userAppt.tokenNumber)) || userAppt.status === 'in-consultation';
  const isCompleted = userAppt.status === 'completed';
  const patientsAhead = (isCurrentTurn || isCompleted) ? 0 : (userIndex >= 0 ? userIndex : (currentServing ? 1 : 0));
  const estimatedWait = (isCurrentTurn || isCompleted) ? 0 : Math.max(5, (patientsAhead + (currentServing ? 1 : 0)) * 15);

  const schedule = getDoctorScheduleSettings(userAppt.doctorId);

  return {
    currentToken: currentServing ? currentServing.tokenNumber : '--',
    userToken: userAppt.tokenNumber,
    doctorName: userAppt.doctorName || 'Doctor',
    specialty: userAppt.specialization || 'Consultation',
    patientsAhead,
    estimatedWait,
    clinicStatus: schedule.clinicStatus === 'active' 
      ? (currentServing ? 'Live Queue · In Consultation' : 'Live Queue · Ready to Call') 
      : (schedule.statusMessage || 'In Clinic'),
    isCurrentTurn,
    status: (userAppt.status as any) || 'waiting',
    appointmentDate: userAppt.appointmentDate,
    appointmentTime: userAppt.appointmentTime,
    clinicalNotes: userAppt.clinicalNotes,
    prescription: userAppt.prescription,
    calledAt: userAppt.calledAt,
    completedAt: userAppt.completedAt,
  };
}

// ─── Record New Booking (Bridge between Patient Booking and Doctor Portal) ───
export function recordNewBooking(data: {
  patientName: string;
  patientAge?: number;
  patientPhone?: string;
  patientEmail?: string;
  bloodGroup?: string;
  location?: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  appointmentTime: string;
  problemDescription?: string;
  problemCategory?: string;
  tokenNumber?: string;
  id?: string;
}): string {
  const all = loadAllAppointments();
  const todayStr = getTodayDateString();
  const isToday = data.appointmentDate === todayStr;

  const prefix = getDoctorTokenPrefix(data.doctorName);
  const usedTokens = new Set(
    all
      .filter((a) => a.appointmentDate === data.appointmentDate)
      .map((a) => (a.tokenNumber || '').trim().toUpperCase())
      .filter(Boolean)
  );

  let tokenNumber = (data.tokenNumber && data.tokenNumber.trim().toUpperCase()) || '';
  if (!tokenNumber || usedTokens.has(tokenNumber)) {
    let maxSeq = 0;
    const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    usedTokens.forEach((t) => {
      const m = t.match(re);
      if (m) {
        const seq = parseInt(m[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    let nextSeq = maxSeq + 1;
    let candidate = `${prefix}-${String(nextSeq).padStart(2, '0')}`;
    while (usedTokens.has(candidate)) {
      nextSeq++;
      candidate = `${prefix}-${String(nextSeq).padStart(2, '0')}`;
    }
    tokenNumber = candidate;
  }

  const status: 'waiting' | 'scheduled' = isToday ? 'waiting' : 'scheduled';

  const newAppt: QueueAppointment = {
    id: data.id || ('apt-' + Date.now()),
    tokenNumber,
    patientName: data.patientName || 'Patient',
    patientAge: data.patientAge || 30,
    patientPhone: data.patientPhone || '',
    patientEmail: data.patientEmail || '',
    bloodGroup: data.bloodGroup || '',
    location: data.location || '',
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    specialization: data.specialization,
    appointmentDate: data.appointmentDate,
    appointmentTime: data.appointmentTime,
    problemDescription: data.problemDescription || 'Consultation scheduled via MediSync Portal',
    problemCategory: data.problemCategory || data.specialization,
    status,
    vitals: {
      bp: '120/80 mmHg',
      pulse: '74 bpm',
      temp: '98.4 °F',
      weight: '65 kg',
    },
    clinicalNotes: '',
    prescription: '',
  };

  const existingIdx = all.findIndex((a) => a.id === newAppt.id);
  if (existingIdx >= 0) {
    all[existingIdx] = newAppt;
  } else {
    all.push(newAppt);
  }

  saveAllAppointments(all);
  return tokenNumber;
}

// Check in patient on appointment day
export async function checkInPatient(appointmentId: string): Promise<string> {
  const all = loadAllAppointments();
  const target = all.find(a => a.id === appointmentId);
  if (!target) return '';

  const todayStr = getTodayDateString();
  const doctorCleanName = (target.doctorName || 'Doctor').replace(/^Dr\.?\s*/i, '').trim();
  const doctorInitial = doctorCleanName[0]?.toUpperCase() || 'A';
  const count = all.filter(a => a.doctorId === target.doctorId && a.tokenNumber).length;
  const generatedToken = `${doctorInitial}-${String(count + 1).padStart(2, '0')}`;

  target.tokenNumber = generatedToken;
  target.status = 'waiting';
  target.appointmentDate = todayStr; // Checked in for today's clinic

  saveAllAppointments(all);
  return generatedToken;
}
