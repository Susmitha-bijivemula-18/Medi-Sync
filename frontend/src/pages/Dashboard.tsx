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
  ShieldCheck
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

  // Listen to live queue updates and SSE events
  useEffect(() => {
    initQueueSync();
    
    const refresh = () => {
      setAppointments(loadAllAppointments());
      setSyncStatus(getSystemSyncStatus());
    };

    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    window.addEventListener('storage', refresh);

    const interval = setInterval(() => {
      setSyncStatus(getSystemSyncStatus());
    }, 4000);

    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
      window.removeEventListener('storage', refresh);
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
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
              activeAppt ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight flex items-center flex-wrap gap-2">
            {activeAppt ? (
              <>
                <span className="truncate">{activeAppt.tokenNumber || 'Active'}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  activeAppt.status === 'in-consultation'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                }`}>
                  {activeAppt.status === 'in-consultation' ? 'Now In Room' : 'In Line'}
                </span>
              </>
            ) : (
              <span className="text-xl sm:text-2xl text-muted-foreground font-semibold">Standby</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {activeAppt ? (
              queueInfo ? (
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
          className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-brand/50 transition-all cursor-pointer group min-w-0 overflow-hidden sm:col-span-2 lg:col-span-1"
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
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {activeAppt.status === 'in-consultation' ? 'Consultation in Progress' : 'Active Today in Clinic'}
                      </span>
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
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">Currently Calling</span>
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5 truncate">
                            {queueInfo?.currentToken || '--'}
                          </p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 border border-border min-w-0 overflow-hidden">
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">Patients Ahead</span>
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5 truncate">
                            {queueInfo?.patientsAhead ?? 0}
                          </p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-xl bg-secondary/50 border border-border min-w-0 overflow-hidden">
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">Estimated Wait</span>
                          <p className="font-heading font-bold text-sm sm:text-base text-foreground mt-0.5 truncate">
                            {activeAppt.status === 'in-consultation' ? 'Now' : `~${queueInfo?.estimatedWait || 0}m`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Token Slip Box */}
                    <div className="w-full md:w-44 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-5 flex flex-col items-center justify-center text-center shadow-md shrink-0 group-hover:scale-[1.02] transition-transform">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                        Your OPD Token
                      </span>
                      <span className="text-4xl font-heading font-extrabold tracking-tight">
                        {activeAppt.tokenNumber || 'A-01'}
                      </span>
                      <span className="text-[11px] mt-3 font-semibold inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs">
                        Live Queue <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" /> Verified MediSync Digital OPD Pass
                  </span>
                  <span className="font-semibold text-brand group-hover:underline">Track Real-Time Status →</span>
                </div>
              </div>

              {/* MediSync Smart Arrival Live Panel */}
              <SmartArrivalCard
                appointment={activeAppt}
                queueState={queueInfo}
                onRefresh={() => setAppointments(loadAllAppointments())}
              />
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

              {/* MediSync Smart Arrival Standby Departure Card */}
              <SmartArrivalCard
                appointment={nextUpcoming}
                queueState={null}
                onRefresh={() => setAppointments(loadAllAppointments())}
              />
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

      {/* ─── 5 & 6. Recent Clinical Records & Upcoming Visits ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* 5. Recent Clinical Records */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-base text-foreground">
                  Recent Clinical Records
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified consultation notes and digital prescriptions
                </p>
              </div>
              <button
                onClick={() => navigate('/patient/records')}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentRecords.length > 0 ? (
              <div className="space-y-2.5">
                {recentRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => navigate('/patient/records')}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/70 hover:border-brand/40 transition-all cursor-pointer group min-w-0 w-full"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                          {record.problemCategory || record.specialization || 'Clinical Summary'}
                        </h4>
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
                  Doctor consultation summaries, digital prescriptions, and vital readings will appear here after your visits.
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
              Print Portfolios
            </span>
          </div>
        </div>

        {/* 6. Upcoming Visits */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-base text-foreground">
                  Upcoming Visits
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scheduled clinic appointments and tokens
                </p>
              </div>
              <button
                onClick={() => navigate('/book-appointment')}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Book Visit
              </button>
            </div>

            {upcomingVisits.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingVisits.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={() => navigate('/patient/appointments')}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/70 hover:border-brand/40 transition-all cursor-pointer group min-w-0 w-full"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex flex-col items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors border border-border/60">
                        <span className="text-[7px] font-bold uppercase tracking-widest opacity-70">Token</span>
                        <span className="text-xs font-bold leading-tight">{appt.tokenNumber || 'A-01'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-xs sm:text-sm text-foreground truncate group-hover:text-brand transition-colors">
                            {appt.doctorName}
                          </h4>
                          {appt.appointmentDate === tomorrowStr && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-brand/10 text-brand border border-brand/20 shrink-0">
                              Tomorrow
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {appt.specialization} • {appt.appointmentDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border/80">
                        {appt.appointmentTime}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-7 px-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center min-w-0">
                <Calendar className="w-7 h-7 text-muted-foreground/40 mb-2 shrink-0" />
                <p className="text-xs font-semibold text-foreground">No upcoming visits scheduled</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3 max-w-xs leading-relaxed">
                  Book your next routine checkup, follow-up, or specialist consultation.
                </p>
                <button
                  onClick={() => navigate('/book-appointment')}
                  className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold cursor-pointer transition-colors border border-border"
                >
                  Schedule Appointment
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Free Rescheduling up to 2 hours prior</span>
            <span 
              onClick={() => navigate('/patient/appointments')}
              className="text-brand font-semibold hover:underline cursor-pointer"
            >
              All Appointments
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
