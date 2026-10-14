import { 
  fetchDoctorLiveQueue, 
  fetchDoctorAppointments, 
  callNextPatientApi, 
  updateAppointmentStatusApi, 
  updateDoctorScheduleApi,
  API_BASE_URL 
} from './supabase';

export interface QueueAppointment {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  patientEmail: string;
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

// ─── Initial Fallback Data ──────────────────────────────────────────────────
function generateDefaultAppointments(): QueueAppointment[] {
  const today = getTodayDateString();

  return [
    {
      id: 'apt-c1',
      tokenNumber: 'A-23',
      patientName: 'Ramesh Verma',
      patientAge: 58,
      patientPhone: '+91 98765 43210',
      patientEmail: 'ramesh.v@example.com',
      doctorId: '1',
      doctorName: 'Dr. Ananya Rao',
      specialization: 'Cardiology',
      appointmentDate: today,
      appointmentTime: '10:00 AM',
      problemDescription: 'Experiencing mild chest tightness on brisk walking and elevated BP readings (150/95) at home.',
      problemCategory: 'Hypertension / Chest Discomfort',
      status: 'in-consultation',
      vitals: { bp: '148/92 mmHg', pulse: '78 bpm', temp: '98.4 °F', weight: '74 kg' },
      calledAt: '10:05 AM',
    },
    {
      id: 'apt-c2',
      tokenNumber: 'A-24',
      patientName: 'Sujatha Reddy',
      patientAge: 46,
      patientPhone: '+91 98480 22334',
      patientEmail: 'sujatha.r@example.com',
      doctorId: '1',
      doctorName: 'Dr. Ananya Rao',
      specialization: 'Cardiology',
      appointmentDate: today,
      appointmentTime: '10:20 AM',
      problemDescription: 'Palpitations after climbing stairs, routine quarterly lipid and ECG review.',
      problemCategory: 'Cardiac Review',
      status: 'waiting',
      vitals: { bp: '130/84 mmHg', pulse: '86 bpm', temp: '98.6 °F', weight: '62 kg' },
    },
    {
      id: 'apt-c3',
      tokenNumber: 'A-25',
      patientName: 'Venkatesh Murthy',
      patientAge: 64,
      patientPhone: '+91 94401 55667',
      patientEmail: 'v.murthy@example.com',
      doctorId: '1',
      doctorName: 'Dr. Ananya Rao',
      specialization: 'Cardiology',
      appointmentDate: today,
      appointmentTime: '10:40 AM',
      problemDescription: 'Post-stent 6-month checkup, breathlessness subsided, reviewing medication tolerance.',
      problemCategory: 'Post-Angioplasty Follow-up',
      status: 'waiting',
      vitals: { bp: '124/80 mmHg', pulse: '72 bpm', temp: '98.1 °F', weight: '68 kg' },
    },
    {
      id: 'apt-c4',
      tokenNumber: 'A-26',
      patientName: 'Padma Lakshmi',
      patientAge: 52,
      patientPhone: '+91 91234 56789',
      patientEmail: 'padma.l@example.com',
      doctorId: '1',
      doctorName: 'Dr. Ananya Rao',
      specialization: 'Cardiology',
      appointmentDate: today,
      appointmentTime: '11:00 AM',
      problemDescription: 'Occasional lightheadedness upon standing up quickly, history of mild sinus bradycardia.',
      problemCategory: 'Arrhythmia Evaluation',
      status: 'waiting',
      vitals: { bp: '118/76 mmHg', pulse: '64 bpm', temp: '98.4 °F', weight: '57 kg' },
    },
    {
      id: 'apt-c5',
      tokenNumber: 'A-27',
      patientName: 'Kishore Kumar',
      patientAge: 49,
      patientPhone: '+91 99887 76655',
      patientEmail: 'kishore.k@example.com',
      doctorId: '1',
      doctorName: 'Dr. Ananya Rao',
      specialization: 'Cardiology',
      appointmentDate: today,
      appointmentTime: '11:20 AM',
      problemDescription: 'Annual executive cardiac health checkup, requesting 2D Echo screening review.',
      problemCategory: 'Preventive Cardiac Screen',
      status: 'waiting',
      vitals: { bp: '136/88 mmHg', pulse: '80 bpm', temp: '98.5 °F', weight: '81 kg' },
    },
  ];
}

// ─── Local Storage Cache Helpers ────────────────────────────────────────────
export function loadAllAppointments(): QueueAppointment[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) {
      const initial = generateDefaultAppointments();
      saveAllAppointments(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return generateDefaultAppointments();
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
export function getAppointmentsForDoctor(doctorId: string): QueueAppointment[] {
  const all = loadAllAppointments();
  const isAnanya = doctorId === '1' || doctorId.toLowerCase().includes('55c0cfbe');
  return all.filter((a) => {
    if (isAnanya) {
      return a.doctorId === '1' || 
             a.doctorId === '55c0cfbe-8dd3-4a96-b436-871c48114874' || 
             a.doctorName?.includes('Ananya');
    }
    return a.doctorId === doctorId;
  });
}

// Get live waiting queue for a specific doctor (waiting & in-consultation)
export function getLiveQueueForDoctor(doctorId: string): {
  currentPatient: QueueAppointment | null;
  waitingQueue: QueueAppointment[];
  completedToday: QueueAppointment[];
} {
  const doctorAppts = getAppointmentsForDoctor(doctorId);
  const currentPatient = doctorAppts.find((a) => a.status === 'in-consultation') || null;
  const waitingQueue = doctorAppts.filter((a) => a.status === 'waiting');
  const completedToday = doctorAppts.filter((a) => a.status === 'completed');

  return { currentPatient, waitingQueue, completedToday };
}

// ─── Action: Call Next Patient (Backend Connected) ──────────────────────────
export async function callNextPatient(doctorId: string): Promise<{ success: boolean; calledPatient: QueueAppointment | null }> {
  try {
    // 1. Send action to backend
    const res = await callNextPatientApi(doctorId);
    if (res.success && res.calledPatient) {
      // 2. Refresh local state
      await syncQueueFromBackend(doctorId);
      const updatedQueue = getLiveQueueForDoctor(doctorId);
      return { success: true, calledPatient: updatedQueue.currentPatient };
    }
  } catch (err) {
    console.warn('Backend callNextPatient failed, using local fallback', err);
  }

  // Fallback to local queue advance
  const all = loadAllAppointments();
  const doctorAppts = all.filter((a) => a.doctorId === doctorId || a.doctorId === '1');

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
  const doctorAppts = getAppointmentsForDoctor(doctorId);

  const currentServing = doctorAppts.find((a) => a.status === 'in-consultation');
  const waitingList = doctorAppts.filter((a) => a.status === 'waiting');

  const userIndex = waitingList.findIndex((a) => a.id === userAppt?.id || a.tokenNumber === tokenNumber);
  const isCurrentTurn = currentServing?.tokenNumber === tokenNumber || userAppt?.status === 'in-consultation';
  const isCompleted = userAppt?.status === 'completed';
  const patientsAhead = (isCurrentTurn || isCompleted) ? 0 : (userIndex >= 0 ? userIndex : (currentServing ? 1 : 0));
  const estimatedWait = (isCurrentTurn || isCompleted) ? 0 : Math.max(5, (patientsAhead + (currentServing ? 1 : 0)) * 15);

  const schedule = getDoctorScheduleSettings(doctorId);

  return {
    currentToken: currentServing ? currentServing.tokenNumber : (waitingList[0]?.tokenNumber || '--'),
    userToken: userAppt?.tokenNumber || tokenNumber,
    doctorName: userAppt?.doctorName || 'Dr. Ananya Rao',
    specialty: userAppt?.specialization || 'Cardiology',
    patientsAhead,
    estimatedWait,
    clinicStatus: schedule.clinicStatus === 'active' ? 'Live Queue · In Consultation' : (schedule.statusMessage || 'In Clinic'),
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
  const tokenNumber = data.tokenNumber || ('A-' + Math.floor(Math.random() * 40 + 30));
  const newAppt: QueueAppointment = {
    id: data.id || ('apt-' + Date.now()),
    tokenNumber,
    patientName: data.patientName || 'Verified Patient',
    patientAge: data.patientAge || 34,
    patientPhone: data.patientPhone || '+91 98765 12345',
    patientEmail: data.patientEmail || 'patient@caretrack.com',
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    specialization: data.specialization,
    appointmentDate: data.appointmentDate,
    appointmentTime: data.appointmentTime,
    problemDescription: data.problemDescription || 'Consultation scheduled via CareTrack Portal',
    problemCategory: data.problemCategory || data.specialization,
    status: 'waiting',
    vitals: {
      bp: '122/80 mmHg',
      pulse: '74 bpm',
      temp: '98.4 °F',
      weight: '67 kg',
    },
  };

  all.push(newAppt);
  saveAllAppointments(all);
  return tokenNumber;
}
