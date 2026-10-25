/**
 * MediSync WhatsApp Notification Service
 * Dispatches real-time OPD queue passes, doctor calling alerts,
 * and consultation completed summaries directly to the patient's phone number.
 */

export function getPatientRegisteredPhone(): string {
  try {
    const profileStr = localStorage.getItem('caretrack_patient_profile');
    if (profileStr) {
      const p = JSON.parse(profileStr);
      if (p.phone && String(p.phone).trim()) {
        return cleanPhoneNumber(p.phone);
      }
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.phone && String(u.phone).trim()) {
        return cleanPhoneNumber(u.phone);
      }
    }
  } catch {}

  return '9193902026024';
}

export function cleanPhoneNumber(rawPhone: string): string {
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits || '9193902026024';
}

export interface QueueNotificationParams {
  patientName?: string;
  tokenNumber: string;
  doctorName: string;
  specialty?: string;
  roomNumber?: string | number;
  patientsAhead?: number;
  estimatedWait?: number | string;
  phone?: string;
}

export function buildQueueWhatsAppMessage(params: QueueNotificationParams): string {
  const patient = params.patientName || 'Susmitha';
  const token = params.tokenNumber || 'K-01';
  const doctor = params.doctorName.startsWith('Dr.') ? params.doctorName : `Dr. ${params.doctorName}`;
  const spec = params.specialty ? ` (${params.specialty})` : '';
  const room = params.roomNumber ? `Room ${params.roomNumber}` : 'Room 204';
  
  let queueStatus = '';
  if (params.patientsAhead === 0) {
    queueStatus = '0 patients ahead (Next In Line)';
  } else if (params.patientsAhead === 1) {
    queueStatus = '1 patient ahead';
  } else {
    queueStatus = `${params.patientsAhead ?? 0} patients ahead`;
  }

  const wait = params.estimatedWait !== undefined ? `~${params.estimatedWait} mins` : '~5 mins';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const queueUrl = `${origin}/patient/queue?token=${encodeURIComponent(token)}`;

  return (
    `🏥 MediSync OPD Live Pass\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Patient: ${patient}\n` +
    `🎫 Token: ${token} (Digital Pass)\n` +
    `👨‍⚕️ Doctor: ${doctor}${spec}\n` +
    `📍 Room: ${room}\n` +
    `👥 Status: ${queueStatus}\n` +
    `⏱ Est. Wait: ${wait}\n` +
    `🔗 Track Live: ${queueUrl}`
  );
}

export interface DoctorCallingParams {
  patientName?: string;
  tokenNumber: string;
  doctorName: string;
  specialty?: string;
  roomNumber?: string | number;
}

export function buildDoctorCallingWhatsAppMessage(params: DoctorCallingParams): string {
  const patient = params.patientName || 'Susmitha';
  const token = params.tokenNumber || 'K-01';
  const doctor = params.doctorName.startsWith('Dr.') ? params.doctorName : `Dr. ${params.doctorName}`;
  const spec = params.specialty ? ` (${params.specialty})` : '';
  const room = params.roomNumber ? `Room ${params.roomNumber}` : 'Room 204';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const queueUrl = `${origin}/patient/queue?token=${encodeURIComponent(token)}`;

  return (
    `🚨 MediSync OPD: Doctor Calling Now!\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Patient: ${patient}\n` +
    `🎫 Token: ${token}\n` +
    `👨‍⚕️ Doctor: ${doctor}${spec}\n` +
    `📍 Location: ${room} (2nd Floor, West Wing)\n` +
    `⏱ Status: YOUR TURN HAS ARRIVED!\n` +
    `👉 Please proceed inside ${room} immediately.\n` +
    `🔗 Live Token Pass: ${queueUrl}`
  );
}

export interface ConsultationCompletedParams {
  patientName?: string;
  tokenNumber?: string;
  doctorName: string;
  specialty?: string;
  appointmentDate?: string;
  clinicalNotes?: string;
  prescription?: string;
}

export function buildConsultationCompletedWhatsAppMessage(params: ConsultationCompletedParams): string {
  const patient = params.patientName || 'Susmitha';
  const token = params.tokenNumber || 'K-01';
  const doctor = params.doctorName.startsWith('Dr.') ? params.doctorName : `Dr. ${params.doctorName}`;
  const spec = params.specialty ? ` (${params.specialty})` : '';
  const date = params.appointmentDate || new Date().toISOString().split('T')[0];
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const recordsUrl = `${origin}/patient/records`;

  let notesSection = '';
  if (params.clinicalNotes && params.clinicalNotes.trim()) {
    notesSection = `📋 Doctor's Impression: ${params.clinicalNotes.trim()}\n`;
  }

  let rxSection = '';
  if (params.prescription && params.prescription.trim()) {
    rxSection = `💊 Prescribed Medicines:\n${params.prescription.trim()}\n`;
  }

  return (
    `🏥 MediSync: Consultation Completed & Rx\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Patient: ${patient}\n` +
    `🎫 Token: ${token}\n` +
    `👨‍⚕️ Doctor: ${doctor}${spec}\n` +
    `📅 Date: ${date}\n` +
    `✅ Status: Visit Successfully Completed\n` +
    notesSection +
    rxSection +
    `🔗 View Certified EHR & Rx Slip: ${recordsUrl}`
  );
}

export interface AppointmentNotificationParams {
  patientName?: string;
  tokenNumber?: string;
  doctorName: string;
  specialization?: string;
  appointmentDate: string;
  appointmentTime: string;
  roomNumber?: string | number;
  fee?: number;
  phone?: string;
}

export function buildAppointmentWhatsAppMessage(params: AppointmentNotificationParams): string {
  const patient = params.patientName || 'Susmitha';
  const token = params.tokenNumber || 'K-01';
  const doctor = params.doctorName.startsWith('Dr.') ? params.doctorName : `Dr. ${params.doctorName}`;
  const spec = params.specialization ? ` (${params.specialization})` : '';
  const room = params.roomNumber ? `Room ${params.roomNumber}` : 'Room 204';
  const fee = params.fee ? `₹${params.fee} (Paid)` : '₹750 (Paid)';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const queueUrl = `${origin}/patient/queue?token=${encodeURIComponent(token)}`;

  return (
    `🏥 MediSync Appointment Confirmed\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Patient: ${patient}\n` +
    `🎫 Token: ${token} (Digital OPD Pass)\n` +
    `👨‍⚕️ Doctor: ${doctor}${spec}\n` +
    `📅 Date: ${params.appointmentDate}\n` +
    `⏰ Slot Time: ${params.appointmentTime}\n` +
    `📍 Room: ${room}\n` +
    `💳 Status: Confirmed (${fee})\n` +
    `🔗 Live Queue: ${queueUrl}`
  );
}

export function openWhatsAppNotification(phoneNumber: string, message: string): void {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
