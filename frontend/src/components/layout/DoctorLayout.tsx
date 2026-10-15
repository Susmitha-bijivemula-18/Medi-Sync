import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  UserCheck, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Stethoscope,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCurrentDoctor, doctorSignOut } from '../../lib/doctorAuth';
import { DoctorAvatar } from '../common/DoctorAvatar';
import { getDoctorScheduleSettings, saveDoctorScheduleSettings } from '../../lib/queueStore';

const doctorNavItems = [
  { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
  { name: 'Live Queue', path: '/doctor/queue', icon: Users },
  { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
  { name: 'Schedule & Hours', path: '/doctor/schedule', icon: Clock },
  { name: 'My Patients', path: '/doctor/patients', icon: UserCheck },
];

export function DoctorLayout() {
  const navigate = useNavigate();
  const session = getCurrentDoctor();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Clinic status state
  const doctorId = session?.doctor?.id || '1';
  const [schedule, setSchedule] = useState(() => getDoctorScheduleSettings(doctorId));

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleStatusUpdate = () => {
      setSchedule(getDoctorScheduleSettings(doctorId));
    };
    window.addEventListener('caretrack:queue-update', handleStatusUpdate);
    return () => window.removeEventListener('caretrack:queue-update', handleStatusUpdate);
  }, [doctorId]);

  // Protect route
  if (!session) {
    return <Navigate to="/doctor/login" replace />;
  }

  const { doctor } = session;

  const handleStatusChange = (newStatus: 'active' | 'on_break' | 'delayed') => {
    const updated = {
      ...schedule,
      clinicStatus: newStatus,
      statusMessage: 
        newStatus === 'active' 
          ? 'In Clinic · Calling patients on time' 
          : (newStatus === 'on_break' ? 'Doctor on short break (15 min)' : 'Clinic delayed by 15 mins'),
    };
    saveDoctorScheduleSettings(updated);
    setSchedule(updated);
  };

  const handleLogout = () => {
    doctorSignOut();
    navigate('/doctor/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border bg-card shrink-0">
        
        {/* Brand / Doctor Portal Header */}
        <div className="p-5 border-b border-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-sm tracking-tight text-foreground block">
                CareTrack
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand block">
                Doctor Portal
              </span>
            </div>
          </div>
        </div>

        {/* Active Doctor Identity Card */}
        <div className="p-4 mx-3 my-3 rounded-lg bg-secondary/50 border border-border/60">
          <div className="flex items-center gap-3">
            <DoctorAvatar
              src={doctor.avatar}
              name={doctor.full_name}
              className="w-10 h-10 border border-border shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-heading font-bold text-foreground truncate">
                {doctor.full_name}
              </h3>
              <p className="text-[11px] text-brand font-medium truncate">
                {doctor.specialization}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {doctor.qualification}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
          {doctorNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors group",
                    isActive
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Navigation: Patient Link & Logout */}
        <div className="p-3 border-t border-border/70 space-y-1">
          <a
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Patient Website</span>
            </span>
            <span className="text-[10px] font-mono opacity-60">↗</span>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between gap-4 shrink-0">
          
          {/* Left: Mobile Menu Trigger / Section Indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-md hover:bg-secondary text-foreground md:hidden"
              aria-label="Open doctor menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Clinic Room:</span>
              <span className="text-muted-foreground">Department of {doctor.specialization}</span>
            </div>
          </div>

          {/* Right: Clinic Live Status Switcher & Theme Toggle */}
          <div className="flex items-center gap-3">
            
            {/* Live Clinic Status Selector */}
            <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border text-[11px] font-medium">
              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer",
                  schedule.clinicStatus === 'active'
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>In Clinic</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('on_break')}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer",
                  schedule.clinicStatus === 'on_break'
                    ? "bg-amber-600 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>On Break</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('delayed')}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer",
                  schedule.clinicStatus === 'delayed'
                    ? "bg-rose-600 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Delayed</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Sub-page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── MOBILE NAVIGATION DRAWER ────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col md:hidden p-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-sm text-foreground">
                      CareTrack
                    </h2>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                      Doctor Portal
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Doctor Card */}
              <div className="my-4 p-3 rounded-lg bg-secondary/60 flex items-center gap-3">
                <DoctorAvatar
                  src={doctor.avatar}
                  name={doctor.full_name}
                  className="w-10 h-10 border border-border shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-foreground truncate">{doctor.full_name}</h3>
                  <p className="text-[11px] text-brand">{doctor.specialization}</p>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex-1 space-y-1 overflow-y-auto">
                {doctorNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border mt-auto space-y-2">
                <a
                  href="/"
                  className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  <span>Patient Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
