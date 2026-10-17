import { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Coffee, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  Info
} from 'lucide-react';
import { getCurrentDoctor } from '../../lib/doctorAuth';
import { 
  getDoctorScheduleSettings, 
  saveDoctorScheduleSettings, 
  type DoctorScheduleSettings 
} from '../../lib/queueStore';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function DoctorSchedule() {
  const session = getCurrentDoctor();
  const doctor = session?.doctor;
  const doctorId = doctor?.id || '6b69e7a2-bd9d-4c62-8fa4-10a49eb0f0f7';

  const [settings, setSettings] = useState<DoctorScheduleSettings>(() => 
    getDoctorScheduleSettings(doctorId)
  );

  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const refresh = () => setSettings(getDoctorScheduleSettings(doctorId));
    window.addEventListener('medisync:queue-update', refresh);
    window.addEventListener('caretrack:queue-update', refresh);
    return () => {
      window.removeEventListener('medisync:queue-update', refresh);
      window.removeEventListener('caretrack:queue-update', refresh);
    };
  }, [doctorId]);

  if (!doctor) return null;

  const toggleDay = (day: string) => {
    setSettings((prev) => {
      const exists = prev.workingDays.includes(day);
      return {
        ...prev,
        workingDays: exists 
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day],
      };
    });
  };

  const handleAddLeaveDate = () => {
    if (!newLeaveDate) return;
    if (settings.onLeaveDates.includes(newLeaveDate)) {
      setNewLeaveDate('');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      onLeaveDates: [...prev.onLeaveDates, newLeaveDate].sort(),
    }));
    setNewLeaveDate('');
  };

  const handleRemoveLeaveDate = (dateStr: string) => {
    setSettings((prev) => ({
      ...prev,
      onLeaveDates: prev.onLeaveDates.filter((d) => d !== dateStr),
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveDoctorScheduleSettings(settings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Generate preview of time slots based on current settings
  const generateSlotPreview = () => {
    const slots: string[] = [];
    const [startH, startM] = settings.startTime.split(':').map(Number);
    const [endH, endM] = settings.endTime.split(':').map(Number);
    const [breakSH, breakSM] = settings.breakStart.split(':').map(Number);
    const [breakEH, breakEM] = settings.breakEnd.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const breakStartMin = breakSH * 60 + breakSM;
    const breakEndMin = breakEH * 60 + breakEM;
    const duration = settings.slotDuration || 20;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      if (m >= breakStartMin && m < breakEndMin) {
        continue; // in break
      }
      const hour = Math.floor(m / 60);
      const min = m % 60;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMin = min < 10 ? `0${min}` : min;
      slots.push(`${displayHour}:${displayMin} ${period}`);
    }
    return slots;
  };

  const previewSlots = generateSlotPreview();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-card border border-border">
        <div>
          <span className="text-xs font-semibold text-brand uppercase tracking-wider block mb-1">
            Availability & Consultation Hours
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            Clinic Schedule & Hours
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure your active clinic days, consultation slot lengths, breaks, and unavailable dates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          className="px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-brand hover:text-brand-foreground transition-colors flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-center"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* ── Saved Notice ────────────────────────────────────────────────── */}
      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Schedule settings updated successfully. Patient booking availability has been refreshed.</span>
        </div>
      )}

      {/* ── Main Form Grid ──────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: WORKING DAYS */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-brand" />
            <h2 className="text-base font-heading font-bold text-foreground">
              Working Days
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Select the days of the week when you are available for outpatient consultations.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
            {ALL_DAYS.map((day) => {
              const active = settings.workingDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`p-3 rounded-lg border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                    active
                      ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                  }`}
                >
                  <span className="font-heading text-sm">{day.slice(0, 3)}</span>
                  <span className={`text-[10px] ${active ? 'text-brand font-bold' : 'text-muted-foreground'}`}>
                    {active ? 'Available' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: OPERATING HOURS & SLOT DURATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Shift Hours */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-brand" />
              <h2 className="text-base font-heading font-bold text-foreground">
                Consultation Hours
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Define your daily clinic opening and closing times.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Shift Start Time
                </label>
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Shift End Time
                </label>
                <input
                  type="time"
                  value={settings.endTime}
                  onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Slot Duration (Minutes per Patient)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 30, 45].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setSettings({ ...settings, slotDuration: mins })}
                    className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      settings.slotDuration === mins
                        ? 'border-brand bg-brand text-brand-foreground shadow-xs'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Break Hours & Status Message */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center gap-2.5">
              <Coffee className="w-4 h-4 text-brand" />
              <h2 className="text-base font-heading font-bold text-foreground">
                Break & Intermission
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Set midday breaks during which no appointments will be allocated.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Break Start
                </label>
                <input
                  type="time"
                  value={settings.breakStart}
                  onChange={(e) => setSettings({ ...settings, breakStart: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Break End
                </label>
                <input
                  type="time"
                  value={settings.breakEnd}
                  onChange={(e) => setSettings({ ...settings, breakEnd: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Patient Broadcast / Queue Message
              </label>
              <input
                type="text"
                placeholder="e.g. In Clinic · Running on schedule"
                value={settings.statusMessage || ''}
                onChange={(e) => setSettings({ ...settings, statusMessage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                This notice appears on patient queue tracking displays.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: ON-LEAVE & UNAVAILABLE DATES */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-brand" />
              <div>
                <h2 className="text-base font-heading font-bold text-foreground">
                  Mark Leave & Unavailable Dates
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Patients will not be allowed to book appointments on these dates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 max-w-md">
            <input
              type="date"
              value={newLeaveDate}
              onChange={(e) => setNewLeaveDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="button"
              onClick={handleAddLeaveDate}
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Date</span>
            </button>
          </div>

          {settings.onLeaveDates.length === 0 ? (
            <div className="p-4 rounded-lg bg-secondary/20 border border-border text-xs text-muted-foreground text-center">
              No leave dates marked. You are fully available on your active working days.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {settings.onLeaveDates.map((d) => (
                <div
                  key={d}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium"
                >
                  <span>{new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLeaveDate(d)}
                    className="p-0.5 hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer"
                    title="Remove leave date"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: LIVE PREVIEW OF BOOKABLE PATIENT SLOTS */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-brand" />
              <div>
                <h2 className="text-base font-heading font-bold text-foreground">
                  Patient Booking Slots Preview
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculated dynamically from your shift ({settings.startTime} - {settings.endTime}) and {settings.slotDuration}m increments.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-foreground">
              {previewSlots.length} Slots / Day
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 max-h-48 overflow-y-auto">
            {previewSlots.map((slot) => (
              <span
                key={slot}
                className="px-2.5 py-1 rounded-md bg-secondary/50 border border-border text-[11px] font-mono text-foreground"
              >
                {slot}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-brand flex-shrink-0" />
            <span>
              Break from {settings.breakStart} to {settings.breakEnd} is automatically reserved and omitted from bookable slots.
            </span>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-brand hover:text-brand-foreground transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Clinic Schedule</span>
          </button>
        </div>

      </form>
    </div>
  );
}
