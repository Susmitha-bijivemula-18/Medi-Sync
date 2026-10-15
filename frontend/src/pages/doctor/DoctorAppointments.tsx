import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { getCurrentDoctor } from '../../lib/doctorAuth';
import { 
  getAppointmentsForDoctor, 
  getTodayDateString, 
  completeConsultation,
  cancelAppointment,
  initQueueSync,
  type QueueAppointment 
} from '../../lib/queueStore';

export function DoctorAppointments() {
  const session = getCurrentDoctor();
  const doctor = session?.doctor;
  const doctorId = doctor?.id || '1';
  const doctorName = doctor?.full_name || '';

  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => getAppointmentsForDoctor(doctorId, doctorName));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'upcoming'
  const [selectedAppt, setSelectedAppt] = useState<QueueAppointment | null>(null);

  useEffect(() => {
    initQueueSync(doctorId);
    const refresh = () => setAppointments(getAppointmentsForDoctor(doctorId, doctorName));
    window.addEventListener('caretrack:queue-update', refresh);
    return () => window.removeEventListener('caretrack:queue-update', refresh);
  }, [doctorId, doctorName]);

  const todayStr = getTodayDateString();

  const filtered = useMemo(() => {
    return appointments.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        item.patientName.toLowerCase().includes(q) ||
        item.tokenNumber.toLowerCase().includes(q) ||
        item.problemCategory.toLowerCase().includes(q);

      // Status
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      // Date
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = item.appointmentDate === todayStr;
      } else if (dateFilter === 'upcoming') {
        matchesDate = item.appointmentDate >= todayStr;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchQuery, statusFilter, dateFilter, todayStr]);

  if (!doctor) return null;

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment(id, 'Cancelled by consulting physician');
      setSelectedAppt(null);
    }
  };

  const handleMarkComplete = (id: string) => {
    completeConsultation(id);
    setSelectedAppt(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-card border border-border shadow-xs">
        <div>
          <span className="text-xs font-semibold text-brand uppercase tracking-wider block mb-1">
            Appointments Management
          </span>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Consultation Schedule: {doctor.full_name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total {appointments.length} appointment records for Department of {doctor.specialization}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, token, problem..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Date Filter & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                dateFilter === 'today' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('upcoming')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                dateFilter === 'upcoming' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Upcoming
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="in-consultation">In Consultation</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Age / Contact</th>
                <th className="py-3 px-4">Concern / Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand">
                    {item.tokenNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {item.patientName}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    <span className="block font-medium text-foreground">{item.appointmentDate}</span>
                    <span className="text-[11px]">{item.appointmentTime}</span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    <span className="block font-medium text-foreground">
                      {item.patientAge} yrs
                      {item.bloodGroup && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {item.bloodGroup}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono block">{item.patientPhone}</span>
                    {item.location && <span className="text-[10px] text-muted-foreground block truncate max-w-[120px]">{item.location}</span>}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                    {item.problemCategory}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'in-consultation'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : item.status === 'completed'
                          ? 'bg-secondary text-muted-foreground'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedAppt(item)}
                      className="font-semibold text-brand hover:underline cursor-pointer"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    No appointments found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-floating p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-brand/10 text-brand">
                  {selectedAppt.tokenNumber}
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Appointment Record
                </h3>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Patient</span>
                <span className="font-semibold text-foreground text-sm block mt-0.5">{selectedAppt.patientName}</span>
                <span className="text-muted-foreground">{selectedAppt.patientAge} years · {selectedAppt.patientPhone}</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Schedule</span>
                <span className="font-semibold text-foreground text-sm block mt-0.5">{selectedAppt.appointmentTime}</span>
                <span className="text-muted-foreground">{selectedAppt.appointmentDate}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border/40 text-xs space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Chief Problem</span>
              <p className="text-foreground leading-relaxed">{selectedAppt.problemDescription}</p>
            </div>

            {selectedAppt.clinicalNotes && (
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40 text-xs space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Clinical Notes</span>
                <p className="text-foreground">{selectedAppt.clinicalNotes}</p>
              </div>
            )}

            {selectedAppt.prescription && (
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 text-xs space-y-1">
                <span className="text-[10px] text-brand uppercase tracking-wider font-bold block">Prescription (Rx)</span>
                <p className="font-mono text-foreground">{selectedAppt.prescription}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              {selectedAppt.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => handleCancel(selectedAppt.id)}
                  className="px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold cursor-pointer"
                >
                  Cancel Appointment
                </button>
              )}

              {selectedAppt.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => handleMarkComplete(selectedAppt.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold ml-auto cursor-pointer"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
