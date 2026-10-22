import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Activity, 
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { getCurrentDoctor } from '../../lib/doctorAuth';
import { 
  getLiveQueueForDoctor, 
  getDoctorScheduleSettings, 
  callNextPatient,
  initQueueSync,
  compareAppointmentsByTime
} from '../../lib/queueStore';

export function DoctorDashboard() {
  const session = getCurrentDoctor();
  const doctor = session?.doctor;
  const doctorId = doctor?.id || '6b69e7a2-bd9d-4c62-8fa4-10a49eb0f0f7';
  const doctorName = doctor?.full_name || 'Dr. Ananya Rao';

  const [queueData, setQueueData] = useState(() => getLiveQueueForDoctor(doctorId, doctorName));
  const [schedule, setSchedule] = useState(() => getDoctorScheduleSettings(doctorId));

  useEffect(() => {
    initQueueSync(doctorId);
    const refresh = () => {
      setQueueData(getLiveQueueForDoctor(doctorId, doctorName));
      setSchedule(getDoctorScheduleSettings(doctorId));
    };
    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
    };
  }, [doctorId, doctorName]);

  const { currentPatient, waitingQueue, completedToday } = queueData;

  // Chronologically arrange patient tokens according to their appointment timings
  const sortedWaitingQueue = useMemo(() => {
    return [...waitingQueue].sort(compareAppointmentsByTime);
  }, [waitingQueue]);

  const sortedCompletedToday = useMemo(() => {
    return [...completedToday].sort(compareAppointmentsByTime);
  }, [completedToday]);
  const totalToday = (currentPatient ? 1 : 0) + waitingQueue.length + completedToday.length;

  const handleCallNext = async () => {
    await callNextPatient(doctorId, doctorName);
    setQueueData(getLiveQueueForDoctor(doctorId, doctorName));
  };

  return (
    <div className="space-y-6">
      
      {/* ── 1. GREETING & STATUS BANNER ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <span className="text-xs font-semibold text-brand uppercase tracking-wider block mb-1">
            Department of {doctor?.specialization || 'Cardiology'} · Today's Clinic
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            Welcome back, {doctor?.full_name || doctorName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {schedule.statusMessage || 'Live consultation queue is active and running.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to="/doctor/queue"
            className="px-4 py-2.5 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-brand hover:text-brand-foreground transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Open Live Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 2. METRICS OVERVIEW CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Today */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Today's Visits</span>
            <Calendar className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            {totalToday}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Scheduled patients</span>
        </div>

        {/* Patients Waiting */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Patients Waiting</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            {waitingQueue.length}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">In reception area</span>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            {completedToday.length}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Finished consultations</span>
        </div>

        {/* Est. Next Appointment */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Next In Line</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-brand">
            {sortedWaitingQueue[0]?.tokenNumber || (currentPatient ? 'In Progress' : 'None')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {sortedWaitingQueue[0] ? sortedWaitingQueue[0].appointmentTime : 'Queue clear'}
          </span>
        </div>

      </div>

      {/* ── 3. ACTIVE CONSULTATION & NEXT CALL ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Patient Card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Current Consultation In Room
                </h3>
              </div>
              {currentPatient && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand/10 text-brand">
                  Token: {currentPatient.tokenNumber}
                </span>
              )}
            </div>

            {currentPatient ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-heading font-bold text-foreground">
                      {currentPatient.patientName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Age: {currentPatient.patientAge} yrs · Phone: {currentPatient.patientPhone}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Called at {currentPatient.calledAt || '10:00 AM'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 text-xs space-y-1">
                  <span className="font-semibold text-foreground block">Reason for Visit:</span>
                  <p className="text-muted-foreground">{currentPatient.problemDescription}</p>
                </div>

                {currentPatient.vitals && (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-secondary/40 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">BP</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.bp}</span>
                    </div>
                    <div className="p-2 rounded bg-secondary/40 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Pulse</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.pulse}</span>
                    </div>
                    <div className="p-2 rounded bg-secondary/40 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Temp</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.temp}</span>
                    </div>
                    <div className="p-2 rounded bg-secondary/40 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Weight</span>
                      <span className="font-semibold text-foreground">{currentPatient.vitals.weight}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No active patient currently in consultation room.</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
            <Link
              to="/doctor/queue"
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
            >
              <span>Manage full queue & prescriptions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            {waitingQueue.length > 0 && (
              <button
                type="button"
                onClick={handleCallNext}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                {currentPatient ? 'Finish & Call Next' : 'Call Next Patient'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Clinic Status & Actions */}
        <div className="p-5 rounded-xl bg-card border border-border flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
              Doctor Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                to="/doctor/queue"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 bg-secondary/30 hover:bg-secondary/70 transition-all text-xs font-semibold text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-brand" />
                  <span>Call Next & Write Rx</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                to="/doctor/appointments"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 bg-secondary/30 hover:bg-secondary/70 transition-all text-xs font-semibold text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-brand" />
                  <span>View All Appointments</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                to="/doctor/schedule"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 bg-secondary/30 hover:bg-secondary/70 transition-all text-xs font-semibold text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-brand" />
                  <span>Edit Availability & Leaves</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                to="/doctor/patients"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 bg-secondary/30 hover:bg-secondary/70 transition-all text-xs font-semibold text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-brand" />
                  <span>Patient Health Records</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 text-xs text-muted-foreground">
            <span className="font-semibold text-brand block mb-0.5">Queue Sync Active:</span>
            Queue calls automatically notify patient tracking screens in the lobby.
          </div>
        </div>

      </div>

      {/* ── 4. TODAY'S PATIENT QUEUE TABLE ───────────────────────────── */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-heading font-bold text-foreground">
              Today's Patients Schedule
            </h3>
            <p className="text-xs text-muted-foreground">
              Live status of consultations for {doctor?.full_name || doctorName} · Arranged chronologically by appointment time
            </p>
          </div>
          <Link
            to="/doctor/appointments"
            className="text-xs font-semibold text-brand hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border">
              <tr>
                <th className="py-2.5 px-3">Token</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Category / Concern</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {currentPatient && (
                <tr className="bg-brand/[0.03]">
                  <td className="py-3 px-3 font-mono font-bold text-brand">{currentPatient.tokenNumber}</td>
                  <td className="py-3 px-3 font-semibold text-foreground">{currentPatient.patientName}</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="w-3 h-3 text-brand inline" />
                      {currentPatient.appointmentTime}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs truncate">{currentPatient.problemCategory}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      In Consultation
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link to="/doctor/queue" className="font-semibold text-brand hover:underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              )}

              {sortedWaitingQueue.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-foreground">{item.tokenNumber}</td>
                  <td className="py-3 px-3 font-semibold text-foreground">{item.patientName}</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 inline" />
                      {item.appointmentTime}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs truncate">{item.problemCategory}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Waiting
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link to="/doctor/queue" className="font-semibold text-brand hover:underline">
                      Call In →
                    </Link>
                  </td>
                </tr>
              ))}

              {sortedCompletedToday.map((item) => (
                <tr key={item.id} className="opacity-75">
                  <td className="py-3 px-3 font-mono text-muted-foreground">{item.tokenNumber}</td>
                  <td className="py-3 px-3 text-muted-foreground">{item.patientName}</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground inline" />
                      {item.appointmentTime}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs truncate">{item.problemCategory}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground">
                      Completed
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-muted-foreground">
                    Done
                  </td>
                </tr>
              ))}

              {totalToday === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No consultations scheduled for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
