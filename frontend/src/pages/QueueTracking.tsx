import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Bell, CheckCircle2, FileText, Pill, Compass } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPatientQueueStatus, initQueueSync, loadAllAppointments, getTodayDateString } from '../lib/queueStore';
import { fetchPatientQueueStatus } from '../lib/supabase';
import { DoctorAvatar } from '../components/common/DoctorAvatar';
import { mockDoctors } from '../lib/doctors';
import { HospitalMapModal, hospitalRooms } from '../components/common/HospitalMapModal';
import { MediSyncIcon } from '../components/ui/Logo';

export function QueueTracking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allAppointments, setAllAppointments] = useState(() => loadAllAppointments());
  const [isMapOpen, setIsMapOpen] = useState(false);

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

  // Find room on hospital map
  const specialtyRoom = hospitalRooms.find(r => 
    (currentAppt?.doctorName && r.doctorName && r.doctorName.toLowerCase().includes(currentAppt.doctorName.toLowerCase())) ||
    (specialty && r.department.toLowerCase().includes(specialty.toLowerCase()))
  ) || hospitalRooms[0];

  const isCompleted = status === 'completed';
  const isCurrent = !isCompleted && isToday && (status === 'in-consultation' || (isCurrentTurn && status !== 'waiting'));
  const progressPercent = !isToday ? 25 : (isCompleted ? 100 : (isCurrent ? 100 : Math.max(15, Math.min(85, 100 - (patientsAhead + 1) * 20))));

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
    <div className="max-w-4xl mx-auto py-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground">
              {isToday ? 'Live Queue Tracking' : 'Appointment Details'}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5 font-medium">
              {isToday 
                ? `Real-time outpatient queue status for ${doctorName}` 
                : `Consultation scheduled with ${doctorName} for ${effectiveDate}`}
            </p>
          </div>
        </div>

        {/* Multi-token switcher if patient has multiple bookings */}
        {allAppointments.length > 1 && (
          <div className="flex items-center gap-2">
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
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-brand outline-none cursor-pointer"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main Queue Card ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs"
          >
            {/* Top Section */}
            <div className="p-6 border-b border-border/50">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <DoctorAvatar
                    src={matchedDoctor?.avatar}
                    name={doctorName}
                    className="w-14 h-14"
                  />
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground">{doctorName}</h2>
                    <p className="text-[12px] font-semibold tracking-wider uppercase text-muted-foreground mt-0.5">{specialty}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand/5 border border-brand/20">
                  <span className={`w-2 h-2 rounded-full ${!isToday ? 'bg-amber-500' : (isCompleted ? 'bg-emerald-500' : 'bg-brand animate-pulse')}`} />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-brand">
                    {!isToday ? `Scheduled for ${effectiveDate}` : (isCompleted ? 'Consultation Completed' : clinicStatus)}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: Queue Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 p-6 gap-6 md:gap-4 bg-secondary/20">
              <div className="flex flex-col border-r border-border/50">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Current Token</span>
                <span className="text-3xl font-heading font-semibold text-foreground">{isToday ? currentToken : '--'}</span>
              </div>
              
              <div className="flex flex-col md:border-r border-border/50">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Your Token</span>
                {isToday && userToken ? (
                  <span className="text-3xl font-heading font-semibold text-brand">{userToken}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wide self-start mt-1">
                    Click clinic on that day
                  </span>
                )}
              </div>
              
              <div className="flex flex-col border-r border-border/50">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Patients Ahead</span>
                <span className="text-3xl font-heading font-semibold text-foreground">{!isToday ? '--' : (isCompleted || isCurrent ? 0 : patientsAhead)}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Est. Wait</span>
                <span className="text-3xl font-heading font-semibold text-foreground">
                  {!isToday ? (
                    <span className="text-xs font-semibold text-muted-foreground block mt-1">Token on visit day</span>
                  ) : (
                    <>{isCompleted || isCurrent ? 0 : estimatedWait} <span className="text-sm font-medium tracking-normal text-muted-foreground">min</span></>
                  )}
                </span>
              </div>
            </div>

            {/* Bottom Section: Progress Bar */}
            <div className="p-6 border-t border-border/50 bg-card">
              <div className="flex justify-between items-center mb-3 text-[13px] font-semibold">
                <span className={!isToday ? 'text-amber-600 dark:text-amber-400' : (isCompleted ? 'text-emerald-600' : (isCurrent ? 'text-emerald-600' : 'text-brand'))}>
                  {!isToday 
                    ? `Scheduled for ${effectiveDate}`
                    : (isCompleted 
                      ? 'Consultation Completed' 
                      : (isCurrent ? 'Consultation In Progress' : 'In Waiting Queue'))}
                </span>
                <span className="text-muted-foreground">
                  {!isToday 
                    ? `Arrive at clinic on ${effectiveDate}`
                    : (isCompleted 
                      ? 'Visit finished' 
                      : (isCurrent ? 'Now attending in room' : `Estimated turn in ~${estimatedWait} mins`))}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    !isToday ? 'bg-amber-500' : (isCompleted || isCurrent ? 'bg-emerald-500' : 'bg-brand')
                  }`}
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          </motion.div>

          {/* ── Status & Notification Banner ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-start gap-4 p-5 rounded-2xl border shadow-xs ${
              !isToday
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-100'
                : (isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'
                  : (isCurrent 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-100 animate-pulse'
                    : 'bg-brand/5 border-brand/20'))
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              !isToday
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : (isCompleted || isCurrent ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-brand/10 text-brand')
            }`}>
              {!isToday ? <MapPin className="w-5 h-5" /> : (isCompleted || isCurrent ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />)}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-heading font-semibold mb-1 ${
                !isToday
                  ? 'text-amber-700 dark:text-amber-400'
                  : (isCompleted || isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-brand')
              }`}>
                {!isToday
                  ? `Scheduled Consultation: ${effectiveDate} at ${effectiveTime}`
                  : (isCompleted 
                    ? 'Consultation Completed'
                    : (isCurrent 
                      ? "It's Your Turn Now" 
                      : (patientsAhead === 0 ? "You're Next In Line" : (patientsAhead === 1 ? 'Your turn is approaching' : 'Queue Position Confirmed'))))}
              </h3>
              <p className="text-[13px] text-foreground/80 leading-relaxed font-medium">
                {!isToday
                  ? `Your appointment with ${doctorName} has been booked for ${effectiveDate}. Live queue tokens are issued on the day of your visit. When you arrive at the clinic, check in to receive your active token.`
                  : (isCompleted
                    ? `Your consultation with ${doctorName} has concluded. Details and prescriptions are recorded below.`
                    : (isCurrent 
                      ? `Token ${userToken} has been called into Room ${specialtyRoom.number} by ${doctorName}. Please proceed inside.`
                      : (patientsAhead === 0
                          ? `You are next in line for ${doctorName}. Please wait outside Room ${specialtyRoom.number}; your token will be called shortly.`
                          : `Please wait in the ${specialty} outpatient waiting area. Your estimated wait is ${estimatedWait} minutes.`)))}
              </p>

              {!isToday && (
                <div className="mt-3">
                  <button
                    onClick={() => setIsMapOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-secondary text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Compass className="w-4 h-4 text-brand" />
                    <span>View Hospital Map & Directions</span>
                  </button>
                </div>
              )}

              {/* Consultation Notes & Prescriptions upon completion */}
              {isCompleted && (clinicalNotes || prescription) && (
                <div className="mt-4 space-y-3 pt-3 border-t border-emerald-500/20">
                  {clinicalNotes && (
                    <div className="p-3 rounded-xl bg-card border border-border text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                        <FileText className="w-3.5 h-3.5 text-brand" />
                        <span>Doctor's Clinical Notes</span>
                      </div>
                      <p className="text-muted-foreground">{clinicalNotes}</p>
                    </div>
                  )}
                  {prescription && (
                    <div className="p-3 rounded-xl bg-card border border-border text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        <Pill className="w-3.5 h-3.5" />
                        <span>Prescription / Instructions</span>
                      </div>
                      <p className="text-foreground font-mono">{prescription}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-4">Location Details</h3>
            
            <div className="flex gap-3 items-start mb-5 pb-5 border-b border-border/50">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-foreground/70">
                <MapPin className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{specialty} Department</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {specialtyRoom.floorName}, {specialtyRoom.wing}, {specialtyRoom.number}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMapOpen(true)}
              className="w-full py-3 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-colors text-foreground cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Compass className="w-4 h-4 text-brand" />
              <span>View Hospital Map</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-4">Appointment Details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Date</span>
                <span className="font-semibold text-foreground">{effectiveDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Time</span>
                <span className="font-semibold text-foreground">{effectiveTime}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Status</span>
                <span className={`font-semibold capitalize ${!isToday ? 'text-amber-600 dark:text-amber-400' : (isCompleted ? 'text-emerald-600' : 'text-brand')}`}>
                  {!isToday ? 'Scheduled' : status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Fee</span>
                <span className="font-semibold text-foreground">₹{matchedDoctor?.consultation_fee || 800}</span>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-border/50 text-center">
              <button 
                onClick={() => navigate('/patient/dashboard')}
                className="text-[13px] font-semibold text-brand hover:underline cursor-pointer"
              >
                Return to Patient Portal
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <HospitalMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        targetDepartment={specialty}
        targetDoctorName={doctorName}
        targetRoomNumber={specialtyRoom.number}
      />
    </div>
  );
}
