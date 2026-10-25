import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Clock, 
  Activity, 
  Calendar, 
  CheckCheck, 
  Trash2, 
  Sparkles,
  Pill,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
  Stethoscope,
  ArrowRight,
  ExternalLink,
  Check,
  Radio,
  Building2,
  Navigation
} from 'lucide-react';
import { initQueueSync, loadAllAppointments } from '../../lib/queueStore';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'queue' | 'appointment' | 'schedule' | 'rx' | 'clinic';
  priority?: 'urgent' | 'high' | 'normal';
  actionLabel?: string;
  actionUrl?: string;
  read: boolean;
}

const STORAGE_KEY = 'caretrack_patient_notifications_v3';

// Helper to sanitize notification actions according to UX preferences:
// - Keep/ensure "Track Live Queue" on all queue alerts
// - Remove "Check Live ETA" and "View Appointment Pass" from schedule and appointment alerts
function sanitizeNotification(n: NotificationItem): NotificationItem {
  if (
    n.actionLabel === 'Check Live ETA' ||
    n.actionLabel === 'View Appointment Pass' ||
    n.type === 'schedule' ||
    n.type === 'appointment'
  ) {
    const copy = { ...n };
    delete copy.actionLabel;
    delete copy.actionUrl;
    return copy;
  }
  if (n.type === 'queue') {
    return {
      ...n,
      actionLabel: 'Track Live Queue',
      actionUrl: '/patient/queue',
    };
  }
  return n;
}

