import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Heart, 
  TrendingDown, 
  CheckCircle2, 
  ShieldCheck,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { loadAllAppointments, initQueueSync, type QueueAppointment } from '../../lib/queueStore';

export function PatientHistory() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => loadAllAppointments());

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

  const latestWithVitals = appointments.find((a) => a.vitals?.bp) || appointments[0];
  const bpValue = latestWithVitals?.vitals?.bp || '120/80';
  const pulseValue = latestWithVitals?.vitals?.pulse || '72 bpm';
  const weightValue = latestWithVitals?.vitals?.weight || '68 kg';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">Longitudinal Health</span>
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
          Health History & Vitals
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Continuous record of physiological readings, consultation timelines, and preventative care.
        </p>
      </header>

      {/* Vitals Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Blood Pressure Card */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blood Pressure</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{bpValue}</div>
            <span className="text-[11px] text-muted-foreground">Recorded {latestWithVitals?.appointmentDate || 'Recent'}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Optimal clinical range</span>
          </div>
        </div>

        {/* Resting Heart Rate */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resting Pulse</span>
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{pulseValue}</div>
            <span className="text-[11px] text-muted-foreground">Regular sinus rhythm</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Within normal limits</span>
          </div>
        </div>

        {/* Body Weight */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight & BMI</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{weightValue}</div>
            <span className="text-[11px] text-muted-foreground">Healthy range</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Stable across visits</span>
          </div>
        </div>

        {/* Immunizations */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Immunization</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">Verified</div>
            <span className="text-[11px] text-muted-foreground">Outpatient record active</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Hospital immunization record</span>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">Consultation & Health Journey</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Chronological record of clinic consultations</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-semibold">
            {appointments.length} Total Encounters
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Consultation History Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
              Once you book consultations with MediSync specialists, your timelines, diagnoses, and vitals will automatically appear here.
            </p>
            <button
              onClick={() => navigate('/book-appointment')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-all cursor-pointer shadow-xs"
            >
              <span>Schedule First Visit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {appointments.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline Indicator Dot */}
                <div className={`absolute -left-6 sm:-left-8 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background transition-transform group-hover:scale-125 ${
                  item.status === 'in-consultation' 
                    ? 'bg-emerald-500 animate-ping' 
                    : item.status === 'completed'
                    ? 'bg-foreground'
                    : 'bg-brand'
                }`} />

                <div className="p-5 rounded-2xl border border-border bg-card hover:border-brand/40 transition-all shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{item.doctorName}</span>
                      <span className="text-[11px] text-brand font-medium">({item.specialization})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.appointmentDate} · {item.appointmentTime}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground font-semibold">Assessment:</strong> {item.problemDescription || 'Routine consultation and health status evaluation.'}
                  </p>

                  {item.vitals && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-muted-foreground border-t border-border/50">
                      <span className="px-2 py-0.5 rounded bg-secondary font-medium">BP: {item.vitals.bp || '120/80'}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary font-medium">Pulse: {item.vitals.pulse || '74 bpm'}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary font-medium">Temp: {item.vitals.temp || '98.6 °F'}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary font-medium">Weight: {item.vitals.weight || '68 kg'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
