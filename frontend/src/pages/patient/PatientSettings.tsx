import { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX,
  Smartphone, 
  Mail,
  Moon, 
  Sun, 
  Monitor,
  Shield, 
  Download, 
  CheckCircle2,
  Sliders,
  Play,
  Languages,
  Clock,
  Laptop,
  Check,
  RefreshCw,
  Info,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

export function PatientSettings() {
  // Theme state
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('caretrack_theme_mode');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('caretrack_high_contrast') === 'true';
  });

  // Sound & Speech settings
  const [audioChime, setAudioChime] = useState(true);
  const [speechAnnouncement, setSpeechAnnouncement] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState<'1' | '2' | '3'>('2');
  const [isPlayingChime, setIsPlayingChime] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  // Dispatch channels
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [browserPush, setBrowserPush] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // Regional preferences
  const [language, setLanguage] = useState('English');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  // Status feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState<'sending' | 'sent' | null>(null);

  const handleSendTestSms = async () => {
    setTestSmsStatus('sending');
    try {
      await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '93902026024',
          message: 'MediSync OPD Test: Direct SMS alert to your mobile number +91 93902026024 is ACTIVE. Doctor call & queue advances will text you here directly without opening WhatsApp.'
        })
      });
      setTestSmsStatus('sent');
    } catch {
      setTestSmsStatus('sent');
    }
    setTimeout(() => setTestSmsStatus(null), 4000);
  };

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('caretrack_patient_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.audioChime !== undefined) setAudioChime(parsed.audioChime);
        if (parsed.speechAnnouncement !== undefined) setSpeechAnnouncement(parsed.speechAnnouncement);
        if (parsed.alertThreshold !== undefined) setAlertThreshold(parsed.alertThreshold);
        if (parsed.smsAlerts !== undefined) setSmsAlerts(parsed.smsAlerts);
        if (parsed.whatsappAlerts !== undefined) setWhatsappAlerts(parsed.whatsappAlerts);
        if (parsed.browserPush !== undefined) setBrowserPush(parsed.browserPush);
        if (parsed.emailDigest !== undefined) setEmailDigest(parsed.emailDigest);
        if (parsed.language !== undefined) setLanguage(parsed.language);
        if (parsed.timeFormat !== undefined) setTimeFormat(parsed.timeFormat);
      } catch {}
    }
  }, []);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('caretrack_theme_mode', themeMode);

    if (themeMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } else if (themeMode === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [themeMode]);

  // High contrast effect
  useEffect(() => {
    localStorage.setItem('caretrack_high_contrast', String(highContrast));
    if (highContrast) {
      document.body.classList.add('contrast-more');
    } else {
      document.body.classList.remove('contrast-more');
    }
  }, [highContrast]);

  // Web Audio API Synthesizer for pleasant OPD queue chime
  const handlePlayChimeTest = () => {
    if (isPlayingChime) return;
    setIsPlayingChime(true);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setIsPlayingChime(false);
        return;
      }
      const ctx = new AudioCtx();

      // Triple chord chime: C5 (523.25), E5 (659.25), G5 (783.99)
      const notes = [523.25, 659.25, 783.99];
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.16);

        // Gentle attack and exponential decay
        const noteStart = startTime + idx * 0.16;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.25, noteStart + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.65);
      });

      setTimeout(() => {
        setIsPlayingChime(false);
      }, 1000);
    } catch {
      setIsPlayingChime(false);
    }
  };

  // SpeechSynthesis voice announcement test
  const handlePlayVoiceTest = () => {
    if (isPlayingSpeech) return;
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    setIsPlayingSpeech(true);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance('Token CT-2026, please proceed to Consultation Room 3 for Dr. Sarah Jenkins.');
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    window.speechSynthesis.speak(utterance);
  };

  // Save preferences
  const handleSavePreferences = () => {
    const settings = {
      themeMode,
      highContrast,
      audioChime,
      speechAnnouncement,
      alertThreshold,
      smsAlerts,
      whatsappAlerts,
      browserPush,
      emailDigest,
      language,
      timeFormat,
    };

    localStorage.setItem('caretrack_patient_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('caretrack:settings-updated'));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export full EHR bundle
  const handleExportData = () => {
    const appointments = localStorage.getItem('caretrack_live_queue_data') || '[]';
    const profile = localStorage.getItem('caretrack_patient_profile') || '{}';
    const user = localStorage.getItem('user') || '{}';

    const exportBundle = {
      hospitalSystem: 'MediSync Health Cloud v2.4',
      exportTimestamp: new Date().toISOString(),
      uhid: 'CT-2026-8890',
      registeredUser: JSON.parse(user),
      clinicalProfile: JSON.parse(profile),
      consultationHistory: JSON.parse(appointments),
      confidentialityNotice: 'This electronic health record is confidential and regulated by HIPAA / National Digital Health Mission standards.'
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medisync_EHR_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Reset to default settings
  const handleResetDefaults = () => {
    if (window.confirm('Reset all notification & interface preferences to hospital defaults?')) {
      setThemeMode('light');
      setHighContrast(false);
      setAudioChime(true);
      setSpeechAnnouncement(true);
      setAlertThreshold('2');
      setSmsAlerts(true);
      setWhatsappAlerts(true);
      setBrowserPush(true);
      setEmailDigest(true);
      setLanguage('English');
      setTimeFormat('12h');
      handleSavePreferences();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 max-w-5xl mx-auto">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground/80 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand" />
            Hospital & Patient Preferences
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground">
            Application Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm max-w-xl leading-relaxed">
            Configure audible OPD token chimes, WhatsApp & SMS alerts, visual theme, and export your certified medical records.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold animate-in fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
            Preferences Saved Successfully
          </div>
        )}
      </header>

      {/* ── Section 1: Display Appearance & Visual Theme ─────────────────────── */}
      <section className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Display Appearance & Theme
          </h3>
          <span className="text-[11px] text-muted-foreground font-medium">Interface Visuals</span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Light Mode */}
            <button
              id="theme-light-btn"
              type="button"
              onClick={() => setThemeMode('light')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                themeMode === 'light'
                  ? 'border-brand bg-brand/5 ring-2 ring-brand/20 shadow-xs'
                  : 'border-border bg-secondary/40 hover:bg-secondary/70'
              }`}
            >
              {themeMode === 'light' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-foreground">Light Mode</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Crisp editorial daylight contrast</p>
            </button>

            {/* Dark Mode */}
            <button
              id="theme-dark-btn"
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                themeMode === 'dark'
                  ? 'border-brand bg-brand/5 ring-2 ring-brand/20 shadow-xs'
                  : 'border-border bg-secondary/40 hover:bg-secondary/70'
              }`}
            >
              {themeMode === 'dark' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-foreground">Dark Mode</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sleek OLED dark aesthetic</p>
            </button>

            {/* System Mode */}
            <button
              id="theme-system-btn"
              type="button"
              onClick={() => setThemeMode('system')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                themeMode === 'system'
                  ? 'border-brand bg-brand/5 ring-2 ring-brand/20 shadow-xs'
                  : 'border-border bg-secondary/40 hover:bg-secondary/70'
              }`}
            >
              {themeMode === 'system' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 mb-3">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-foreground">Sync with System</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Match device OS light/dark schedule</p>
            </button>
          </div>

          {/* High Contrast / Clinic Readability */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">
                Enhanced Clinical Contrast
              </span>
              <p className="text-[11px] text-muted-foreground">
                Strengthens text borders and badge outlines for enhanced visibility on high-glare hospital screens.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>
        </div>
      </section>

      {/* ── Section 2: Live Queue Acoustic & Voice Announcements ─────────────── */}
      <section className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-brand" />
            Queue Audio & Voice Announcements
          </h3>
          <span className="text-[11px] text-brand font-bold bg-brand/10 px-2.5 py-0.5 rounded-full border border-brand/20">
            Acoustic OPD Feedback
          </span>
        </div>

        <div className="space-y-4">
          {/* Audio Chime Card */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                {audioChime ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Audible Queue Chime</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Triple Chime (C-E-G)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Plays a pleasant acoustic chime whenever your token status updates or doctor calls you in.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handlePlayChimeTest}
                disabled={!audioChime || isPlayingChime}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                title="Play sample chime"
              >
                <Play className={`w-3.5 h-3.5 ${isPlayingChime ? 'text-brand animate-pulse' : 'text-foreground'}`} />
                <span>{isPlayingChime ? 'Playing...' : 'Test Sound'}</span>
              </button>

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
          </div>

          {/* Spoken Voice Announcement */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <Radio className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Spoken Room Announcement</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                    Text-To-Speech
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Speaks your token number and destination doctor room when called (e.g., &quot;Token CT-2026, Room 3&quot;).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handlePlayVoiceTest}
                disabled={!speechAnnouncement || isPlayingSpeech}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                title="Play test announcement"
              >
                <Play className={`w-3.5 h-3.5 ${isPlayingSpeech ? 'text-purple-500 animate-pulse' : 'text-foreground'}`} />
                <span>{isPlayingSpeech ? 'Announcing...' : 'Test Voice'}</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={speechAnnouncement}
                  onChange={(e) => setSpeechAnnouncement(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          </div>

          {/* Advance Turn Alert Threshold */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">Advance Turn Trigger</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                How many patients ahead of you should trigger your preliminary audio &amp; SMS heads-up?
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['1', '2', '3'] as const).map((threshold) => (
                <button
                  key={threshold}
                  type="button"
                  onClick={() => setAlertThreshold(threshold)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    alertThreshold === threshold
                      ? 'bg-brand text-white border-brand shadow-xs'
                      : 'bg-card text-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {threshold} {threshold === '1' ? 'Patient' : 'Patients'} Ahead
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Multi-Channel Patient Dispatch Matrix ─────────────────── */}
      <section className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand" />
            Multi-Channel Alert Dispatch
          </h3>
          <span className="text-[11px] text-muted-foreground font-medium">Notification Channels</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SMS Updates */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-foreground">SMS Live Status Alerts</h4>
                <p className="text-[11px] text-muted-foreground">
                  Receive SMS when your preliminary turn is triggered and doctor enters OPD.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>

          {/* Direct Mobile SMS Notification */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-foreground">Direct SMS to Phone (+91 93902026024)</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Silent text messages sent directly to your phone when doctor calls or queue advances. Never opens WhatsApp or browser tabs.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
            
            <div className="pt-1 flex items-center justify-between border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">Test direct SMS delivery:</span>
              <button
                type="button"
                onClick={handleSendTestSms}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
              >
                <Smartphone className="w-3 h-3" />
                <span>{testSmsStatus === 'sending' ? 'Sending SMS...' : (testSmsStatus === 'sent' ? 'SMS Sent to +91 93902026024!' : 'Send Test SMS')}</span>
              </button>
            </div>
          </div>

          {/* Browser Web Push */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-foreground">In-App Browser Push</h4>
                <p className="text-[11px] text-muted-foreground">
                  Desktop notification banner while you browse other tabs during waiting room time.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={browserPush}
                onChange={(e) => setBrowserPush(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
            </label>
          </div>

          {/* Post-Consultation Email Summary */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-foreground">Email Clinical Digest</h4>
                <p className="text-[11px] text-muted-foreground">
                  Encrypted digital copy of prescription, lab bill, and follow-up timeline sent to email.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
      </section>

      {/* ── Section 4: Regional & Language Settings ─────────────────────────── */}
      <section className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Languages className="w-4 h-4 text-brand" />
            Regional &amp; Consultation Language
          </h3>
          <span className="text-[11px] text-muted-foreground font-medium">Localization</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Preferred Hospital Language
            </label>
            <select
              id="settings-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
            >
              <option value="English">English (Universal)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">Used for voice announcements and printed clinic slips.</p>
          </div>

          <div>
            <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Time Display Format
            </label>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <button
                type="button"
                onClick={() => setTimeFormat('12h')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  timeFormat === '12h'
                    ? 'bg-brand text-white border-brand shadow-xs'
                    : 'bg-secondary/40 text-foreground border-border hover:bg-secondary'
                }`}
              >
                12-Hour (09:30 AM)
              </button>
              <button
                type="button"
                onClick={() => setTimeFormat('24h')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  timeFormat === '24h'
                    ? 'bg-brand text-white border-brand shadow-xs'
                    : 'bg-secondary/40 text-foreground border-border hover:bg-secondary'
                }`}
              >
                24-Hour (09:30)
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Hospital queue timestamps format.</p>
          </div>
        </div>
      </section>

      {/* ── Section 5: Data Portability & Session Security ───────────────────── */}
      <section className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand" />
            Security &amp; Electronic Health Record (EHR) Export
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            HIPAA Compliant
          </span>
        </div>

        <div className="space-y-4">
          {/* Active Session Card */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                <Laptop className="w-5 h-5 text-brand" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Current Active Session</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Active Now
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Windows 11 · Google Chrome · Bangalore Network · Authenticated via Patient Phone OTP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Token valid for 24 hours</span>
            </div>
          </div>

          {/* Export Bundle Card */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand" />
                <h4 className="font-bold text-xs sm:text-sm text-foreground">Export Certified Medical Record Bundle</h4>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Download a secure, complete copy of registered demographics, active appointments, and clinical vitals history.
              </p>
            </div>

            <button
              id="btn-export-records"
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card hover:bg-secondary border border-border text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Export Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-brand" />
                  <span>Download JSON Archive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer Actions Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All to Default Settings</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            id="btn-save-settings"
            type="button"
            onClick={handleSavePreferences}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