export function PatientNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    // Check both v3 and v2 storage, sanitizing any legacy action buttons
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('caretrack_patient_notifications_v2');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeNotification);
        }
      } catch {}
    }

    const all = loadAllAppointments();

    const initialNotifs: NotificationItem[] = [
      {
        id: 'notif-turn-now',
        title: 'Your Turn Is Next: Token R-01',
        message: 'Dr. Ramesh Kumar is preparing to call your token. Please be seated outside Room 204.',
        timestamp: 'Just now',
        type: 'queue',
        priority: 'urgent',
        actionLabel: 'Track Live Queue',
        actionUrl: '/patient/queue',
        read: false,
      },
      {
        id: 'notif-rx-ready',
        title: 'New Digital Prescription & Clinical Summary',
        message: 'Your Cardiology consultation summary and 3 prescribed medications have been validated and signed.',
        timestamp: '18m ago',
        type: 'rx',
        priority: 'high',
        actionLabel: 'View Digital Rx Slip',
        actionUrl: '/patient/records',
        read: false,
      },
      {
        id: 'notif-smart-arrival',
        title: 'Smart Arrival Advisory: 2 Tokens Ahead',
        message: 'Current waiting queue pace is 11 mins/patient. Hospital departure recommended within 10 minutes.',
        timestamp: '35m ago',
        type: 'schedule',
        priority: 'normal',
        read: false,
      },
      {
        id: 'notif-appt-confirmed',
        title: 'Appointment Confirmed: Dr. Deepa Krishnan',
        message: 'Pediatrics consultation booked for Room 108. Token D-01 assigned with certified electronic check-in.',
        timestamp: '1h ago',
        type: 'appointment',
        priority: 'normal',
        read: true,
      },
      {
        id: 'notif-clinic-broadcast',
        title: 'Hospital OPD & Diagnostic Wing Notice',
        message: 'Central pharmacy, phlebotomy lab, and ECG diagnostics are open for routine outpatient billing.',
        timestamp: '2h ago',
        type: 'clinic',
        priority: 'normal',
        read: true,
      }
    ];

    // Add any live appointments from user store
    all.slice(0, 3).forEach((appt) => {
      const cleanDoc = (appt.doctorName || 'Doctor').replace(/^Dr\.?\s*/i, '').trim();
      const prefix = (cleanDoc[0] || 'A').toUpperCase();
      const token = appt.tokenNumber || `${prefix}-01`;

      if (appt.status === 'in-consultation') {
        initialNotifs.unshift({
          id: `live-consult-${appt.id}`,
          title: `Now in Consultation: Token ${token}`,
          message: `${appt.doctorName} (${appt.specialization}) has commenced your consultation in Room 202.`,
          timestamp: 'Live now',
          type: 'queue',
          priority: 'urgent',
          actionLabel: 'Track Live Queue',
          actionUrl: '/patient/queue',
          read: false,
        });
      }
    });

    return initialNotifs.map(sanitizeNotification);
  });

  const [filter, setFilter] = useState<'all' | 'queue' | 'rx' | 'appointment' | 'unread'>('all');

  useEffect(() => {
    initQueueSync();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === 'unread') return !item.read;
      if (filter === 'queue') return item.type === 'queue' || item.type === 'schedule';
      if (filter === 'rx') return item.type === 'rx';
      if (filter === 'appointment') return item.type === 'appointment';
      return true;
    });
  }, [notifications, filter]);

  const getNotificationVisual = (item: NotificationItem) => {
    switch (item.type) {
      case 'queue':
        return {
          icon: <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />,
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
          badge: 'Live Queue Alert',
          borderAccent: item.priority === 'urgent' ? 'border-l-4 border-l-emerald-500' : ''
        };
      case 'rx':
        return {
          icon: <Pill className="w-4 h-4 text-brand" />,
          bg: 'bg-brand/10 border-brand/20 text-brand',
          badge: 'Prescription Ready',
          borderAccent: 'border-l-4 border-l-brand'
        };
      case 'schedule':
        return {
          icon: <Navigation className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          bg: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300',
          badge: 'Smart Departure',
          borderAccent: 'border-l-4 border-l-sky-500'
        };
      case 'appointment':
        return {
          icon: <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
          badge: 'OPD Schedule',
          borderAccent: 'border-l-4 border-l-indigo-500'
        };
      case 'clinic':
      default:
        return {
          icon: <Building2 className="w-4 h-4 text-muted-foreground" />,
          bg: 'bg-secondary border-border text-foreground',
          badge: 'Clinic Notice',
          borderAccent: 'border-l-4 border-l-border'
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 max-w-5xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground/80 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            Live Hospital Broadcasts
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground">
            Notifications & Queue Alerts
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm max-w-xl leading-relaxed">
            Real-time token calls, arrival advisories, digital prescription releases, and clinic alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-brand" />
                Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="p-2 text-muted-foreground hover:text-rose-500 rounded-xl hover:bg-secondary border border-transparent hover:border-border transition-colors cursor-pointer"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* ── Category Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary/60 border border-border/80 rounded-2xl w-full sm:w-fit text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-card text-foreground shadow-2xs font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('queue')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filter === 'queue'
              ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Queue & Turns
        </button>

        <button
          onClick={() => setFilter('rx')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filter === 'rx'
              ? 'bg-card text-brand shadow-2xs font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          Prescriptions
        </button>

        <button
          onClick={() => setFilter('appointment')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filter === 'appointment'
              ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Appointments
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-card text-foreground shadow-2xs font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Notification Feed ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-border p-8 bg-card/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No alerts in this category</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You're all caught up! Live turn calls, doctor arrival reminders, and electronic prescriptions will display here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const visual = getNotificationVisual(item);

            return (
              <div
                key={item.id}
                onClick={() => toggleRead(item.id)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative ${
                  item.read
                    ? 'border-border/80 bg-card hover:border-border hover:shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-gradient-to-r from-card to-blue-50/20 dark:to-blue-950/15 shadow-2xs hover:border-brand/40'
                } ${visual.borderAccent}`}
              >
                {/* Left: Icon & Content */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${visual.bg}`}>
                    {visual.icon}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${visual.bg}`}>
                        {visual.badge}
                      </span>

                      {item.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Immediate
                        </span>
                      )}

                      <span className="text-[11px] text-muted-foreground font-medium">
                        · {item.timestamp}
                      </span>

                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                      )}
                    </div>

                    <h4 className={`text-sm font-bold leading-tight ${item.read ? 'text-foreground/90' : 'text-foreground'}`}>
                      {item.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pl-12 sm:pl-0">
                  {item.actionLabel && item.actionUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRead(item.id);
                        navigate(item.actionUrl!);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary hover:bg-brand hover:text-white border border-border text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      {item.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => dismissNotification(item.id, e)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-colors cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

