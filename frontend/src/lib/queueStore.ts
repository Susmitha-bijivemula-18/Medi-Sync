import { 
  fetchDoctorLiveQueue, 
  fetchDoctorAppointments, 
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
  status: 'waiting' | 'in-consultation' | 'completed' | 'skipped' | 'cancelled';
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
  return d.toISOString().split('T')[0];
}

// ─── Real-Time Server-Sent Events (SSE) Listener ────────────────────────────
let sseConnection: EventSource | null = null;
let pollTimer: any = null;

export function initQueueSync(doctorId?: string) {
  if (typeof window === 'undefined') return;

  // Initial fetch from backend
  syncQueueFromBackend(doctorId || '1');

  if (!sseConnection) {
    try {
      sseConnection = new EventSource(`${API_BASE_URL}/queue/stream`);

      sseConnection.addEventListener('queue-update', (event) => {
        try {
          const detail = JSON.parse((event as MessageEvent).data);
          syncQueueFromBackend(doctorId || detail.doctorId || '1');
          window.dispatchEvent(new CustomEvent('caretrack:queue-update', { detail }));
        } catch {
          syncQueueFromBackend(doctorId || '1');
          window.dispatchEvent(new Event('caretrack:queue-update'));
        }
      });

      sseConnection.addEventListener('schedule-update', () => {
        syncQueueFromBackend(doctorId || '1');
        window.dispatchEvent(new Event('caretrack:queue-update'));
      });

      sseConnection.onerror = () => {
        // Fallback polling if SSE is reconnecting
        if (!pollTimer) {
          pollTimer = setInterval(() => {
            syncQueueFromBackend(doctorId || '1');
          }, 3500);
        }
      };
    } catch (e) {
      console.warn('SSE connection initialization error, using polling', e);
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          syncQueueFromBackend(doctorId || '1');
        }, 3500);
      }
    }
  }
}

// Fetch live data from backend and sync into local reactive cache
export async function syncQueueFromBackend(doctorId: string = '1'): Promise<void> {
  try {
    await fetchDoctorLiveQueue(doctorId);
    const doctorAppts = await fetchDoctorAppointments(doctorId);

    if (doctorAppts && doctorAppts.length > 0) {
      const mapped: QueueAppointment[] = doctorAppts.map((a: any) => ({
        id: a.id,
        tokenNumber: a.tokenNumber,
        patientName: a.patientName,
        patientAge: a.patientAge || 35,
        patientPhone: a.patientPhone || '',
        patientEmail: a.patientEmail || '',
        doctorId: a.doctor?.id || doctorId,
        doctorName: a.doctor?.fullName || a.doctor?.full_name || 'Dr. Ananya Rao',
        specialization: a.doctor?.specialization || a.problemCategory || 'Cardiology',
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime || '10:00 AM',
        problemDescription: a.problemDescription || '',
        problemCategory: a.problemCategory || '',
        status: (a.status as any) || 'waiting',
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
      }));

      // Merge with any other doctor appointments in local storage
      const isAnanya = doctorId === '1' || doctorId.toLowerCase().includes('55c0cfbe');
      const existingAll = loadAllAppointments().filter(item => {
        if (isAnanya) {
          return item.doctorId !== '1' && 
                 item.doctorId !== '55c0cfbe-8dd3-4a96-b436-871c48114874' && 
                 !item.doctorName?.includes('Ananya');
        }
        return item.doctorId !== doctorId;
      });
      const merged = [...mapped, ...existingAll];
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('caretrack:queue-update'));
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
    window.dispatchEvent(new Event('caretrack:queue-update'));
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
  });
}

