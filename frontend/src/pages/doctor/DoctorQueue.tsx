import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Stethoscope, 
  Volume2, 
  X 
} from 'lucide-react';
import { getCurrentDoctor } from '../../lib/doctorAuth';
import { 
  getLiveQueueForDoctor, 
  callNextPatient, 
  completeConsultation, 
  skipPatient, 
  rescheduleAppointment,
  getDoctorScheduleSettings,
  initQueueSync,
  compareAppointmentsByTime,
  type QueueAppointment 
} from '../../lib/queueStore';

export function DoctorQueue() {
  const session = getCurrentDoctor();
  const doctor = session?.doctor;
  const doctorId = doctor?.id || '6b69e7a2-bd9d-4c62-8fa4-10a49eb0f0f7';
  const doctorName = doctor?.full_name || 'Dr. Ananya Rao';

  const [queueData, setQueueData] = useState(() => getLiveQueueForDoctor(doctorId, doctorName));
  const [schedule, setSchedule] = useState(() => getDoctorScheduleSettings(doctorId));

  // Consultation in-progress inputs
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Skip Modal State
  const [skipTarget, setSkipTarget] = useState<QueueAppointment | null>(null);
  const [skipReason, setSkipReason] = useState('Patient not responding in waiting room');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<QueueAppointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00 AM');

  useEffect(() => {
    initQueueSync(doctorId);
    const refresh = () => {
      setQueueData(getLiveQueueForDoctor(doctorId, doctorName));
      setSchedule(getDoctorScheduleSettings(doctorId));
    };

    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    window.addEventListener('storage', refresh);

    const timer = setInterval(refresh, 2500);

    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(timer);
    };
  }, [doctorId, doctorName]);

  if (!doctor) return null;

  const { currentPatient, waitingQueue, completedToday } = queueData;

  const sortedWaitingQueue = useMemo(() => {
    return [...waitingQueue].sort(compareAppointmentsByTime);
  }, [waitingQueue]);

  // Notification helper
  const flashNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCallNext = async () => {
    const result = await callNextPatient(doctorId, doctorName);
    if (result.success && result.calledPatient) {
      flashNotice(`Token ${result.calledPatient.tokenNumber} (${result.calledPatient.patientName}) called into room.`);
      setClinicalNotes('');
      setPrescription('');
    } else {
      flashNotice('No more waiting patients in today’s queue.');
    }
  };

  const handleCompleteCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    await completeConsultation(currentPatient.id, clinicalNotes, prescription);
    flashNotice(`Consultation for Token ${currentPatient.tokenNumber} completed.`);
    setClinicalNotes('');
    setPrescription('');
  };

  const confirmSkip = async () => {
    if (!skipTarget) return;
    await skipPatient(skipTarget.id, skipReason);
    flashNotice(`Patient ${skipTarget.patientName} (${skipTarget.tokenNumber}) skipped.`);
    setSkipTarget(null);
  };

  const confirmReschedule = async () => {
    if (!rescheduleTarget || !newDate) return;
    await rescheduleAppointment(rescheduleTarget.id, newDate, newTime);
    flashNotice(`Appointment for ${rescheduleTarget.patientName} moved to ${newDate} at ${newTime}.`);
    setRescheduleTarget(null);
  };

  return (
    <div className="space-y-6">
      
      {/* ── 1. QUEUE HEADER & CALL NEXT ACTION ────────────────────────── */}
      <div className="p-5 rounded-xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-semibold text-brand uppercase tracking-wider">
              Live Queue Controller
            </span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight mt-1">
            Clinic Queue: {doctor.full_name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {schedule.statusMessage || 'In Clinic'} · {waitingQueue.length} patient{waitingQueue.length === 1 ? '' : 's'} waiting · {completedToday.length} completed today
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCallNext}
            disabled={waitingQueue.length === 0}
            className="px-5 py-2.5 rounded-lg bg-brand text-brand-foreground text-xs font-bold hover:bg-brand/90 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Volume2 className="w-4 h-4" />
            <span>Call Next Patient</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ── 2. ACTIVE CONSULTATION DESK ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Patient Workspace (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-card border border-border space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Active Consultation Room
                </h2>
              </div>
              {currentPatient && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  TOKEN {currentPatient.tokenNumber}
                </span>
              )}
            </div>

            {currentPatient ? (
              <form onSubmit={handleCompleteCurrent} className="space-y-4">
                
                {/* Patient Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-secondary/50 border border-border/60">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {currentPatient.patientName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{currentPatient.patientAge} years old</span>
                      {currentPatient.bloodGroup && (
                        <span className="px-1.5 py-0.2 rounded font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          Blood: {currentPatient.bloodGroup}
                        </span>
                      )}
                      {currentPatient.location && <span>• {currentPatient.location}</span>}
                      <span>• Phone: {currentPatient.patientPhone}</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-xs">
                    <span className="text-muted-foreground block">Appt Time</span>
                    <span className="font-semibold text-foreground">{currentPatient.appointmentTime}</span>
                  </div>
                </div>

                {/* Vitals Cards */}
                {currentPatient.vitals && (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground font-medium block">BP</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.bp}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground font-medium block">Pulse</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.pulse}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground font-medium block">Temp</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.temp}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                      <span className="text-[10px] text-muted-foreground font-medium block">Weight</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.weight}</span>
                    </div>
                  </div>
                )}

                {/* Chief Complaint / Symptoms */}
                <div className="p-3.5 rounded-lg bg-secondary/30 border border-border/50 text-xs space-y-1">
                  <span className="font-semibold text-foreground block">Patient Chief Complaint:</span>
                  <p className="text-muted-foreground leading-relaxed">{currentPatient.problemDescription}</p>
                </div>

                {/* Clinical Notes Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Clinical Observations & Diagnosis:
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter examination findings, symptoms diagnosis, and notes..."
                    className="w-full p-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
                  />
                </div>

                {/* Prescription & Advice Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Prescriptions & Medications (Rx):
                  </label>
                  <textarea
                    rows={3}
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="e.g. Tab Telmisartan 40mg (1-0-0) x 30 days, avoid salty foods, follow up in 2 weeks..."
                    className="w-full p-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand font-mono leading-relaxed"
                  />
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSkipTarget(currentPatient)}
                      className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Skip Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleTarget(currentPatient);
                        setNewDate(currentPatient.appointmentDate);
                      }}
                      className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Consultation</span>
                  </button>
                </div>

              </form>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-bold text-foreground mb-1">
                  No Patient Currently In Room
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                  Click "Call Next Patient" to notify the next waiting patient into your clinic room.
                </p>
                {waitingQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCallNext}
                    className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-xs font-semibold hover:bg-brand/90 transition-colors cursor-pointer"
                  >
                    Call Token {waitingQueue[0].tokenNumber}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Waiting Queue Side Panel (1 column) */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-border border-b">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Waiting Lobby ({sortedWaitingQueue.length})
              </h2>
              <span className="text-xs font-mono text-brand font-semibold">Sorted by Time</span>
            </div>

            {sortedWaitingQueue.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No patients waiting in queue.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {sortedWaitingQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-secondary/30 hover:bg-secondary/60 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                          {item.tokenNumber}
                        </span>
                        <span className="font-bold text-foreground truncate max-w-[130px]">
                          {item.patientName}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {item.appointmentTime}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-[11px] line-clamp-1">
                      {item.problemCategory}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground">
                        Position #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSkipTarget(item)}
                          className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleTarget(item);
                            setNewDate(item.appointmentDate);
                          }}
                          className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 3. SKIP CONFIRMATION MODAL ───────────────────────────────── */}
      {skipTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-floating p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Confirm Skip Patient
              </h3>
              <button onClick={() => setSkipTarget(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Are you sure you want to skip <strong>{skipTarget.patientName}</strong> (Token {skipTarget.tokenNumber})?
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Reason for skip:
              </label>
              <select
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Patient not responding in waiting room">Patient not responding in waiting room</option>
                <option value="Patient delayed at lab / diagnostic test">Patient delayed at lab / diagnostic test</option>
                <option value="Emergency priority patient taken ahead">Emergency priority patient taken ahead</option>
                <option value="Patient requested later slot">Patient requested later slot</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSkipTarget(null)}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSkip}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. RESCHEDULE MODAL ───────────────────────────────────────── */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-floating p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Reschedule Appointment
              </h3>
              <button onClick={() => setRescheduleTarget(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Reschedule appointment for <strong>{rescheduleTarget.patientName}</strong> (Token {rescheduleTarget.tokenNumber}):
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  New Date:
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  New Time Slot:
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReschedule}
                className="flex-1 py-2 rounded-lg bg-brand hover:bg-brand/90 text-brand-foreground text-xs font-semibold"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
