import { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  Smartphone, 
  Mail,
  Moon, 
  Sun, 
  Shield, 
  Download, 
  CheckCircle2 
} from 'lucide-react';

export function PatientSettings() {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [audioChime, setAudioChime] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleSave = () => {
    localStorage.setItem('caretrack_patient_settings', JSON.stringify({
      smsAlerts,
      whatsappAlerts,
      audioChime,
      emailDigest,
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const appointments = localStorage.getItem('caretrack_live_queue_data') || '[]';
    const profile = localStorage.getItem('caretrack_patient_profile') || '{}';
    const exportBundle = {
      exportDate: new Date().toISOString(),
      patientProfile: JSON.parse(profile),
      appointments: JSON.parse(appointments),
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caretrack_medical_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Preferences</span>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
            Application Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure real-time queue sounds, SMS updates, visual theme, and medical record export.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Preferences saved
          </div>
        )}
      </header>

      {/* Visual Theme Section */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          {isDark ? <Moon className="w-4 h-4 text-brand" /> : <Sun className="w-4 h-4 text-amber-500" />}
          Display Appearance & Theme
        </h3>
        <p className="text-xs text-muted-foreground -mt-4">
          Choose how CareTrack looks on your display.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            id="theme-light-btn"
            type="button"
            onClick={() => setIsDark(false)}
            className={`p-4 rounded-xl border text-center transition-all ${
              !isDark
                ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <div className="text-xs font-bold text-foreground">Light Mode</div>
            <span className="text-[10px] text-muted-foreground">Crisp editorial look</span>
          </button>

          <button
            id="theme-dark-btn"
            type="button"
            onClick={() => setIsDark(true)}
            className={`p-4 rounded-xl border text-center transition-all ${
              isDark
                ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <Moon className="w-6 h-6 mx-auto mb-2 text-brand" />
            <div className="text-xs font-bold text-foreground">Dark Mode</div>
            <span className="text-[10px] text-muted-foreground">OLED sleek dark aesthetic</span>
          </button>
        </div>
      </div>

      {/* Live Queue & Alert Preferences */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand" />
          Queue Announcements & Chimes
        </h3>

        <div className="space-y-4">
          {/* Audio Chime */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-brand">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">Audible Queue Chime</h4>
                <p className="text-[11px] text-muted-foreground">Plays a pleasant acoustic chime when your OPD token is called</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={audioChime}
                onChange={(e) => setAudioChime(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>

          {/* SMS Updates */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-foreground">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">SMS Live Status Alerts</h4>
                <p className="text-[11px] text-muted-foreground">Receive SMS when 2 patients remain before your turn</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>

          {/* WhatsApp Updates */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">WhatsApp Turn Notification</h4>
                <p className="text-[11px] text-muted-foreground">Receive instant WhatsApp ping with room number and doctor status</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-brand">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">Post-Consultation Email Summary</h4>
                <p className="text-[11px] text-muted-foreground">Receive copy of digital prescription and visit report via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={(e) => setEmailDigest(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>
        </div>
      </div>

      {/* Privacy & Medical Export */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand" />
          Medical Data Portability & Privacy
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border">
          <div>
            <h4 className="font-semibold text-xs text-foreground">Export Medical Records</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Download a secure JSON copy of all consultations, vitals, and registered info</p>
          </div>
          <button
            id="btn-export-records"
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Download Data
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          id="btn-save-settings"
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all shadow-xs"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
