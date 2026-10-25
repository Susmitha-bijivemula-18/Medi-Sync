import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Activity,
  FileText,
  ChevronRight,
  Stethoscope,
  Pill,
  Heart,
  Thermometer,
  Weight,
  XCircle,
  MapPin,
  ArrowRight,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import {
  loadAllAppointments,
  cancelAppointment,
  initQueueSync,
  getTodayDateString,
  type QueueAppointment
} from '../../lib/queueStore';
import { SmartArrivalCard } from '../../components/common/SmartArrivalCard';
import { getPatientRegisteredPhone } from '../../lib/whatsapp';

// ── Status config ───────────────────────────────────────────────────────────────

type StatusKey = QueueAppointment['status'];

const STATUS_CONFIG: Record<StatusKey, { label: string; dot: string; bg: string; text: string; border: string; glow?: string }> = {
  'in-consultation': {
    label: 'In Consultation',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/25',
    glow: 'shadow-emerald-500/10',
  },
  waiting: {
    label: 'In Queue',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/25',
    glow: 'shadow-amber-500/10',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/8',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-rose-500',
    bg: 'bg-rose-500/8',
    text: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-500/20',
  },
  scheduled: {
    label: 'Scheduled',
    dot: 'bg-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/25',
  },
  skipped: {
    label: 'Skipped',
    dot: 'bg-zinc-400',
    bg: 'bg-secondary',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  const isPulsing = status === 'in-consultation' || status === 'waiting';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {isPulsing && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`} />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  );
}

// ── Date helper ─────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const todayStr = getTodayDateString();
    const tmrw = new Date(today);
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tmrwStr) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

// ── Component ───────────────────────────────────────────────────────────────────

export function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => loadAllAppointments());
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<QueueAppointment | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Scheduling conflict');
  const [isCancelling, setIsCancelling] = useState(false);
  const [smsSentId, setSmsSentId] = useState<string | null>(null);

  const handleSendAppointmentSms = async (appt: QueueAppointment) => {
    const phone = appt.patientPhone || getPatientRegisteredPhone();
    const token = appt.tokenNumber || 'K-01';
    const doctor = appt.doctorName.startsWith('Dr.') ? appt.doctorName : `Dr. ${appt.doctorName}`;
    const msg = `MediSync OPD: Appointment confirmed for Token ${token} with ${doctor} (${appt.specialization || 'OPD'}) on ${appt.appointmentDate} at ${appt.appointmentTime}. Room 204.`;

    setSmsSentId(appt.id);
    try {
      await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: msg }),
      });
    } catch {}
    setTimeout(() => setSmsSentId(null), 3000);
  };

  useEffect(() => {
    initQueueSync();
    const refresh = () => setAppointments(loadAllAppointments());
    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          appt.doctorName.toLowerCase().includes(q) ||
          appt.specialization.toLowerCase().includes(q) ||
          appt.tokenNumber.toLowerCase().includes(q) ||
          appt.problemCategory.toLowerCase().includes(q);

        let matchesFilter = true;
        if (filter === 'active') matchesFilter = appt.status === 'waiting' || appt.status === 'in-consultation' || appt.status === 'scheduled';
        else if (filter === 'completed') matchesFilter = appt.status === 'completed';
        else if (filter === 'cancelled') matchesFilter = appt.status === 'cancelled';
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const priority: Record<string, number> = { 'in-consultation': 0, waiting: 1, scheduled: 2, completed: 3, cancelled: 4, skipped: 5 };
        const pA = priority[a.status] ?? 3;
        const pB = priority[b.status] ?? 3;
        if (pA !== pB) return pA - pB;
        return (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
      });
  }, [appointments, filter, searchQuery]);

  const counts = useMemo(() => {
    let active = 0, completed = 0, cancelled = 0;
    for (const a of appointments) {
      if (a.status === 'waiting' || a.status === 'in-consultation' || a.status === 'scheduled') active++;
      else if (a.status === 'completed') completed++;
      else if (a.status === 'cancelled') cancelled++;
    }
    return { total: appointments.length, active, completed, cancelled };
  }, [appointments]);

  const cancelTargetAppt = useMemo(
    () => appointments.find((a) => a.id === cancelTargetId),
    [appointments, cancelTargetId]
  );

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      await cancelAppointment(cancelTargetId);
      setAppointments(loadAllAppointments());
      setCancelTargetId(null);
    } finally {
      setIsCancelling(false);
    }
  };

  // Card accent bar color based on status
  const getAccentColor = (status: StatusKey) => {
    switch (status) {
      case 'in-consultation': return 'from-emerald-500 to-teal-500';
      case 'waiting': return 'from-amber-500 to-orange-500';
      case 'completed': return 'from-emerald-400 to-emerald-600';
      case 'cancelled': return 'from-rose-400 to-rose-600';
      case 'scheduled': return 'from-blue-500 to-indigo-600';
      default: return 'from-zinc-400 to-zinc-500';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Consultation Schedule</span>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground mt-0.5">My Appointments</h1>
        </div>
        <button
          id="btn-book-new-appointment"
          onClick={() => navigate('/book-appointment')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-brand hover:text-white transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Book Visit
        </button>
      </header>

      {/* ── Search + Filter ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            id="appointment-search-input"
            type="text"
            placeholder="Search doctor, token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-secondary/80 rounded-lg border border-border">
          {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {tab === 'all' ? `All (${counts.total})` : tab === 'active' ? `Active (${counts.active})` : tab === 'completed' ? `Done (${counts.completed})` : `Cancelled (${counts.cancelled})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards Grid ─────────────────────────────────────────────────────── */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/40">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-foreground">No appointments found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {filter !== 'all' ? 'Try a different filter or ' : ''}Book a consultation to get started.
          </p>
          <button
            onClick={() => navigate('/book-appointment')}
            className="mt-3 px-4 py-1.5 bg-brand text-white text-[11px] font-bold rounded-lg hover:bg-brand/90 transition-colors cursor-pointer"
          >
            Schedule Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAppointments.map((appt) => {
            const isLive = appt.status === 'waiting' || appt.status === 'in-consultation';
            const canCancel = isLive || appt.status === 'scheduled';
            const isDone = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled';

            return (
              <div
                key={appt.id}
                onClick={() => setSelectedAppt(appt)}
                className={`group relative rounded-2xl border bg-card shadow-xs overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  isLive
                    ? 'border-brand/30 hover:border-brand/60 shadow-brand/5'
                    : isCancelled
                    ? 'border-border opacity-60 hover:opacity-80'
                    : 'border-border hover:border-brand/40'
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${getAccentColor(appt.status)}`} />

                <div className="p-4 space-y-3">
                  {/* Token + Status row */}
                  <div className="flex items-center justify-between">
                    <div className={`px-2.5 py-1 rounded-lg text-center shrink-0 transition-colors ${
                      isLive
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm'
                        : isDone
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm'
                        : 'bg-secondary border border-border text-foreground'
                    }`}>
                      <span className="text-[7px] font-bold uppercase tracking-widest opacity-70 block leading-none">Token</span>
                      <span className="text-base font-extrabold leading-none mt-0.5 block">{appt.tokenNumber || '—'}</span>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  {/* Doctor info */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors leading-tight">
                      {appt.doctorName}
                    </h3>
                    <p className="text-[11px] text-brand font-medium mt-0.5">{appt.specialization}</p>
                  </div>

                  {/* Date/Time pill */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatShortDate(appt.appointmentDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {appt.appointmentTime}
                    </span>
                  </div>

                  {/* Reason excerpt */}
                  {appt.problemDescription && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border">
                      <span className="font-semibold text-foreground">Concern:</span> {appt.problemDescription}
                    </p>
                  )}

                  {/* Vitals mini-strip (only for completed with vitals) */}
                  {isDone && appt.vitals && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {appt.vitals.bp && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/8 border border-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold">
                          <Heart className="w-2.5 h-2.5" /> {appt.vitals.bp}
                        </span>
                      )}
                      {appt.vitals.pulse && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/8 border border-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                          <Activity className="w-2.5 h-2.5" /> {appt.vitals.pulse}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendAppointmentSms(appt)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition-all cursor-pointer"
                      title="Send appointment pass directly to your phone via SMS"
                    >
                      <Smartphone className="w-3 h-3" />
                      {smsSentId === appt.id ? 'SMS Sent!' : 'Send SMS'}
                    </button>
                    {isLive && (
                      <button
                        id={`track-live-token-${appt.tokenNumber}`}
                        onClick={() => navigate(`/patient/queue?token=${appt.tokenNumber}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand text-white text-[10px] font-bold rounded-md hover:bg-brand/90 transition-all cursor-pointer"
                      >
                        <Activity className="w-3 h-3" />
                        Track Live
                      </button>
                    )}
                    {isDone && (appt.prescription || appt.clinicalNotes) && (
                      <button
                        onClick={() => setSelectedAppt(appt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-md hover:bg-secondary/80 transition-colors border border-border cursor-pointer"
                      >
                        <Pill className="w-3 h-3 text-brand" />
                        View Rx
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => setCancelTargetId(appt.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedAppt(appt)}
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground hover:text-brand transition-colors cursor-pointer"
                  >
                    Details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {selectedAppt && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAppt(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient accent */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${getAccentColor(selectedAppt.status)} rounded-t-2xl`} />

            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                  selectedAppt.status === 'completed'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                    : selectedAppt.status === 'in-consultation' || selectedAppt.status === 'waiting'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                    : 'bg-secondary border border-border text-foreground'
                }`}>
                  <span className="text-[6px] font-bold uppercase tracking-widest opacity-70 leading-none">Tkn</span>
                  <span className="text-sm font-extrabold leading-none mt-px">{selectedAppt.tokenNumber || '—'}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground leading-tight">{selectedAppt.doctorName}</h3>
                  <p className="text-[11px] text-brand font-medium">{selectedAppt.specialization}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Status + Schedule */}
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedAppt.status} />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {formatShortDate(selectedAppt.appointmentDate)}
                  <span className="mx-0.5">·</span>
                  <Clock className="w-3 h-3" />
                  {selectedAppt.appointmentTime}
                </span>
              </div>

              {/* Smart Arrival */}
              {selectedAppt.status !== 'cancelled' && selectedAppt.status !== 'completed' && (
                <SmartArrivalCard
                  appointment={selectedAppt}
                  onRefresh={() => setAppointments(loadAllAppointments())}
                />
              )}

              {/* Reason */}
              {selectedAppt.problemDescription && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Reason</span>
                  <p className="text-xs text-foreground p-2.5 rounded-lg border border-border bg-secondary/40 leading-relaxed">
                    {selectedAppt.problemDescription}
                  </p>
                </div>
              )}

              {/* Vitals */}
              {selectedAppt.vitals && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Vitals</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { icon: Heart, label: 'BP', val: selectedAppt.vitals.bp, color: 'text-rose-500' },
                      { icon: Activity, label: 'Pulse', val: selectedAppt.vitals.pulse, color: 'text-brand' },
                      { icon: Thermometer, label: 'Temp', val: selectedAppt.vitals.temp, color: 'text-amber-500' },
                      { icon: Weight, label: 'Wt', val: selectedAppt.vitals.weight, color: 'text-blue-500' },
                    ].map(({ icon: Icon, label, val, color }) => (
                      <div key={label} className="p-2 rounded-lg bg-secondary/60 border border-border text-center">
                        <Icon className={`w-3 h-3 mx-auto mb-0.5 ${color}`} />
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">{label}</span>
                        <span className="block text-xs font-bold text-foreground mt-0.5">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical notes */}
              {selectedAppt.clinicalNotes && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Doctor Notes
                  </span>
                  <p className="text-xs text-foreground p-2.5 rounded-lg border border-border bg-secondary/40 leading-relaxed whitespace-pre-line">
                    {selectedAppt.clinicalNotes}
                  </p>
                </div>
              )}

              {/* Prescription */}
              {selectedAppt.prescription && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1">
                    <Pill className="w-3 h-3" /> Prescription
                  </span>
                  <div className="text-xs text-foreground p-2.5 rounded-lg border border-border bg-secondary/40 font-mono whitespace-pre-line leading-relaxed">
                    {selectedAppt.prescription}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border px-5 py-3 flex items-center justify-between rounded-b-2xl">
              <span className="text-[10px] text-muted-foreground">{selectedAppt.problemCategory || 'General'}</span>
              <div className="flex items-center gap-2">
                {selectedAppt.status !== 'completed' && selectedAppt.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      const id = selectedAppt.id;
                      setSelectedAppt(null);
                      setCancelTargetId(id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[10px] font-bold rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" />
                    Cancel Appointment
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSendAppointmentSms(selectedAppt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{smsSentId === selectedAppt.id ? 'SMS Sent to Phone!' : 'Send SMS Pass to Phone'}</span>
                </button>
                {(selectedAppt.status === 'waiting' || selectedAppt.status === 'in-consultation') && (
                  <button
                    onClick={() => { setSelectedAppt(null); navigate(`/patient/queue?token=${selectedAppt.tokenNumber}`); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-[10px] font-bold rounded-lg hover:bg-brand/90 transition-colors cursor-pointer"
                  >
                    Track Live <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="px-3 py-1.5 bg-secondary text-foreground text-[10px] font-bold rounded-lg hover:bg-secondary/80 transition-colors border border-border cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel confirmation modal ─────────────────────────────────────────── */}
      {cancelTargetId && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => !isCancelling && setCancelTargetId(null)}
        >
          <div
            className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent danger line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500" />

            <div className="p-6 sm:p-7 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl text-foreground">Cancel Appointment?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Please review the appointment details before confirming cancellation.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isCancelling && setCancelTargetId(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Appointment summary card */}
              {cancelTargetAppt && (
                <div className="bg-secondary/40 border border-border/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center shrink-0 font-extrabold text-xs shadow-sm">
                        <span className="text-[6px] uppercase tracking-wider opacity-70 leading-none">Tkn</span>
                        <span className="leading-none mt-0.5">{cancelTargetAppt.tokenNumber || '—'}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-tight">{cancelTargetAppt.doctorName}</h4>
                        <p className="text-xs text-brand font-medium">{cancelTargetAppt.specialization}</p>
                      </div>
                    </div>
                    <StatusBadge status={cancelTargetAppt.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border/60 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand" />
                      <span>{formatShortDate(cancelTargetAppt.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      <span>{cancelTargetAppt.appointmentTime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Consequence alert */}
              <div className="bg-rose-500/8 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-rose-600 dark:text-rose-400 block font-semibold mb-0.5">
                    Queue Token Will Be Released
                  </strong>
                  Your token {cancelTargetAppt ? <span className="font-mono font-bold text-foreground">#{cancelTargetAppt.tokenNumber}</span> : ''} will be permanently forfeited and immediately reassigned to the next waiting patient.
                </div>
              </div>

              {/* Reason selector (optional) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Reason for cancellation <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Scheduling conflict',
                    'Feeling better',
                    'Consulting another doctor',
                    'Personal emergency',
                    'Other'
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        cancelReason === r
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-xs'
                          : 'bg-secondary/60 text-muted-foreground border-border hover:bg-secondary'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTargetId(null)}
                  disabled={isCancelling}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-secondary text-foreground text-xs font-bold rounded-xl hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  id="btn-confirm-cancel-appointment"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
