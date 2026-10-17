import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Activity, 
  X, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { getCurrentDoctor } from '../../lib/doctorAuth';
import { 
  getAppointmentsForDoctor, 
  saveAllAppointments, 
  loadAllAppointments,
  initQueueSync,
  type QueueAppointment 
} from '../../lib/queueStore';

export function DoctorPatients() {
  const session = getCurrentDoctor();
  const doctor = session?.doctor;
  const doctorId = doctor?.id || '6b69e7a2-bd9d-4c62-8fa4-10a49eb0f0f7';
  const doctorName = doctor?.full_name || 'Dr. Ananya Rao';

  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => 
    getAppointmentsForDoctor(doctorId, doctorName)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Edit notes/rx modal state
  const [editingNotes, setEditingNotes] = useState('');
  const [editingPrescription, setEditingPrescription] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    initQueueSync(doctorId);
    const refresh = () => setAppointments(getAppointmentsForDoctor(doctorId, doctorName));
    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
    };
  }, [doctorId, doctorName]);

  // Group appointments by unique patient (using patientPhone or patientEmail as identity key)
  const patientsMap = useMemo(() => {
    const map = new Map<string, {
      patientName: string;
      patientAge: number;
      patientPhone: string;
      patientEmail: string;
      bloodGroup?: string;
      location?: string;
      records: QueueAppointment[];
      latestAppointment: QueueAppointment;
    }>();

    appointments.forEach((appt) => {
      const key = appt.patientPhone || appt.patientEmail || appt.patientName;
      if (!map.has(key)) {
        map.set(key, {
          patientName: appt.patientName,
          patientAge: appt.patientAge,
          patientPhone: appt.patientPhone,
          patientEmail: appt.patientEmail,
          bloodGroup: appt.bloodGroup,
          location: appt.location,
          records: [appt],
          latestAppointment: appt,
        });
      } else {
        const existing = map.get(key)!;
        existing.records.push(appt);
        if (!existing.bloodGroup && appt.bloodGroup) existing.bloodGroup = appt.bloodGroup;
        if (!existing.location && appt.location) existing.location = appt.location;
      }
    });

    return Array.from(map.values());
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patientsMap;
    return patientsMap.filter((p) => 
      p.patientName.toLowerCase().includes(q) ||
      p.patientPhone.includes(q) ||
      p.patientEmail.toLowerCase().includes(q) ||
      p.records.some(r => r.problemCategory.toLowerCase().includes(q))
    );
  }, [patientsMap, searchQuery]);

  const activePatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patientsMap.find(
      (p) => (p.patientPhone || p.patientEmail || p.patientName) === selectedPatientId
    ) || null;
  }, [patientsMap, selectedPatientId]);

  if (!doctor) return null;

  const handleOpenPatient = (p: typeof patientsMap[0]) => {
    const key = p.patientPhone || p.patientEmail || p.patientName;
    setSelectedPatientId(key);
    setEditingNotes(p.latestAppointment.clinicalNotes || '');
    setEditingPrescription(p.latestAppointment.prescription || '');
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const all = loadAllAppointments();
    const targetId = activePatient.latestAppointment.id;
    const target = all.find(a => a.id === targetId);

    if (target) {
      target.clinicalNotes = editingNotes;
      target.prescription = editingPrescription;
      saveAllAppointments(all);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-card border border-border">
        <div>
          <span className="text-xs font-semibold text-brand uppercase tracking-wider block mb-1">
            Clinical Records & Patient History
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            My Patients
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Authorized access to consultation notes, prescriptions, and medical records for patients under your care.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Role-Gated & Encrypted Record Access</span>
        </div>
      </div>

      {/* ── Filter / Search Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients by name, phone, diagnosis, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
          <span>{filteredPatients.length} patient record{filteredPatients.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* ── Patients List ──────────────────────────────────────────────── */}
      {filteredPatients.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-card border border-border">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No patient records found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search criteria or consult new patients from your live queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((p) => {
            const latest = p.latestAppointment;
            return (
              <div
                key={p.patientPhone || p.patientEmail || p.patientName}
                onClick={() => handleOpenPatient(p)}
                className="p-5 rounded-xl bg-card border border-border hover:border-brand/40 transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-foreground text-sm">
                        {p.patientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-heading font-bold text-foreground group-hover:text-brand transition-colors">
                          {p.patientName}
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          {p.patientAge} yrs · {p.patientPhone}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-foreground font-semibold">
                      {latest.tokenNumber}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                      <span className="truncate font-medium text-foreground/90">
                        {latest.problemCategory}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Last Seen: {latest.appointmentDate} ({latest.appointmentTime})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {p.records.length} consultation{p.records.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs font-semibold text-brand group-hover:underline">
                    View Chart →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Patient Medical Record Modal / Drawer ────────────────────────── */}
      {activePatient && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center font-bold text-brand text-base">
                  {activePatient.patientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground">
                    {activePatient.patientName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{activePatient.patientAge} Years Old</span>
                    {activePatient.bloodGroup && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold font-mono">
                          Blood: {activePatient.bloodGroup}
                        </span>
                      </>
                    )}
                    {activePatient.location && (
                      <>
                        <span>•</span>
                        <span>{activePatient.location}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {activePatient.patientPhone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {activePatient.patientEmail}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPatientId(null)}
                className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Alert */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
              <span>
                Confidential health record authorized exclusively for <strong>{doctor.full_name}</strong>. Patient medical disclosures are logged.
              </span>
            </div>

            {/* Vitals Snapshot */}
            {activePatient.latestAppointment.vitals && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Latest Vital Signs ({activePatient.latestAppointment.appointmentDate})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Blood Pressure</span>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      {activePatient.latestAppointment.vitals.bp}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Heart Rate</span>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      {activePatient.latestAppointment.vitals.pulse}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Temperature</span>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      {activePatient.latestAppointment.vitals.temp}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Weight</span>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      {activePatient.latestAppointment.vitals.weight}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chief Complaint */}
            <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Primary Complaint / Diagnosis
              </span>
              <p className="text-sm font-bold text-foreground">
                {activePatient.latestAppointment.problemCategory}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {activePatient.latestAppointment.problemDescription}
              </p>
            </div>

            {/* Edit / Update Clinical Notes & Rx */}
            <form onSubmit={handleSaveNotes} className="space-y-4 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-heading font-bold text-foreground">
                    Doctor's Clinical Notes & Rx
                  </h3>
                </div>
                {saveFeedback && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Updated
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Physician Assessment & Observations
                </label>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Record differential diagnosis, symptoms progression, lab results analysis..."
                  className="w-full p-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Prescription & Medication Instructions
                </label>
                <textarea
                  rows={3}
                  value={editingPrescription}
                  onChange={(e) => setEditingPrescription(e.target.value)}
                  placeholder="e.g. Tab Telmisartan 40mg 1-0-0 after food (30 days)&#10;Tab Atorvastatin 10mg 0-0-1 after food (30 days)"
                  className="w-full p-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatientId(null)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-brand hover:text-brand-foreground transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record Updates</span>
                </button>
              </div>
            </form>

            {/* Visit History with this Doctor */}
            <div className="space-y-3 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Previous Encounters ({activePatient.records.length})
              </span>
              <div className="space-y-2">
                {activePatient.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-secondary/20 border border-border text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <span>{rec.appointmentDate} at {rec.appointmentTime}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary font-bold">
                          Token {rec.tokenNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {rec.problemCategory}
                      </p>
                    </div>

                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      rec.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : rec.status === 'in-consultation'
                        ? 'bg-brand/10 text-brand'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
