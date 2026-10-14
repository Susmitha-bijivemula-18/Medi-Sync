import { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Activity, 
  Calendar, 
  CheckCheck, 
  Trash2, 
  Sparkles 
} from 'lucide-react';
import { initQueueSync } from '../../lib/queueStore';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'queue' | 'appointment' | 'schedule' | 'rx';
  read: boolean;
}

export function PatientNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('caretrack_patient_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'notif-1',
        title: 'Token A-23 Called',
        message: 'Dr. Ananya Rao has called Token A-23 into Consultation Room 104.',
        timestamp: '10 mins ago',
        type: 'queue',
        read: false,
      },
      {
        id: 'notif-2',
        title: 'Queue Moving Promptly',
        message: 'Current waiting time is running at an estimated 8 minutes per patient.',
        timestamp: '25 mins ago',
        type: 'schedule',
        read: false,
      },
      {
        id: 'notif-3',
        title: 'Appointment Confirmed',
        message: 'Your Cardiology appointment with Dr. Ananya Rao is confirmed for today.',
        timestamp: '1 hour ago',
        type: 'appointment',
        read: true,
      },
      {
        id: 'notif-4',
        title: 'Digital Prescription Synced',
        message: 'Your clinical prescription and vital records have been securely added to your portfolio.',
        timestamp: 'Yesterday',
        type: 'rx',
        read: true,
      },
    ];
  });

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    initQueueSync();
    localStorage.setItem('caretrack_patient_notifications', JSON.stringify(notifications));
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

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'queue':
        return <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-brand" />;
      case 'schedule':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'rx':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Real-Time Broadcasts</span>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
            Notifications & Queue Alerts
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live turn announcements, appointment reminders, and clinic alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
            <button
              onClick={clearAll}
              className="p-2 text-muted-foreground hover:text-rose-500 rounded-xl hover:bg-muted/50 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-card text-foreground shadow-xs'
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

      {/* Notification Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border p-8 bg-card/40">
          <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No notifications to show</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You're all caught up! When a doctor calls your token or updates clinic status, you'll be alerted here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleRead(item.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                item.read
                  ? 'border-border bg-card/60 hover:bg-card'
                  : 'border-brand/30 bg-card shadow-xs hover:border-brand/60'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${item.read ? 'text-foreground' : 'text-brand'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.read && (
                <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
