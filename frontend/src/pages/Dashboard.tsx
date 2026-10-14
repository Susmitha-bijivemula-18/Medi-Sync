import { useState, useEffect } from 'react';
import { Search, Calendar, Users, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadAllAppointments, getPatientQueueStatus, initQueueSync, type QueueAppointment } from '../lib/queueStore';

export function Dashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<QueueAppointment[]>(() => loadAllAppointments());

  useEffect(() => {
    initQueueSync();
    const refresh = () => setAppointments(loadAllAppointments());
    window.addEventListener('caretrack:queue-update', refresh);
    return () => window.removeEventListener('caretrack:queue-update', refresh);
  }, []);

  // Find active appointment: prioritized by in-consultation, then waiting, then most recent
  const activeAppt = 
    appointments.find((a) => a.status === 'in-consultation') ||
    appointments.find((a) => a.status === 'waiting') ||
    appointments[0];

  const queueInfo = activeAppt ? getPatientQueueStatus(activeAppt.tokenNumber) : null;
  const upcomingVisits = appointments.filter((a) => a.id !== activeAppt?.id && (a.status === 'waiting' || a.status === 'in-consultation')).slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Good morning, Patient Portal</h1>
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
        {/* Active Appointment Card */}
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
                {activeAppt.status === 'completed' ? 'Recent Completed Consultation' : 'Active Appointment'}
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
            <span className="text-xs text-muted-foreground">Synchronized</span>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { title: 'Cardiology Consultation Report', doctor: 'Dr. Ananya Rao', date: 'Oct 14, 2026', type: 'Clinical' },
              { title: 'Blood Pressure & ECG Review', doctor: 'Dr. Ananya Rao', date: 'Oct 01, 2026', type: 'Vitals' },
              { title: 'General Health Screening', doctor: 'Dr. Priya Nair', date: 'Sep 15, 2026', type: 'Note' },
            ].map((record, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-border bg-transparent hover:bg-secondary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-background group-hover:shadow-sm transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground">{record.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{record.doctor} • {record.date}</p>
                  </div>
                </div>
                <div className="text-[10px] font-semibold px-2 py-1 bg-secondary rounded uppercase tracking-wider text-secondary-foreground">
                  {record.type}
                </div>
              </div>
            ))}
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
                  onClick={() => navigate(`/patient/queue?token=${appt.tokenNumber}`)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-brand/40 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center text-foreground group-hover:bg-brand group-hover:text-white transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Token</span>
                    <span className="text-base font-bold leading-none mt-0.5">{appt.tokenNumber}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-foreground group-hover:text-brand transition-colors">{appt.problemCategory || appt.specialization}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{appt.doctorName} • {appt.appointmentDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-foreground bg-secondary px-2.5 py-1 rounded-md">{appt.appointmentTime}</div>
                    <span className="text-[10px] text-brand font-medium block mt-1">Track →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No additional upcoming visits scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
