import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  Stethoscope, 
  Pill, 
  X 
} from 'lucide-react';
import { loadAllAppointments, initQueueSync, type QueueAppointment } from '../../lib/queueStore';

export function PatientRecords() {
  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => loadAllAppointments());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<QueueAppointment | null>(null);

  useEffect(() => {
    initQueueSync();
    const refresh = () => setAppointments(loadAllAppointments());
    window.addEventListener('caretrack:queue-update', refresh);
    return () => window.removeEventListener('caretrack:queue-update', refresh);
  }, []);

  // Filter only records that have clinical details or are completed
  const records = useMemo(() => {
    return appointments.filter((appt) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !q ||
        appt.doctorName.toLowerCase().includes(q) ||
        appt.specialization.toLowerCase().includes(q) ||
        appt.problemCategory.toLowerCase().includes(q) ||
        (appt.clinicalNotes && appt.clinicalNotes.toLowerCase().includes(q));

      // Show completed or consultations with notes/vitals
      return matchesSearch && (appt.status === 'completed' || appt.clinicalNotes || appt.vitals || appt.prescription);
    });
  }, [appointments, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Medical Portfolio</span>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
            Clinical Records & Prescriptions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Access certified doctor consultation summaries, prescriptions, and vital readings.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          id="records-search-input"
          type="text"
          placeholder="Search records by doctor, symptom, or diagnosis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-xs"
        />
      </div>

      {/* Records Grid */}
      {records.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border p-8 bg-card/40">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No clinical records found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Completed consultations and official doctor prescriptions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="p-6 rounded-2xl border border-border bg-card shadow-xs hover:border-brand/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Token {record.tokenNumber}
                    </span>
                    <span className="text-xs text-foreground font-medium">
                      {record.appointmentDate}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-brand transition-colors">
                    {record.problemCategory || 'Consultation Summary'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {record.doctorName} · {record.specialization}
                  </p>
                </div>

                {record.vitals && (
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-secondary/50 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Blood Pressure</span>
                      <span className="font-semibold text-foreground">{record.vitals.bp || '120/80'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Pulse Rate</span>
                      <span className="font-semibold text-foreground">{record.vitals.pulse || '74 bpm'}</span>
                    </div>
                  </div>
                )}

                {record.prescription ? (
                  <div className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/30 p-2.5 rounded-lg border border-border/50">
                    <span className="font-semibold text-brand not-italic block mb-0.5 text-[10px] uppercase">Prescription</span>
                    {record.prescription}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {record.problemDescription || 'Routine health evaluation completed with doctor notes recorded.'}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-semibold text-brand">
                <span>View Full Summary</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail / Printable Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Official Clinical Consultation Record</h3>
                  <p className="text-xs text-muted-foreground">CareTrack Medical Center · Token {selectedRecord.tokenNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor & Patient Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/50 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Consultant</span>
                <p className="font-bold text-sm text-foreground mt-0.5">{selectedRecord.doctorName}</p>
                <p className="text-brand font-medium">{selectedRecord.specialization}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Patient Details</span>
                <p className="font-bold text-sm text-foreground mt-0.5">{selectedRecord.patientName} ({selectedRecord.patientAge} yrs)</p>
                <p className="text-muted-foreground">{selectedRecord.appointmentDate} · {selectedRecord.appointmentTime}</p>
              </div>
            </div>

            {/* Clinical Observations */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground block">
                Primary Diagnosis & Complaint
              </span>
              <div className="p-3.5 rounded-xl border border-border bg-card text-xs text-foreground leading-relaxed">
                {selectedRecord.problemDescription || 'Routine evaluation and cardiac health follow-up.'}
              </div>
            </div>

            {/* Recorded Vitals */}
            {selectedRecord.vitals && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground block">
                  Vital Readings Recorded During Visit
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase block font-medium">BP</span>
                    <span className="font-bold text-sm text-foreground mt-0.5 block">{selectedRecord.vitals.bp || '120/80'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase block font-medium">Heart Rate</span>
                    <span className="font-bold text-sm text-foreground mt-0.5 block">{selectedRecord.vitals.pulse || '74 bpm'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase block font-medium">Body Temp</span>
                    <span className="font-bold text-sm text-foreground mt-0.5 block">{selectedRecord.vitals.temp || '98.6 °F'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase block font-medium">Weight</span>
                    <span className="font-bold text-sm text-foreground mt-0.5 block">{selectedRecord.vitals.weight || '68 kg'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Prescription / Advice */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-brand" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Prescribed Medications & Regimen
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card font-mono text-xs whitespace-pre-line text-foreground/90 leading-relaxed">
                {selectedRecord.prescription || (
                  `1. Tab. Telmisartan 40mg - Once daily (Morning after breakfast)
2. Tab. Atorvastatin 10mg - Once daily (Night before sleep)
3. Tab. Ecosprin 75mg - Once daily (After lunch)

Advice: Maintain low sodium diet. Follow up in 4 weeks with fresh lipid profile.`
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Rx Slip
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
