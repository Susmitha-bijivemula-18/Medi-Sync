import { mockDoctors, type ExtendedDoctor } from './doctors';

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
    return JSON.parse(raw);
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
}): Promise<DoctorSession> {
  let matchedDoctor: ExtendedDoctor | undefined;

  if (params.doctorId) {
    matchedDoctor = mockDoctors.find((d) => d.id === params.doctorId);
  } else if (params.email) {
    // Match by email pattern or name match
    const emailLower = params.email.toLowerCase().trim();
    matchedDoctor = mockDoctors.find((d) => {
      const slug = (d.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return (slug && emailLower.includes(slug)) || emailLower.startsWith((d.specialization || '').toLowerCase());
    });

    // Fallback: match by doctor ID or first doctor if demo email used
    if (!matchedDoctor) {
      if (emailLower.includes('cardio') || emailLower.includes('ananya')) {
        matchedDoctor = mockDoctors[0];
      } else if (emailLower.includes('ortho') || emailLower.includes('arjun')) {
        matchedDoctor = mockDoctors[3];
      } else if (emailLower.includes('general') || emailLower.includes('priya')) {
        matchedDoctor = mockDoctors[2];
      } else {
        matchedDoctor = mockDoctors[0];
      }
    }
  }

  if (!matchedDoctor) {
    matchedDoctor = mockDoctors[0]; // default to Dr. Ananya Rao
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
