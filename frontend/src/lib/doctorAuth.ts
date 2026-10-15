import { mockDoctors, getMergedDoctors, type ExtendedDoctor } from './doctors';

export interface DoctorSession {
  doctor: ExtendedDoctor;
  token: string;
  role: 'doctor';
  loginTime: string;
}

const DOCTOR_SESSION_KEY = 'caretrack_doctor_session';

export function getCurrentDoctor(): DoctorSession | null {
  try {
    const raw = localStorage.getItem(DOCTOR_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);

    // Auto-heal session ID if physician name doesn't match default id '1'
    if (session?.doctor?.full_name) {
      const cleanName = session.doctor.full_name.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
      const actualDoc = mockDoctors.find(
        (m) => (m.full_name || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase() === cleanName
      );
      if (actualDoc && session.doctor.id !== actualDoc.id && cleanName !== 'ananya rao') {
        session.doctor.id = actualDoc.id;
        session.doctor.avatar = session.doctor.avatar || actualDoc.avatar;
        session.doctor.qualification = session.doctor.qualification || actualDoc.qualification;
        session.doctor.specialization = session.doctor.specialization || actualDoc.specialization;
        localStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(session));
      }
    }

    return session;
  } catch {
    return null;
  }
}

export function isDoctorAuthenticated(): boolean {
  return getCurrentDoctor() !== null;
}

export async function doctorSignIn(params: {
  email?: string;
  password?: string;
  doctorId?: string;
  name?: string;
  specialization?: string;
  avatar?: string;
}): Promise<DoctorSession> {
  const allMerged = await getMergedDoctors();
  let matchedDoctor: ExtendedDoctor | undefined;

  const cleanName = (params.name || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase();

  // 1. Prioritize direct name match so specialist identity is accurate
  if (cleanName) {
    matchedDoctor = allMerged.find(
      (d) => (d.full_name || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase() === cleanName
    ) || mockDoctors.find(
      (d) => (d.full_name || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase() === cleanName
    );
  }

  // 2. Fallback to preset doctorId
  if (!matchedDoctor && params.doctorId) {
    matchedDoctor = allMerged.find((d) => d.id === params.doctorId) || mockDoctors.find((d) => d.id === params.doctorId);
  }

  // 3. Fallback to email slug match
  if (!matchedDoctor && params.email) {
    const emailLower = params.email.toLowerCase().trim();
    matchedDoctor = mockDoctors.find((d) => {
      const slug = (d.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return (slug && emailLower.includes(slug)) || emailLower.startsWith((d.specialization || '').toLowerCase());
    });
  }

  // If doctor details were provided directly, create or overlay the doctor object
  if (matchedDoctor) {
    if (params.name) matchedDoctor = { ...matchedDoctor, full_name: params.name };
    if (params.specialization) matchedDoctor = { ...matchedDoctor, specialization: params.specialization };
  } else {
    matchedDoctor = {
      id: 'doc-' + Date.now(),
      full_name: params.name || 'Dr. Specialist',
      specialization: params.specialization || 'General Medicine',
      experience_years: 10,
      qualification: 'MBBS, MD',
      consultation_fee: 600,
      available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      available_from: '09:00',
      available_to: '17:00',
      is_active: true,
      created_at: new Date().toISOString(),
      availableStatus: 'Available today',
      nextSlot: 'Today · 10:00 AM',
      rating: '4.9',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.name || 'Doctor')}&background=0284c7&color=ffffff&bold=true&size=256`,
      bio: `Consultant Specialist in ${params.specialization || 'Medicine'}.`,
      languages: ['English', 'Hindi'],
    };
  }

  const session: DoctorSession = {
    doctor: matchedDoctor,
    token: `doc-jwt-${matchedDoctor.id}-${Date.now()}`,
    role: 'doctor',
    loginTime: new Date().toISOString(),
  };

  localStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('caretrack:doctor-auth'));

  return session;
}

export function doctorSignOut(): void {
  localStorage.removeItem(DOCTOR_SESSION_KEY);
  window.dispatchEvent(new Event('caretrack:doctor-auth'));
}
