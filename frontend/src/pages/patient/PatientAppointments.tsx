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
  Activity, 
  FileText 
} from 'lucide-react';
import { 
  loadAllAppointments, 
  cancelAppointment, 
  initQueueSync, 
  type QueueAppointment 
} from '../../lib/queueStore';

export function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => loadAllAppointments());
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<QueueAppointment | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

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
    return appointments.filter((appt) => {
      // Search match
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !q ||
        appt.doctorName.toLowerCase().includes(q) ||
        appt.specialization.toLowerCase().includes(q) ||
        appt.tokenNumber.toLowerCase().includes(q) ||
        appt.problemCategory.toLowerCase().includes(q);

      // Status filter
      let matchesFilter = true;
      if (filter === 'active') {
        matchesFilter = appt.status === 'waiting' || appt.status === 'in-consultation';
      } else if (filter === 'completed') {
        matchesFilter = appt.status === 'completed';
      } else if (filter === 'cancelled') {
        matchesFilter = appt.status === 'cancelled';
      }

      return matchesSearch && matchesFilter;
    });
  }, [appointments, filter, searchQuery]);

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    await cancelAppointment(cancelTargetId);
    setAppointments(loadAllAppointments());
    setCancelTargetId(null);
  };

  const getStatusBadge = (status: QueueAppointment['status']) => {
    switch (status) {
      case 'in-consultation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Consultation
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            In Queue (Waiting)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Consultation Schedule</span>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
            My Appointments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track real-time OPD tokens, upcoming clinic slots, and consultation history.
          </p>
        </div>
        <button
          id="btn-book-new-appointment"
          onClick={() => navigate('/book-appointment')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-foreground text-background font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-foreground/90 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Book New Visit
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="appointment-search-input"
            type="text"
            placeholder="Search by doctor, token, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-xs"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl">
          {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border p-8 bg-card/40">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No appointments found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You don't have any appointments matching this category. Book an appointment to get your live queue token.
          </p>
          <button
            onClick={() => navigate('/book-appointment')}
            className="mt-4 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors"
          >
            Schedule Consultation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => {
            const isWaitingOrConsulting = appt.status === 'waiting' || appt.status === 'in-consultation';
            return (
              <div
                key={appt.id}
                className="p-6 rounded-2xl border border-border bg-card shadow-xs hover:border-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-start sm:items-center gap-5">
                  {/* Token Box */}
                  <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex flex-col items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Token</span>
                    <span className="text-xl font-bold leading-none mt-0.5">{appt.tokenNumber}</span>
                  </div>

                  {/* Doctor & Appointment Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-semibold text-base text-foreground group-hover:text-brand transition-colors">
                        {appt.doctorName}
                      </h3>
                      {getStatusBadge(appt.status)}
                    </div>
                    <p className="text-xs font-medium text-brand">
                      {appt.specialization} · {appt.problemCategory || 'General Consultation'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {appt.appointmentDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {appt.appointmentTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                  {isWaitingOrConsulting && (
                    <button
                      id={`track-live-token-${appt.tokenNumber}`}
                      onClick={() => navigate(`/patient/queue?token=${appt.tokenNumber}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand/90 transition-all shadow-xs"
                    >
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Live Tracker
                    </button>
                  )}

                  {appt.status === 'completed' && (
                    <button
                      onClick={() => setSelectedAppt(appt)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand" />
                      View Rx & Summary
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedAppt(appt)}
                    className="px-3.5 py-2 bg-card border border-border text-foreground text-xs font-semibold rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    Details
                  </button>

                  {isWaitingOrConsulting && (
                    <button
                      onClick={() => setCancelTargetId(appt.id)}
                      className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Appointment Slip</span>
                <h3 className="text-xl font-bold text-foreground">Token {selectedAppt.tokenNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-foreground">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/50">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Doctor</span>
                  <p className="font-semibold text-sm mt-0.5">{selectedAppt.doctorName}</p>
                  <p className="text-brand font-medium">{selectedAppt.specialization}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Schedule</span>
                  <p className="font-semibold text-sm mt-0.5">{selectedAppt.appointmentDate}</p>
                  <p className="text-muted-foreground">{selectedAppt.appointmentTime}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">Reason / Symptoms</span>
                <div className="p-3 rounded-lg border border-border bg-card">
                  {selectedAppt.problemDescription || 'General health consultation'}
                </div>
              </div>

              {selectedAppt.vitals && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-2">Recorded Vitals</span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-secondary/60">
                      <span className="text-[10px] text-muted-foreground block">BP</span>
                      <span className="font-bold text-foreground">{selectedAppt.vitals.bp || '120/80'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/60">
                      <span className="text-[10px] text-muted-foreground block">Pulse</span>
                      <span className="font-bold text-foreground">{selectedAppt.vitals.pulse || '72 bpm'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/60">
                      <span className="text-[10px] text-muted-foreground block">Temp</span>
                      <span className="font-bold text-foreground">{selectedAppt.vitals.temp || '98.6 °F'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/60">
                      <span className="text-[10px] text-muted-foreground block">Weight</span>
                      <span className="font-bold text-foreground">{selectedAppt.vitals.weight || '65 kg'}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAppt.prescription && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">Prescribed Medication</span>
                  <div className="p-3 rounded-lg border border-border bg-card font-mono text-[11px] whitespace-pre-line">
                    {selectedAppt.prescription}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setSelectedAppt(null)}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base">Cancel Appointment?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel this consultation? Your queue token will be released for other waiting patients.
            </p>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setCancelTargetId(null)}
                className="px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80"
              >
                Keep Appointment
              </button>
              <button
                id="btn-confirm-cancel-appointment"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
