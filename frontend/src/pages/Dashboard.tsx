import { useState, useEffect } from 'react';
import { Search, Calendar, Users, FileText, Activity, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  loadAllAppointments, 
  getPatientQueueStatus, 
  initQueueSync, 
  getTodayDateString,
  type QueueAppointment 
} from '../lib/queueStore';

export function Dashboard() {
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

  const todayStr = getTodayDateString();
  const dTomorrow = new Date();
  dTomorrow.setDate(dTomorrow.getDate() + 1);
  const tomorrowStr = `${dTomorrow.getFullYear()}-${String(dTomorrow.getMonth() + 1).padStart(2, '0')}-${String(dTomorrow.getDate()).padStart(2, '0')}`;

  // Active appointment ONLY applies to visits scheduled for TODAY
  const todayAppts = appointments.filter((a) => a.appointmentDate === todayStr);
  const activeAppt = 
    todayAppts.find((a) => a.status === 'in-consultation') ||
    todayAppts.find((a) => a.status === 'waiting' && Boolean(a.tokenNumber)) ||
    (todayAppts.find((a) => a.status === 'completed') || null);

  const queueInfo = activeAppt ? getPatientQueueStatus(activeAppt.tokenNumber) : null;

  // Next upcoming future appointment (e.g. tomorrow or future date)
  const nextUpcoming = appointments
    .filter((a) => a.appointmentDate >= todayStr && a.id !== activeAppt?.id && a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => {
      if (a.appointmentDate !== b.appointmentDate) return (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
      return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
    })[0] || null;

  // All upcoming & scheduled visits for the list
  const upcomingVisits = appointments
    .filter((a) => a.id !== activeAppt?.id && a.appointmentDate >= todayStr && a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => {
      if (a.appointmentDate !== b.appointmentDate) return (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
      return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
    })
    .slice(0, 5);

  const [patientName] = useState<string>(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.name) return u.name;
        if (u.email) return u.email.split('@')[0];
      }
      const profStr = localStorage.getItem('caretrack_patient_profile');
      if (profStr) {
        const p = JSON.parse(profStr);
        if (p.fullName && p.fullName !== 'Patient') return p.fullName;
      }
    } catch {}
    return '';
  });

  const recentRecords = appointments.filter(
    (a) => a.status === 'completed' || a.clinicalNotes || a.vitals || a.prescription
  ).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {patientName ? `Welcome back, ${patientName}` : 'Welcome to MediSync'}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your care today.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
             <Activity className="w-4 h-4 text-primary" />
             <span>Status: Live Connected</span>
           </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Appointment or Next Scheduled Visit Card */}
        {activeAppt && queueInfo ? (
          <div 
            onClick={() => navigate(`/patient/queue?token=${activeAppt.tokenNumber}`)}
            className="md:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-sm relative overflow-hidden group cursor-pointer hover:border-brand/40 transition-colors"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
              <Activity className="w-48 h-48" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${activeAppt.status === 'completed' ? 'bg-muted-foreground' : 'bg-emerald-500 animate-pulse'}`} />
                {activeAppt.status === 'completed' ? 'Recent Completed Consultation' : 'Active Appointment Today'}
              </h2>
              <span className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full font-medium tracking-wide uppercase">
                {activeAppt.appointmentDate} · {activeAppt.appointmentTime}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
              <div className="flex-1 space-y-6">
                <div>
                  <p className="font-semibold text-2xl text-foreground">{activeAppt.doctorName}</p>
                  <p className="text-muted-foreground font-medium">{activeAppt.specialization}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Currently Serving</span>
                    <p className="font-medium text-lg text-foreground">{queueInfo.currentToken}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Patients Ahead</span>
                    <p className="font-medium text-lg text-foreground">{queueInfo.patientsAhead}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-sm text-muted-foreground">Estimated Wait</span>
                    <p className="font-medium text-lg text-foreground">
                      {activeAppt.status === 'completed' ? 'Completed' : `~${queueInfo.estimatedWait} min`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-48 aspect-square rounded-2xl bg-brand text-white flex flex-col items-center justify-center p-6 text-center shadow-lg transform transition-transform group-hover:scale-105">
                <span className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-2">Your Token</span>
                <span className="text-5xl font-bold tracking-tighter">{activeAppt.tokenNumber}</span>
                <span className="text-[10px] mt-2 opacity-80 underline">Track Live →</span>
              </div>
            </div>
          </div>
        ) : nextUpcoming ? (
          <div 
            onClick={() => navigate(`/patient/appointments`)}
            className="md:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-sm relative overflow-hidden group cursor-pointer hover:border-brand/40 transition-colors"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
              <Calendar className="w-48 h-48" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                <span>Next Scheduled Visit</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-brand/10 text-brand uppercase tracking-wider">
                  {nextUpcoming.appointmentDate === tomorrowStr ? 'Tomorrow' : 'Scheduled'}
                </span>
              </h2>
              <span className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full font-medium tracking-wide uppercase">
                {nextUpcoming.appointmentDate} · {nextUpcoming.appointmentTime}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
              <div className="flex-1 space-y-5">
                <div>
                  <p className="font-semibold text-2xl text-foreground">{nextUpcoming.doctorName}</p>
                  <p className="text-muted-foreground font-medium">{nextUpcoming.specialization}</p>
                  {nextUpcoming.problemDescription && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      <span className="font-semibold text-foreground">Concern:</span> {nextUpcoming.problemDescription}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/60 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>Live Queue Activates Tomorrow on Clinic Day</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Your OPD token slot is confirmed. When clinic opens {nextUpcoming.appointmentDate === tomorrowStr ? 'tomorrow morning' : `on ${nextUpcoming.appointmentDate}`}, live queue tracking will activate here to show calling status in real-time.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-48 aspect-square rounded-2xl bg-brand text-white flex flex-col items-center justify-center p-6 text-center shadow-lg transform transition-transform group-hover:scale-105">
                <span className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-2">Confirmed Token</span>
                <span className="text-5xl font-bold tracking-tighter">{nextUpcoming.tokenNumber || 'A-01'}</span>
                <span className="text-[10px] mt-2 opacity-80 underline">View Slip & Details →</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center text-center">
            <Activity className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
            <h3 className="font-bold text-foreground text-lg">No Active Appointments</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Book a consultation with our specialist doctors.</p>
            <button 
              onClick={() => navigate('/book-appointment')}
              className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Book an Appointment
            </button>
          </div>
        )}

        {/* Quick Access Features */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <h2 className="font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button 
              onClick={() => navigate('/specialities')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground shadow-sm group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-foreground">Find Doctor</span>
            </button>
            <button 
              onClick={() => navigate('/book-appointment')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground shadow-sm group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-foreground">Book Appt</span>
            </button>
            <button 
              onClick={() => navigate(activeAppt ? `/patient/queue?token=${activeAppt.tokenNumber}` : '/patient/queue')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-foreground">Live Queue</span>
            </button>
            <button 
              onClick={() => navigate('/doctor/login')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground shadow-sm group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-foreground">Doctor Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {/* Recent Medical Records */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Recent Clinical Records</h2>
            <button
              onClick={() => navigate('/patient/records')}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              View portfolio →
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => (
                <div 
                  key={record.id} 
                  onClick={() => navigate('/patient/records')}
                  className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-border bg-transparent hover:bg-secondary/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-background group-hover:shadow-sm transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground group-hover:text-brand transition-colors">
                        {record.problemCategory || 'Consultation Record'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{record.doctorName} • {record.appointmentDate}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold px-2 py-1 bg-secondary rounded uppercase tracking-wider text-secondary-foreground">
                    {record.status === 'completed' ? 'Completed' : (record.vitals ? 'Vitals' : 'Notes')}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No archived clinical records yet. Completed visit summaries and digital prescriptions will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Upcoming & Scheduled Visits</h2>
            <button 
              onClick={() => navigate('/book-appointment')}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              + New booking
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {upcomingVisits.length > 0 ? (
              upcomingVisits.map((appt) => (
                <div 
                  key={appt.id} 
                  onClick={() => navigate(`/patient/appointments`)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-brand/40 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center text-foreground group-hover:bg-brand group-hover:text-white transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Token</span>
                    <span className="text-base font-bold leading-none mt-0.5">{appt.tokenNumber || 'A-01'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-foreground group-hover:text-brand transition-colors">{appt.problemCategory || appt.specialization}</h4>
                      {appt.appointmentDate === tomorrowStr && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand/10 text-brand">
                          Tomorrow
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{appt.doctorName} • {appt.appointmentDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-foreground bg-secondary px-2.5 py-1 rounded-md">{appt.appointmentTime}</div>
                    <span className="text-[10px] text-brand font-medium block mt-1">View Slip →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No upcoming visits scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
