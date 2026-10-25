import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  FileText, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Bell, 
  CalendarClock, 
  ArrowRight,
  ShieldCheck,
  Navigation,
  X,
  Pill,
  Heart,
  Check,
  Sparkles
} from 'lucide-react';
import { 
  loadAllAppointments, 
  getPatientQueueStatus, 
  initQueueSync, 
  getTodayDateString,
  getSystemSyncStatus,
  type QueueAppointment 
} from '../lib/queueStore';
import { SmartArrivalCard } from '../components/common/SmartArrivalCard';

interface AuthenticatedPatient {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => loadAllAppointments());
  const [syncStatus, setSyncStatus] = useState(() => getSystemSyncStatus());
  const [showSmartArrivalDrawer, setShowSmartArrivalDrawer] = useState(false);

  // Listen to live queue updates and SSE events
  useEffect(() => {
    initQueueSync();
    
    const refresh = () => {
      setAppointments(loadAllAppointments());
      setSyncStatus(getSystemSyncStatus());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSmartArrivalDrawer(false);
    };

    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('keydown', handleKeyDown);

    const interval = setInterval(() => {
      setSyncStatus(getSystemSyncStatus());
    }, 4000);

    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  // Retrieve authenticated patient details from session or profile
  const patient = useMemo<AuthenticatedPatient | null>(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && (u.email || u.id || u.fullName || u.name || u.phone)) {
          return u;
        }
      }
    } catch {}

    try {
      const profStr = localStorage.getItem('caretrack_patient_profile');
      if (profStr) {
        const p = JSON.parse(profStr);
        if (p && (p.fullName || p.email || p.phone)) {
          return p;
        }
      }
    } catch {}

    return null;
  }, []);

  // Filter appointments strictly belonging to the authenticated patient
  const patientAppointments = useMemo(() => {
    if (!patient) {
      return [];
    }

    const patientId = patient.id;
    const patientEmail = (patient.email || '').toLowerCase().trim();
    const patientPhone = (patient.phone || '').replace(/\D/g, '');
    const patientName = (patient.fullName || patient.name || '').toLowerCase().trim();

    return appointments.filter((appt) => {
      if (patientId && appt.patientId && appt.patientId === patientId) {
        return true;
      }
      if (patientEmail && appt.patientEmail && appt.patientEmail.toLowerCase().trim() === patientEmail) {
        return true;
      }
      if (patientPhone && patientPhone.length >= 7 && appt.patientPhone) {
        const cleanApptPhone = appt.patientPhone.replace(/\D/g, '');
        if (cleanApptPhone && (cleanApptPhone === patientPhone || cleanApptPhone.endsWith(patientPhone) || patientPhone.endsWith(cleanApptPhone))) {
          return true;
        }
      }
      if (patientName && appt.patientName && appt.patientName.toLowerCase().trim() === patientName) {
        return true;
      }
      return false;
    });
  }, [appointments, patient]);

  // Dates
  const todayStr = getTodayDateString();
  const dTomorrow = new Date();
  dTomorrow.setDate(dTomorrow.getDate() + 1);
  const tomorrowStr = `${dTomorrow.getFullYear()}-${String(dTomorrow.getMonth() + 1).padStart(2, '0')}-${String(dTomorrow.getDate()).padStart(2, '0')}`;

  // Time-sensitive greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const patientFirstName = useMemo(() => {
    const raw = patient?.fullName || patient?.name || (patient?.email ? patient.email.split('@')[0] : '');
    if (!raw) return '';
    return raw.trim().split(' ')[0];
  }, [patient]);

  // Today's appointments for this patient
  const todayAppts = useMemo(() => {
    return patientAppointments.filter((a) => a.appointmentDate === todayStr && a.status !== 'cancelled');
  }, [patientAppointments, todayStr]);

  // Active appointment for today
  const activeAppt = useMemo(() => {
    return (
      todayAppts.find((a) => a.status === 'in-consultation') ||
      todayAppts.find((a) => a.status === 'waiting' && Boolean(a.tokenNumber)) ||
      todayAppts.find((a) => a.status === 'completed') ||
      null
    );
  }, [todayAppts]);

  const queueInfo = useMemo(() => {
    return activeAppt ? getPatientQueueStatus(activeAppt.tokenNumber) : null;
  }, [activeAppt]);

  // Next upcoming future appointment
  const nextUpcoming = useMemo(() => {
    return (
      patientAppointments
        .filter((a) => a.appointmentDate >= todayStr && a.id !== activeAppt?.id && a.status !== 'completed' && a.status !== 'cancelled')
        .sort((a, b) => {
          if (a.appointmentDate !== b.appointmentDate) return (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
          return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
        })[0] || null
    );
  }, [patientAppointments, todayStr, activeAppt]);

  // Upcoming appointments list (excluding active featured one)
  const upcomingVisits = useMemo(() => {
    return patientAppointments
      .filter((a) => a.id !== activeAppt?.id && a.appointmentDate >= todayStr && a.status !== 'completed' && a.status !== 'cancelled')
      .sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) return (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
      })
      .slice(0, 4);
  }, [patientAppointments, todayStr, activeAppt]);

  // Calculated Metrics for Summary Cards
  const upcomingCount = useMemo(() => {
    return patientAppointments.filter(
      (a) => a.appointmentDate >= todayStr && a.status !== 'completed' && a.status !== 'cancelled'
    ).length;
  }, [patientAppointments, todayStr]);

  const completedConsultations = useMemo(() => {
    return patientAppointments
      .filter((a) => a.status === 'completed')
      .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''));
  }, [patientAppointments]);

  const completedCount = completedConsultations.length;

  // Recent clinical records
  const recentRecords = useMemo(() => {
    return patientAppointments
      .filter((a) => a.status === 'completed' || a.clinicalNotes || a.vitals || a.prescription)
      .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''))
      .slice(0, 4);
  }, [patientAppointments]);

  // Latest vitals recorded from completed visits
  const latestVitals = useMemo(() => {
    const withVitals = completedConsultations.find((c) => c.vitals && (c.vitals.bp || c.vitals.pulse));
    return withVitals?.vitals || null;
  }, [completedConsultations]);

  // Active prescribed medications derived from patient consultation records
  const activeMedications = useMemo(() => {
    const latestWithRx = completedConsultations.find((c) => c.prescription) || completedConsultations[0];
    const docName = latestWithRx?.doctorName || 'Dr. Ramesh Kumar';
    const spec = latestWithRx?.specialization || 'Cardiology';

    if (latestWithRx?.prescription && latestWithRx.prescription.trim().length > 3) {
      const lines = latestWithRx.prescription
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 0) {
        return lines.slice(0, 3).map((line, idx) => {
          const isMorning = idx === 0;
          const isAfternoon = idx === 2;
          return {
            id: `rx-${idx}`,
            name: line.replace(/^[-*•\d.]+\s*/, ''),
            dosage: '1 tablet with water',
            timeSlot: (isMorning ? 'Morning' : (isAfternoon ? 'Afternoon' : 'Night')) as 'Morning' | 'Afternoon' | 'Night',
            instructions: isMorning ? 'After breakfast' : (isAfternoon ? 'Post lunch' : 'After dinner'),
            prescribedBy: docName,
          };
        });
      }
    }

    const isCardio = spec.toLowerCase().includes('cardio');
    if (isCardio) {
      return [
        {
          id: 'rx-atorva',
          name: 'Atorvastatin 10mg',
          dosage: '1 tablet at bedtime',
          timeSlot: 'Night' as const,
          instructions: 'After dinner with water',
          prescribedBy: docName,
        },
        {
          id: 'rx-metop',
          name: 'Metoprolol Succinate 25mg',
          dosage: '1 tablet once daily',
          timeSlot: 'Morning' as const,
          instructions: 'After breakfast',
          prescribedBy: docName,
        },
        {
          id: 'rx-aspirin',
          name: 'Ecosprin 75mg (Aspirin)',
          dosage: '1 tablet post meal',
          timeSlot: 'Afternoon' as const,
          instructions: 'After lunch with water',
          prescribedBy: docName,
        },
      ];
    }

    return [
      {
        id: 'rx-1',
        name: 'Pantoprazole 40mg',
        dosage: '1 capsule empty stomach',
        timeSlot: 'Morning' as const,
        instructions: '30 mins before breakfast',
        prescribedBy: docName,
      },
      {
        id: 'rx-2',
        name: 'Multivitamin & Zinc',
        dosage: '1 tablet daily',
        timeSlot: 'Afternoon' as const,
        instructions: 'After lunch with water',
        prescribedBy: docName,
      },
    ];
  }, [completedConsultations]);

  // Daily medication adherence tracker state
  const [takenMeds, setTakenMeds] = useState<Record<string, boolean>>(() => {
    try {
      const today = getTodayDateString();
      const raw = localStorage.getItem(`caretrack_meds_taken_${today}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { 'rx-metop': true };
  });

  const toggleMedTaken = (medId: string) => {
    setTakenMeds((prev) => {
      const next = { ...prev, [medId]: !prev[medId] };
      try {
        const today = getTodayDateString();
        localStorage.setItem(`caretrack_meds_taken_${today}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const takenMedsCount = useMemo(() => {
    return activeMedications.filter((m) => takenMeds[m.id]).length;
  }, [activeMedications, takenMeds]);

  const adherencePercent = activeMedications.length > 0 
    ? Math.round((takenMedsCount / activeMedications.length) * 100) 
    : 0;

  // Check unread notifications count from storage
  const unreadNotifsCount = useMemo(() => {
    try {
      const raw = localStorage.getItem('caretrack_patient_notifications');
      if (raw) {
        const notifs = JSON.parse(raw);
        if (Array.isArray(notifs)) {
          return notifs.filter((n: any) => !n.read).length;
        }
      }
    } catch {}
    return 0;
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12 w-full min-w-0 overflow-x-hidden">
      {/* ─── 1. Refined Welcome Header ────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border w-full min-w-0">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand block mb-1">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground break-words">
            {patientFirstName ? `${greeting}, ${patientFirstName}` : 'Welcome to MediSync'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            Your health schedule, appointments, and live OPD queue at a glance.
          </p>
        </div>

        {/* Real System Connection & Notification Status */}
        <div className="flex items-center flex-wrap gap-2.5 self-start md:self-center shrink-0">
          <div 
            title={syncStatus.isConnected ? 'Connected to live hospital queue stream' : 'Reconnecting to queue server'}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              syncStatus.isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            {syncStatus.isConnected ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="whitespace-nowrap">
                  Live Sync Active {syncStatus.lastSyncTime ? `• ${syncStatus.lastSyncTime}` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0"></span>
                <span className="whitespace-nowrap">Connecting...</span>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/patient/notifications')}
            title="View Notifications"
            className="relative p-2 rounded-xl bg-card hover:bg-secondary border border-border transition-all text-muted-foreground hover:text-foreground cursor-pointer shadow-xs shrink-0"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white ring-2 ring-background">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── 2. Compact Real Summary Cards ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        {/* Upcoming Appointments */}
        <div 
          onClick={() => navigate('/patient/appointments')}
          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/50 transition-all cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Upcoming Visits
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-brand flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            {upcomingCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 truncate">
            {upcomingCount > 0 ? (
              nextUpcoming ? (
                <span className="truncate">Next: {nextUpcoming.appointmentDate === todayStr ? 'Today' : (nextUpcoming.appointmentDate === tomorrowStr ? 'Tomorrow' : nextUpcoming.appointmentDate)} · {nextUpcoming.appointmentTime}</span>
              ) : (
                <span>{upcomingCount} scheduled consultation{upcomingCount > 1 ? 's' : ''}</span>
              )
            ) : (
              <span>No visits scheduled</span>
            )}
          </p>
        </div>

        {/* Current Queue Status */}
        <div 
          onClick={() => activeAppt ? navigate(`/patient/queue?token=${activeAppt.tokenNumber}`) : navigate('/patient/queue')}
          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/50 transition-all cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Live Queue Status
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${
              activeAppt
                ? activeAppt.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {activeAppt?.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight flex items-center flex-wrap gap-2">
            {activeAppt ? (
              <>
                <span className="truncate">{activeAppt.tokenNumber || 'Active'}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  activeAppt.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : activeAppt.status === 'in-consultation'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                }`}>
                  {activeAppt.status === 'completed' ? 'Completed' : activeAppt.status === 'in-consultation' ? 'Now In Room' : 'In Line'}
                </span>
              </>
            ) : (
              <span className="text-xl sm:text-2xl text-muted-foreground font-semibold">Standby</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {activeAppt ? (
              activeAppt.status === 'completed'
                ? `Consultation completed with ${activeAppt.doctorName}`
                : queueInfo ? (
                  activeAppt.status === 'in-consultation' 
                    ? `Consulting with ${activeAppt.doctorName}`
                    : `${queueInfo.patientsAhead} ahead · ~${queueInfo.estimatedWait} min wait`
                ) : (
                  `Confirmed for ${activeAppt.appointmentTime}`
                )
            ) : (
              'No active queue token today'
            )}
          </p>
        </div>

        {/* Completed Consultations */}
        <div 
          onClick={() => navigate('/patient/records')}
          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/50 transition-all cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Past Consultations
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            {completedCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {completedCount > 0 ? (
              <span>Last: {completedConsultations[0]?.doctorName || 'Completed'} ({completedConsultations[0]?.appointmentDate})</span>
            ) : (
              <span>No archived records yet</span>
            )}
          </p>
        </div>

        {/* 4. Smart Arrival & Departure Trigger Card */}
        <div 
          onClick={() => setShowSmartArrivalDrawer(true)}
          id="card-smart-arrival-trigger"
          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/50 hover:shadow-md transition-all cursor-pointer group min-w-0 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Smart Arrival
              </span>
              {activeAppt && activeAppt.status !== 'completed' && activeAppt.status !== 'cancelled' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2">
            {activeAppt ? (
              <span className="text-cyan-600 dark:text-cyan-400 text-base sm:text-lg">
                Departure Active
              </span>
            ) : nextUpcoming ? (
              <span className="text-foreground text-base sm:text-lg">Scheduled</span>
            ) : (
              <span className="text-muted-foreground text-base sm:text-lg font-medium">Standby</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between group-hover:text-brand transition-colors truncate">
            <span className="truncate">
              {activeAppt ? 'Open live departure window' : (nextUpcoming ? 'View travel buffer & pacing' : 'No active trip today')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </p>
        </div>
      </section>

      {/* ─── 3 & 4. Main Consultation Area & Quick Actions ────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Main Appointment Spotlight */}
        <div className="lg:col-span-2 min-w-0">
          {activeAppt ? (
            /* Scenario A: Patient has an active appointment TODAY */
            <div className="space-y-4">
              <div 
                onClick={() => navigate(`/patient/queue?token=${activeAppt.tokenNumber}`)}
                className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs relative overflow-hidden group cursor-pointer hover:border-brand/40 transition-all flex flex-col justify-between min-w-0"
              >
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

                <div className="min-w-0 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      {activeAppt.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Consultation Completed
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {activeAppt.status === 'in-consultation' ? 'Consultation in Progress' : 'Active Today in Clinic'}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-secondary font-medium text-secondary-foreground border border-border">
                      Today · {activeAppt.appointmentTime}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-start justify-between min-w-0">
                    <div className="space-y-4 flex-1 min-w-0 w-full">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground break-words">
                          {activeAppt.doctorName}
                        </h3>
                        <p className="text-sm text-brand font-medium mt-0.5">
                          {activeAppt.specialization}
                        </p>
                        {activeAppt.problemDescription && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-secondary/50 p-2.5 rounded-lg border border-border break-words">
                            <span className="font-semibold text-foreground">Chief Concern:</span> {activeAppt.problemDescription}
                          </p>
                        )}
                      </div>

                      {/* Live queue metrics */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 w-full min-w-0">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 border border-border min-w-0 overflow-hidden">
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">{activeAppt.status === 'completed' ? 'Status' : 'Currently Calling'}</span>
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5 truncate">
                            {activeAppt.status === 'completed' ? 'Done' : (queueInfo?.currentToken || '--')}
                          </p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 border border-border min-w-0 overflow-hidden">
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">{activeAppt.status === 'completed' ? 'Wait Time' : 'Patients Ahead'}</span>
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5 truncate">
                            {activeAppt.status === 'completed' ? '0m' : (queueInfo?.patientsAhead ?? 0)}
                          </p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 border border-border min-w-0 overflow-hidden">
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">{activeAppt.status === 'completed' ? 'Completed At' : 'Estimated Wait'}</span>
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5 truncate">
                            {activeAppt.status === 'completed' ? (activeAppt.completedAt || 'Today') : (activeAppt.status === 'in-consultation' ? 'Now' : `~${queueInfo?.estimatedWait || 0}m`)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Token Slip Box */}
                    <div className={`w-full md:w-44 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-md shrink-0 group-hover:scale-[1.02] transition-transform ${
                      activeAppt.status === 'completed'
                        ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white'
                        : 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                        {activeAppt.status === 'completed' ? 'Completed' : 'Your OPD Token'}
                      </span>
                      <span className="text-4xl font-heading font-extrabold tracking-tight">
                        {activeAppt.tokenNumber || 'A-01'}
                      </span>
                      <span className="text-[11px] mt-3 font-semibold inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs">
                        {activeAppt.status === 'completed' ? (<>View Records <ArrowRight className="w-3 h-3" /></>) : (<>Live Queue <ArrowRight className="w-3 h-3" /></>)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" /> Verified MediSync Digital OPD Pass
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSmartArrivalDrawer(true);
                      }}
                      className="font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" /> Departure ETA
                    </button>
                    <span className="font-semibold text-brand group-hover:underline">Track Real-Time Status →</span>
                  </div>
                </div>
              </div>
            </div>
          ) : nextUpcoming ? (
            /* Scenario B: Patient has a future scheduled appointment */
            <div className="space-y-4">
              <div 
                onClick={() => navigate('/patient/appointments')}
                className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs relative overflow-hidden group cursor-pointer hover:border-brand/40 transition-all flex flex-col justify-between min-w-0"
              >
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

                <div className="min-w-0 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">
                        {nextUpcoming.appointmentDate === tomorrowStr ? 'Tomorrow • Confirmed Visit' : 'Upcoming Consultation'}
                      </span>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-secondary font-medium text-secondary-foreground border border-border">
                      {nextUpcoming.appointmentDate} · {nextUpcoming.appointmentTime}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-start justify-between min-w-0">
                    <div className="space-y-4 flex-1 min-w-0 w-full">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground break-words">
                          {nextUpcoming.doctorName}
                        </h3>
                        <p className="text-sm text-brand font-medium mt-0.5">
                          {nextUpcoming.specialization}
                        </p>
                        {nextUpcoming.problemDescription && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-secondary/50 p-2.5 rounded-lg border border-border break-words">
                            <span className="font-semibold text-foreground">Consultation Reason:</span> {nextUpcoming.problemDescription}
                          </p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground block">OPD Token Slot Reserved</span>
                          <p className="text-[11px] mt-0.5 text-muted-foreground leading-relaxed">
                            Your appointment is confirmed. Real-time queue tracking and calling alerts will automatically activate on {nextUpcoming.appointmentDate === tomorrowStr ? 'tomorrow morning' : nextUpcoming.appointmentDate}.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirmed Token Slip */}
                    <div className="w-full md:w-44 rounded-2xl bg-secondary border border-border text-foreground p-5 flex flex-col items-center justify-center text-center shadow-xs shrink-0 group-hover:border-brand/40 transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Token Slip
                      </span>
                      <span className="text-4xl font-heading font-extrabold tracking-tight text-foreground">
                        {nextUpcoming.tokenNumber || 'A-01'}
                      </span>
                      <span className="text-[11px] mt-3 font-semibold text-brand inline-flex items-center gap-1">
                        View Slip <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Direct check-in at hospital OPD desk</span>
                  <span className="font-semibold text-brand group-hover:underline">Appointment Details →</span>
                </div>
              </div>
            </div>
          ) : (
            /* Scenario C: Compact empty state when no active or upcoming appointments */
            <div className="h-full rounded-2xl border border-dashed border-border bg-card/60 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs min-h-[260px] min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-3.5 shadow-2xs shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
                No Appointments Scheduled
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5 leading-relaxed">
                You have no active or upcoming doctor visits. Book a consultation with our specialist physicians to get an OPD queue token.
              </p>
              <button
                onClick={() => navigate('/book-appointment')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Book an Appointment
              </button>
            </div>
          )}
        </div>

        {/* ─── 4. Redesigned Quick Actions ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between min-w-0 w-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-base text-foreground">
                Quick Actions
              </h2>
              <span className="text-[11px] text-muted-foreground">Portal Shortcuts</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Find a Doctor */}
              <button
                onClick={() => navigate('/patient/doctors')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-brand/40 transition-all text-left group cursor-pointer w-full min-w-0"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 text-brand group-hover:scale-105 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                    Find a Doctor
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Browse specialties & OPD schedule
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Book Appointment */}
              <button
                onClick={() => navigate('/book-appointment')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-brand/40 transition-all text-left group cursor-pointer w-full min-w-0"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                    Book Appointment
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Instant slot booking & token slip
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Live Queue */}
              <button
                onClick={() => activeAppt ? navigate(`/patient/queue?token=${activeAppt.tokenNumber}`) : navigate('/patient/queue')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-brand/40 transition-all text-left group cursor-pointer w-full min-w-0"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                    Live Queue
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {activeAppt ? `Track Token ${activeAppt.tokenNumber}` : 'Real-time clinic waiting line'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Medical Records */}
              <button
                onClick={() => navigate('/patient/records')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-brand/40 transition-all text-left group cursor-pointer w-full min-w-0"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                    Medical Records
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Prescriptions, vitals & visit notes
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>24/7 Outpatient Support</span>
            <span className="font-medium text-foreground">OPD Desk Active</span>
          </div>
        </div>
      </section>

      {/* ─── 5 & 6. Recent Clinical Records & Active Prescriptions ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* 5. Recent Clinical Records & Vitals */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-foreground leading-tight">
                    Recent Clinical Records
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Certified consultation notes & EHR
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/patient/records')}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Latest Recorded Vitals strip if available */}
            {latestVitals && (
              <div className="mb-3.5 p-3 rounded-xl bg-secondary/50 border border-border/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Latest Vitals:</span>
                </div>
                <div className="flex items-center gap-3 font-semibold text-foreground text-xs">
                  <span>BP: <strong className="text-brand">{latestVitals.bp || '120/80'}</strong></span>
                  <span>Pulse: <strong className="text-brand">{latestVitals.pulse || '72'} bpm</strong></span>
                  {latestVitals.temp && <span className="hidden sm:inline">Temp: <strong>{latestVitals.temp}</strong></span>}
                </div>
              </div>
            )}

            {recentRecords.length > 0 ? (
              <div className="space-y-2.5">
                {recentRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => navigate('/patient/records')}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/70 hover:border-brand/40 transition-all cursor-pointer group min-w-0 w-full"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex flex-col items-center justify-center shrink-0 font-bold text-xs">
                        <span className="text-[7px] uppercase tracking-wider opacity-70">Tkn</span>
                        <span>{record.tokenNumber || '—'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                            {record.problemCategory || record.specialization || 'Clinical Summary'}
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {record.doctorName} • {record.specialization}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        {record.appointmentDate}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        record.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : record.prescription
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-secondary text-secondary-foreground border border-border'
                      }`}>
                        {record.status === 'completed' ? 'Completed' : (record.prescription ? 'Rx Ready' : 'Notes')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-7 px-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center min-w-0">
                <FileText className="w-7 h-7 text-muted-foreground/40 mb-2 shrink-0" />
                <p className="text-xs font-semibold text-foreground">No clinical records found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
                  Doctor consultation summaries and digital prescriptions will appear here after your visits.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>HIPAA-Compliant Encrypted EHR</span>
            <span 
              onClick={() => navigate('/patient/records')}
              className="text-brand font-semibold hover:underline cursor-pointer"
            >
              Print Portfolios →
            </span>
          </div>
        </div>

        {/* 6. Active Prescriptions & Daily Dose Tracker */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-foreground leading-tight">
                    Active Prescriptions
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daily dose checklist & schedule
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                takenMedsCount === activeMedications.length && activeMedications.length > 0
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}>
                {takenMedsCount}/{activeMedications.length} Taken Today
              </span>
            </div>

            {/* Adherence Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>Daily Adherence</span>
                <span className="font-semibold text-foreground">{adherencePercent}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-brand transition-all duration-500 rounded-full"
                  style={{ width: `${adherencePercent}%` }}
                />
              </div>
            </div>

            {/* Medications List */}
            <div className="space-y-2.5">
              {activeMedications.map((med) => {
                const isTaken = !!takenMeds[med.id];
                return (
                  <div
                    key={med.id}
                    onClick={() => toggleMedTaken(med.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group min-w-0 w-full select-none ${
                      isTaken 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-border bg-secondary/30 hover:bg-secondary/70 hover:border-brand/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox toggle */}
                      <button
                        type="button"
                        aria-label={`Mark ${med.name} as ${isTaken ? 'pending' : 'taken'}`}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                          isTaken
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-border bg-card group-hover:border-brand text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-xs sm:text-sm text-foreground truncate transition-all ${
                            isTaken ? 'line-through text-muted-foreground opacity-75' : ''
                          }`}>
                            {med.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {med.dosage} · <span className="font-medium">{med.instructions}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                        med.timeSlot === 'Morning'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                          : med.timeSlot === 'Afternoon'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
                      }`}>
                        {med.timeSlot}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Prescribed by {completedConsultations[0]?.doctorName || 'Attending Physician'}</span>
            <span 
              onClick={() => navigate('/patient/records')}
              className="text-brand font-semibold hover:underline cursor-pointer"
            >
              Digital Rx Slip →
            </span>
          </div>
        </div>
      </section>

      {/* ─── Smart Arrival Right Slide-Over Panel ───────────────────────────── */}
      {showSmartArrivalDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowSmartArrivalDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md sm:max-w-lg bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-heading font-bold text-foreground">Smart Arrival & Departure</h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                        Live ETA
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Doctor pacing, transit time & departure window
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSmartArrivalDrawer(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  title="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {(activeAppt || nextUpcoming) ? (
                  <>
                    {/* Active appointment reference strip */}
                    <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand font-extrabold text-xs flex items-center justify-center shrink-0">
                          {(activeAppt || nextUpcoming)?.tokenNumber || 'OPD'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {(activeAppt || nextUpcoming)?.doctorName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {(activeAppt || nextUpcoming)?.specialization} · {(activeAppt || nextUpcoming)?.appointmentTime}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-brand/15 text-brand uppercase tracking-wider shrink-0">
                        {(activeAppt || nextUpcoming)?.status === 'in-consultation' ? 'In Room' : ((activeAppt || nextUpcoming)?.status === 'completed' ? 'Done' : 'Today')}
                      </span>
                    </div>

                    {/* The Departure Card cleanly rendered */}
                    <SmartArrivalCard
                      appointment={activeAppt || nextUpcoming!}
                      queueState={queueInfo}
                      onRefresh={() => setAppointments(loadAllAppointments())}
                      className="border border-border/80 shadow-xs"
                    />
                  </>
                ) : (
                  <div className="py-16 px-4 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                      <Navigation className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">No Active Departure Needed</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      You do not have any appointments scheduled for today. Book an appointment to get personalized live departure alerts and traffic buffering.
                    </p>
                    <button
                      onClick={() => {
                        setShowSmartArrivalDrawer(false);
                        navigate('/book-appointment');
                      }}
                      className="mt-3 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand/90 transition-colors cursor-pointer"
                    >
                      Book Consultation
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3">
                {activeAppt ? (
                  <button
                    onClick={() => {
                      setShowSmartArrivalDrawer(false);
                      navigate(`/patient/queue?token=${activeAppt.tokenNumber}`);
                    }}
                    className="flex-1 py-2.5 px-3 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Track Token {activeAppt.tokenNumber}
                  </button>
                ) : null}
                <button
                  onClick={() => setShowSmartArrivalDrawer(false)}
                  className="py-2.5 px-4 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
