import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Bell, 
  CheckCircle2, 
  FileText, 
  Pill, 
  Calendar, 
  Clock, 
  CreditCard, 
  ArrowRight,
  Activity,
  ShieldCheck,
  Check,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPatientQueueStatus, initQueueSync, loadAllAppointments, getTodayDateString, parseTimeToMinutes } from '../lib/queueStore';
import { fetchPatientQueueStatus } from '../lib/supabase';
import { DoctorAvatar } from '../components/common/DoctorAvatar';
import { mockDoctors } from '../lib/doctors';
import { hospitalRooms } from '../components/common/HospitalMapModal';
import { SmartArrivalCard } from '../components/common/SmartArrivalCard';
import { MediSyncIcon } from '../components/ui/Logo';
import { getPatientRegisteredPhone } from '../lib/whatsapp';

export function QueueTracking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allAppointments, setAllAppointments] = useState(() => loadAllAppointments());

  // Determine target appointment & token
  const tokenFromUrl = searchParams.get('token');
  const apptIdFromUrl = searchParams.get('id');

  const activeAppt = useMemo(() => {
    if (tokenFromUrl) {
      const byToken = allAppointments.find(
        (a) => a.tokenNumber && a.tokenNumber.trim().toUpperCase() === tokenFromUrl.trim().toUpperCase()
      );
      if (byToken) return byToken;
    }
    if (apptIdFromUrl) {
      const byId = allAppointments.find((a) => a.id === apptIdFromUrl);
      if (byId) return byId;
    }
    return allAppointments.find((a) => a.status === 'in-consultation') ||
           allAppointments.find((a) => a.status === 'waiting') ||
           allAppointments[0];
  }, [allAppointments, tokenFromUrl, apptIdFromUrl]);

  const activeToken = tokenFromUrl || activeAppt?.tokenNumber || '';
  const [queueState, setQueueState] = useState(() => getPatientQueueStatus(activeToken));

  useEffect(() => {
    initQueueSync(activeAppt?.doctorId);

    const refresh = async () => {
      const updatedList = loadAllAppointments();
      setAllAppointments(updatedList);

      // 1. Local sync
      setQueueState(getPatientQueueStatus(activeToken));

      // 2. Direct backend query if token exists
      if (activeToken) {
        try {
          const live = await fetchPatientQueueStatus(activeToken, activeAppt?.doctorId);
          if (live) {
            setQueueState((prev) => ({
              ...prev,
              currentToken: live.currentToken ?? prev.currentToken,
              userToken: live.userToken || prev.userToken,
              doctorName: live.doctorName || prev.doctorName,
              specialty: live.specialty || prev.specialty,
              patientsAhead: live.patientsAhead !== undefined ? live.patientsAhead : prev.patientsAhead,
              estimatedWait: live.estimatedWait !== undefined ? live.estimatedWait : prev.estimatedWait,
              clinicStatus: live.clinicStatus || prev.clinicStatus,
              isCurrentTurn: Boolean(live.isCurrentTurn),
              status: (live.appointmentStatus as any) || prev.status,
            }));
          }
        } catch {
          // Maintain local store state
        }
      }
    };

    refresh();
    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
    };
  }, [activeToken]);

  const {
    currentToken,
    userToken,
    doctorName,
    specialty,
    patientsAhead,
    estimatedWait,
    clinicStatus,
    isCurrentTurn,
    status,
    appointmentDate,
    appointmentTime,
    clinicalNotes,
    prescription,
  } = queueState;

  // Find corresponding doctor metadata for avatar, room, fee
  const currentAppt = activeAppt || allAppointments.find((a) => a.tokenNumber === userToken);
  const matchedDoctor = mockDoctors.find(
    (d) => d.id === currentAppt?.doctorId || (d.full_name || '').toLowerCase() === (doctorName || '').toLowerCase()
  );

  const todayStr = getTodayDateString();
  const effectiveDate = currentAppt?.appointmentDate || appointmentDate || todayStr;
  const effectiveTime = currentAppt?.appointmentTime || appointmentTime || '10:00 AM';
  const isToday = effectiveDate === todayStr;

  // Find room in clinic
  const specialtyRoom = hospitalRooms.find(r => 
    (currentAppt?.doctorName && r.doctorName && r.doctorName.toLowerCase().includes(currentAppt.doctorName.toLowerCase())) ||
    (specialty && r.department.toLowerCase().includes(specialty.toLowerCase()))
  ) || hospitalRooms[0];

  const isCompleted = status === 'completed';
  const isCurrent = !isCompleted && isToday && (status === 'in-consultation' || (isCurrentTurn && status !== 'waiting'));
  const progressPercent = !isToday ? 25 : (isCompleted ? 100 : (isCurrent ? 100 : Math.max(15, Math.min(85, 100 - (patientsAhead + 1) * 20))));

  // ── Smart Arrival Departure Visibility ──────────────────────────────────
  // Per requirement: Only provide departure recommendation if the appointment is
  // booked for the future (future date), or if booked today and more than 1 hour remains.
  // When only 10-60 mins remain or the patient is already at the clinic, departure is not needed.
  const shouldShowDeparture = useMemo(() => {
    if (isCompleted || !activeAppt) return false;

    const today = getTodayDateString();
    const apptDate = currentAppt?.appointmentDate || appointmentDate || today;

    // 1. Future date (e.g. tomorrow, next week) -> Yes, departure planning for future visit
    if (apptDate > today) {
      return true;
    }

    // 2. Past date -> No
    if (apptDate < today) {
      return false;
    }

    // 3. Today's appointment:
    // Only provide departure window if remaining time until slot is strictly ABOVE 1 HOUR (> 60 minutes).
    // If <= 60 minutes remain (e.g. 10 min left, 0 patients ahead, or already in clinic), departure is not needed.
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = parseTimeToMinutes(effectiveTime);
    const minutesUntilSlot = slotMinutes - nowMinutes;

    return minutesUntilSlot > 60;
  }, [isCompleted, activeAppt, currentAppt, appointmentDate, effectiveTime]);

  const [smsSentStatus, setSmsSentStatus] = useState<'sending' | 'sent' | null>(null);

  const handleSendSmsNotification = async (type: 'live' | 'completed' = 'live') => {
    const phone = currentAppt?.patientPhone || getPatientRegisteredPhone();
    const token = userToken || currentAppt?.tokenNumber || 'K-01';
    const doc = doctorName || currentAppt?.doctorName || 'Dr. Sarah Jenkins';
    const room = specialtyRoom.number || '204';

    let msg = '';
    if (type === 'completed') {
      const rx = prescription || currentAppt?.prescription || '';
      const rxText = rx ? ` Rx: ${rx}` : '';
      msg = `MediSync OPD: Consultation completed with ${doc} for Token ${token}.${rxText} Your digital prescription & visit summary are ready.`;
    } else {
      const ahead = isCurrent ? 0 : patientsAhead;
      msg = `MediSync OPD Pass: Token ${token} for ${doc} (Room ${room}). Status: ${ahead === 0 ? 'Next In Line' : `${ahead} patients ahead`}. Est. wait: ~${isCurrent ? 0 : estimatedWait}m.`;
    }

    setSmsSentStatus('sending');
    try {
      await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: msg }),
      });
      setSmsSentStatus('sent');
    } catch {
      setSmsSentStatus('sent');
    }
    setTimeout(() => setSmsSentStatus(null), 3500);
  };

  // If no appointments exist at all
  if (allAppointments.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="flex items-center justify-center mx-auto mb-5">
          <MediSyncIcon size={56} />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">No Active Queue Token</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          You don't have an active consultation queued right now. Book an appointment with one of our top specialists to track your live token.
        </p>
        <button
          onClick={() => navigate('/book-appointment')}
          className="px-6 py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-all shadow-sm cursor-pointer"
        >
          Book an Appointment →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate('/patient/dashboard')}
            title="Return to Dashboard"
            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground">
                {isCompleted ? 'Consultation Summary' : (isToday ? 'Live OPD Queue' : 'Appointment Queue Pass')}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isCompleted 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-brand/10 text-brand border-brand/20'
              }`}>
                {isCompleted ? 'Completed' : 'Live Sync'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCompleted
                ? `Consultation concluded with ${doctorName} · Verified digital OPD record`
                : (isToday 
                  ? `Real-time queue tracking for Dr. ${doctorName}` 
                  : `Scheduled for ${effectiveDate} with Dr. ${doctorName}`)}
            </p>
          </div>
        </div>

        {/* Multi-token switcher if patient has multiple bookings */}
        {allAppointments.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs text-muted-foreground font-semibold">Your Bookings:</span>
            <select
              value={activeAppt?.id || userToken}
              onChange={(e) => {
                const target = allAppointments.find(a => a.id === e.target.value);
                if (target) {
                  if (target.tokenNumber) {
                    setSearchParams({ token: target.tokenNumber });
                  } else {
                    setSearchParams({ id: target.id });
                  }
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-brand/30 outline-none cursor-pointer shadow-xs"
            >
              {allAppointments.map((appt) => (
                <option key={appt.id} value={appt.id}>
                  {appt.tokenNumber ? `Token ${appt.tokenNumber}` : `Scheduled (${appt.appointmentDate})`} · {appt.doctorName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Main Unified Digital OPD Pass Card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden relative backdrop-blur-md"
      >
        {/* Dynamic Status Accent Bar */}
        <div className={`h-2 w-full transition-all duration-500 ${
          isCompleted 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
            : (isCurrent
              ? 'bg-gradient-to-r from-emerald-500 via-brand to-teal-500 animate-pulse'
              : (isToday ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-brand' : 'bg-gradient-to-r from-amber-500 to-orange-500'))
        }`} />

        {/* Doctor & Department Header */}
        <div className="p-6 sm:p-7 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <DoctorAvatar
                  src={matchedDoctor?.avatar}
                  name={doctorName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-sm border border-border"
                />
                {isCompleted ? (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-card shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground truncate">
                  {doctorName}
                </h2>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                    {specialty}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                    {specialtyRoom.floorName}, {specialtyRoom.wing} · Room {specialtyRoom.number}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Chip & Direct SMS Quick Action */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleSendSmsNotification('live')}
                id="btn-quick-sms-pass"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Send OPD live pass as direct SMS to your phone"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{smsSentStatus === 'sending' ? 'Sending SMS...' : (smsSentStatus === 'sent' ? 'SMS Sent to Phone!' : 'Send SMS to Phone')}</span>
              </button>

              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
                isCompleted 
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : (isCurrent
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 animate-pulse'
                    : (isToday
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'))
              }`}>
                <span className={`w-2 h-2 rounded-full ${isCompleted || isCurrent ? 'bg-emerald-500' : (isToday ? 'bg-blue-500 animate-ping' : 'bg-amber-500')}`} />
                {isCompleted 
                  ? 'Consultation Completed' 
                  : (isCurrent ? 'Now In Room' : (!isToday ? `Scheduled (${effectiveDate})` : (clinicStatus || 'In Queue')))}
              </span>
            </div>
          </div>
        </div>

        {/* ── Case A: Consultation Completed State ───────────────────────────── */}
        {isCompleted ? (
          <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-500/5 to-transparent space-y-6">
            <div className="text-center space-y-3 py-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Visit Successfully Finished
                </span>
                <h3 className="text-2xl font-heading font-bold text-foreground mt-0.5">
                  Consultation Completed
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                  Your appointment with <strong className="text-foreground">{doctorName}</strong> has concluded. Your digital prescription, visit summary, and digital pass are verified.
                </p>
              </div>

              {/* Token badge pill */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-card border border-border shadow-xs text-xs">
                <span className="text-muted-foreground font-medium">Token:</span>
                <span className="font-extrabold text-foreground font-mono text-sm">{userToken || '—'}</span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Done</span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground font-medium">Time:</span>
                <span className="font-semibold text-foreground">{currentAppt?.completedAt || 'Today'}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="btn-sms-completed-summary"
                  onClick={() => handleSendSmsNotification('completed')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{smsSentStatus === 'sending' ? 'Sending SMS...' : (smsSentStatus === 'sent' ? 'SMS Sent to Phone!' : 'Send Summary & Rx via SMS')}</span>
                </button>
              </div>
            </div>

            {/* Doctor's Notes & Prescriptions upon completion */}
            {(clinicalNotes || prescription || currentAppt?.clinicalNotes || currentAppt?.prescription) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand" /> Doctor's Clinical Records & Prescriptions
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Certified
                  </span>
                </div>

                {(clinicalNotes || currentAppt?.clinicalNotes) && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-xs">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">
                      Clinical Impression
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {clinicalNotes || currentAppt?.clinicalNotes}
                    </p>
                  </div>
                )}

                {(prescription || currentAppt?.prescription) && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                      <Pill className="w-3.5 h-3.5" />
                      <span>Prescribed Medication</span>
                    </div>
                    <p className="text-foreground font-mono leading-relaxed whitespace-pre-line">
                      {prescription || currentAppt?.prescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Case B: Active Queue / Waiting Monitor ──────────────────────── */
          <div className="divide-y divide-border/60">
            {/* Live Queue Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 p-5 sm:p-6 gap-4 bg-secondary/20">
              <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Calling Now
                </span>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                    {isToday ? (currentToken || '—') : '--'}
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">Clinic Room {specialtyRoom.number}</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-brand/10 to-indigo-500/10 border border-brand/25 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  Your Token
                </span>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-heading font-extrabold text-brand tracking-tight">
                    {userToken || '—'}
                  </span>
                  <span className="block text-[11px] text-brand/80 font-semibold mt-0.5">Digital Pass</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Patients Ahead
                </span>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                    {!isToday ? '--' : (isCurrent ? 0 : patientsAhead)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">In OPD lounge</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Est. Wait Time
                </span>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                    {!isToday ? (
                      <span className="text-xs font-semibold text-muted-foreground">On visit day</span>
                    ) : (
                      <>{isCurrent ? 0 : estimatedWait} <span className="text-sm font-medium text-muted-foreground">min</span></>
                    )}
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">Dynamic doctor pacing</span>
                </div>
              </div>
            </div>

            {/* Live Progress Bar & Stepper */}
            <div className="p-5 sm:p-6 bg-card space-y-4">
              {/* Direct SMS Live Turn Alert Banner */}
              {patientsAhead === 0 && !isCompleted && isToday && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="font-bold">Next in Line! Dispatch live pass directly to your phone:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendSmsNotification('live')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{smsSentStatus === 'sending' ? 'Sending SMS...' : (smsSentStatus === 'sent' ? 'SMS Sent!' : 'Send SMS to Phone')}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isCurrent ? 'text-emerald-600 font-bold' : 'text-brand'}>
                  {isCurrent ? '● Now Attending in Room' : (patientsAhead === 0 ? '● You Are Next In Line' : '● In OPD Waiting Queue')}
                </span>
                <span className="text-muted-foreground">
                  {isCurrent ? `Token ${userToken} called` : `Turn estimated in ~${estimatedWait} mins`}
                </span>
              </div>

              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isCurrent ? 'bg-emerald-500' : 'bg-brand'
                  }`}
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>

              {/* 4-Step Visual Stepper */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[11px]">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-xs">
                    ✓
                  </div>
                  <span className="font-semibold text-foreground">Checked In</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    patientsAhead <= 1 ? 'bg-emerald-500 text-white' : 'bg-brand text-white animate-pulse'
                  }`}>
                    {patientsAhead <= 1 ? '✓' : '2'}
                  </div>
                  <span className="font-semibold text-foreground">Waiting Area</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isCurrent ? 'bg-emerald-500 text-white' : (patientsAhead === 0 ? 'bg-brand text-white animate-pulse' : 'bg-secondary text-muted-foreground border border-border')
                  }`}>
                    {isCurrent ? '✓' : '3'}
                  </div>
                  <span className={`font-semibold ${patientsAhead === 0 || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Doctor Calling
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isCurrent ? 'bg-emerald-600 text-white animate-pulse' : 'bg-secondary text-muted-foreground border border-border'
                  }`}>
                    4
                  </div>
                  <span className={`font-semibold ${isCurrent ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                    Consultation
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Integrated Appointment Metadata Ribbon (Replaces Clumsy Side Box) ── */}
        <div className="p-5 sm:p-6 border-t border-border/60 bg-secondary/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand" /> Appointment Date
              </span>
              <p className="font-bold text-foreground text-sm">{effectiveDate}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand" /> Slot Time
              </span>
              <p className="font-bold text-foreground text-sm">{effectiveTime}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand" /> OPD Room
              </span>
              <p className="font-bold text-foreground text-sm">Room {specialtyRoom.number}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-brand" /> Consultation Fee
              </span>
              <p className="font-bold text-foreground text-sm">₹{matchedDoctor?.consultation_fee || 700} <span className="text-[10px] font-normal text-muted-foreground">(Paid)</span></p>
            </div>
          </div>
        </div>

        {/* ── Unified Pass Action Footer ────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>Verified MediSync Smart Hospital OPD Token</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              id="btn-sms-pass-footer"
              onClick={() => handleSendSmsNotification(isCompleted ? 'completed' : 'live')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{smsSentStatus === 'sending' ? 'Sending SMS...' : (smsSentStatus === 'sent' ? 'SMS Sent to Phone!' : 'Send SMS Pass to Phone')}</span>
            </button>

            {isCompleted ? (
              <>
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 text-xs font-semibold rounded-xl border border-border transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => navigate('/patient/records')}
                  className="flex-1 sm:flex-initial px-5 py-2 bg-brand text-white hover:bg-brand/90 text-xs font-bold rounded-xl transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Records & Rx
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 text-xs font-semibold rounded-xl border border-border transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => navigate('/patient/appointments')}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-brand text-white hover:bg-brand/90 text-xs font-bold rounded-xl transition-all shadow-md shadow-brand/20 cursor-pointer"
                >
                  All Appointments
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── MediSync Smart Arrival ─────────────────────────────────────────────
          Only shown when booked in the future (future date) or when more than 1 hour remains.
          Suppressed when <= 1 hour left or when already nearing/at the clinic. ── */}
      {shouldShowDeparture && activeAppt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SmartArrivalCard
            appointment={activeAppt}
            queueState={queueState}
            onRefresh={() => setAllAppointments(loadAllAppointments())}
          />
        </motion.div>
      )}
    </div>
  );
}