// Get live waiting queue for a specific doctor (waiting & in-consultation)
export function getLiveQueueForDoctor(doctorId: string, doctorName?: string): {
  currentPatient: QueueAppointment | null;
  waitingQueue: QueueAppointment[];
  completedToday: QueueAppointment[];
} {
  const doctorAppts = getAppointmentsForDoctor(doctorId, doctorName);
  const currentPatient = doctorAppts.find((a) => a.status === 'in-consultation') || null;
  const waitingQueue = doctorAppts.filter((a) => a.status === 'waiting');
  const completedToday = doctorAppts.filter((a) => a.status === 'completed');

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

  // Fallback to local queue advance
  const all = loadAllAppointments();
  const doctorAppts = getAppointmentsForDoctor(doctorId, doctorName);

  const currentActive = doctorAppts.find((a) => a.status === 'in-consultation');
  if (currentActive) {
    currentActive.status = 'completed';
    currentActive.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const nextWaiting = doctorAppts.find((a) => a.status === 'waiting');
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
    window.dispatchEvent(new Event('caretrack:queue-update'));

    // Persist to backend database
    await updateDoctorScheduleApi(settings.doctorId, settings);
  } catch (e) {
    console.error('Failed to save schedule settings', e);
  }
}

// ─── Patient-facing Queue View Helper ────────────────────────────────────────
export function getPatientQueueStatus(tokenNumber: string = 'A-27'): {
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

  const userAppt = all.find((a) => a.tokenNumber === tokenNumber) || all[0];
  const doctorId = userAppt?.doctorId || '1';
  const doctorAppts = getAppointmentsForDoctor(doctorId, userAppt?.doctorName);

  const currentServing = doctorAppts.find((a) => a.status === 'in-consultation');
  const waitingList = doctorAppts.filter((a) => a.status === 'waiting');

  const userIndex = waitingList.findIndex((a) => a.id === userAppt?.id || a.tokenNumber === tokenNumber);
  const isCurrentTurn = Boolean(currentServing && currentServing.tokenNumber === tokenNumber) || userAppt?.status === 'in-consultation';
  const isCompleted = userAppt?.status === 'completed';
  const patientsAhead = (isCurrentTurn || isCompleted) ? 0 : (userIndex >= 0 ? userIndex : (currentServing ? 1 : 0));
  const estimatedWait = (isCurrentTurn || isCompleted) ? 0 : Math.max(5, (patientsAhead + (currentServing ? 1 : 0)) * 15);

  const schedule = getDoctorScheduleSettings(doctorId);

  return {
    currentToken: currentServing ? currentServing.tokenNumber : '--',
    userToken: userAppt?.tokenNumber || tokenNumber,
    doctorName: userAppt?.doctorName || 'Dr. Specialist',
    specialty: userAppt?.specialization || 'Consultation',
    patientsAhead,
    estimatedWait,
    clinicStatus: schedule.clinicStatus === 'active' 
      ? (currentServing ? 'Live Queue · In Consultation' : 'Live Queue · Ready to Call') 
      : (schedule.statusMessage || 'In Clinic'),
    isCurrentTurn,
    status: (userAppt?.status as any) || 'waiting',
    appointmentDate: userAppt?.appointmentDate,
    appointmentTime: userAppt?.appointmentTime,
    clinicalNotes: userAppt?.clinicalNotes,
    prescription: userAppt?.prescription,
    calledAt: userAppt?.calledAt,
    completedAt: userAppt?.completedAt,
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
  
  // Format clean token: Doctor Initial + sequential number for today
  const doctorInitial = (data.doctorName || 'Doctor')
    .replace(/^Dr\.?\s*/i, '')
    .trim()[0]?.toUpperCase() || 'A';
  
  const doctorTodayCount = all.filter(
    (a) => a.doctorId === data.doctorId && a.appointmentDate === data.appointmentDate
  ).length;
  
  const tokenNumber = data.tokenNumber || `${doctorInitial}-${String(doctorTodayCount + 1).padStart(2, '0')}`;
  
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
    problemDescription: data.problemDescription || 'Consultation scheduled via CareTrack Portal',
    problemCategory: data.problemCategory || data.specialization,
    status: 'waiting',
    vitals: {
      bp: '120/80 mmHg',
      pulse: '74 bpm',
      temp: '98.4 °F',
      weight: '65 kg',
    },
  };

  all.push(newAppt);
  saveAllAppointments(all);
  return tokenNumber;
}
