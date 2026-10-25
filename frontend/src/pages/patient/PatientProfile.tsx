import { useState, useMemo } from 'react';
import { 
  User, 
  Heart, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  ShieldCheck,
  QrCode,
  Copy,
  Printer,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Check,
  Droplet,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { loadAllAppointments } from '../../lib/queueStore';

interface PatientProfileData {
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  allergies: string;
  chronicConditions: string;
}

export function PatientProfile() {
  const [profile, setProfile] = useState<PatientProfileData>(() => {
    const saved = localStorage.getItem('caretrack_patient_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }

    const userStr = localStorage.getItem('user');
    let u: any = {};
    if (userStr) {
      try { u = JSON.parse(userStr); } catch {}
    }

    const all = loadAllAppointments();
    const latest = all[all.length - 1];

    return {
      fullName: u.name || latest?.patientName || 'Susmitha',
      age: Number(u.age || latest?.patientAge || 21),
      gender: u.gender || 'Female',
      phone: u.phone || latest?.patientPhone || '93902026024',
      email: u.email || latest?.patientEmail || 'susmithabijivemula@gmail.com',
      bloodGroup: u.bloodGroup || latest?.bloodGroup || 'A+',
      address: u.location || latest?.location || 'Bangalore, Karnataka',
      emergencyContactName: u.emergencyContactName || 'Ramesh (Father)',
      emergencyContactRelation: u.emergencyContactRelation || 'Parent',
      emergencyContactPhone: u.emergencyContactPhone || '93902026024',
      allergies: u.allergies || 'Penicillin (Mild)',
      chronicConditions: u.chronicConditions || 'None reported',
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUhid, setCopiedUhid] = useState(false);

  const uhid = 'CT-2026-8890';

  // Calculate profile completion percentage
  const completionScore = useMemo(() => {
    let filled = 0;
    const fields = [
      profile.fullName, profile.age, profile.gender, profile.phone,
      profile.email, profile.bloodGroup, profile.address,
      profile.emergencyContactName, profile.emergencyContactPhone
    ];
    fields.forEach((f) => {
      if (f && String(f).trim().length > 0) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const handleCopyUhid = () => {
    navigator.clipboard?.writeText(uhid);
    setCopiedUhid(true);
    setTimeout(() => setCopiedUhid(false), 2000);
  };

  const handlePrintIdCard = () => {
    window.print();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('caretrack_patient_profile', JSON.stringify(profile));

    const userStr = localStorage.getItem('user');
    let existingUser: any = {};
    if (userStr) {
      try { existingUser = JSON.parse(userStr); } catch {}
    }
    const updatedUser = {
      ...existingUser,
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      age: profile.age,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      location: profile.address,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('medisync:user-updated'));
    window.dispatchEvent(new Event('caretrack:user-updated'));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Quick allergy toggles
  const handleToggleAllergy = (allergy: string) => {
    if (profile.allergies.toLowerCase().includes(allergy.toLowerCase())) {
      setProfile({
        ...profile,
        allergies: profile.allergies.replace(new RegExp(allergy, 'gi'), '').replace(/,\s*,/g, ',').trim() || 'None reported'
      });
    } else {
      const current = profile.allergies === 'None reported' || profile.allergies === 'None' ? '' : profile.allergies;
      setProfile({
        ...profile,
        allergies: current ? `${current}, ${allergy}` : allergy
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 max-w-5xl mx-auto">
      {/* ── Printable Stylesheet for Medical ID Pass ─────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #digital-medical-id-card,
          #digital-medical-id-card * {
            visibility: visible !important;
          }
          #digital-medical-id-card {
            position: absolute !important;
            left: 20px !important;
            top: 20px !important;
            width: 100% !important;
            max-width: 500px !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground/80 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Verified Patient Identity & Demographics
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground">
            Patient Profile & Medical ID
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm max-w-xl leading-relaxed">
            Manage your verified hospital registration credentials, critical clinical alerts, and emergency contact network.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold animate-in fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully
          </div>
        )}
      </header>

      {/* ── Profile Completion Health Bar ───────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-card border-2 border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Health Profile Completion</span>
              <span className="text-xs font-extrabold text-brand bg-brand/10 px-2 py-0.5 rounded-md border border-brand/20">
                {completionScore}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Verified for electronic prescriptions, lab billing, and priority OPD queue check-in.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-secondary h-2.5 rounded-full overflow-hidden border border-border">
          <div 
            className="bg-brand h-full rounded-full transition-all duration-500"
            style={{ width: `${completionScore}%` }}
          />
        </div>
      </div>

      {/* ── Digital Medical ID Card (Apple Wallet / Hospital Pass Style) ──────── */}
      <div 
        id="digital-medical-id-card"
        className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-slate-800"
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Card Top: Logo & UHID Badge */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-heading font-extrabold text-white text-base">
                MS
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-white tracking-wide leading-none">
                  MediSync Health Card
                </h3>
                <span className="text-[10px] text-white/60 tracking-wider uppercase font-semibold">
                  National EHR Digital Pass
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUhid}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-mono text-white transition-colors cursor-pointer"
                title="Copy UHID"
              >
                {copiedUhid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{uhid}</span>
              </button>
              <button
                type="button"
                onClick={handlePrintIdCard}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer"
                title="Print Digital ID"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Center: Patient Demographics & Chip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-indigo-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-white/20 shrink-0">
                {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SU'}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
                    {profile.fullName}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <span>{profile.gender}</span>
                  <span>·</span>
                  <span>{profile.age} Years</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[11px]">
                    <Droplet className="w-3 h-3 text-rose-400" /> Blood: {profile.bloodGroup}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated QR Code for Clinic Scanner */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-2xl sm:self-center shrink-0">
              <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
              <div className="text-[10px] text-white/70 space-y-0.5 pr-1">
                <span className="font-bold block text-white">OPD Kiosk Pass</span>
                <span>Fast-track check-in</span>
              </div>
            </div>
          </div>

          {/* Card Bottom: ICE & Contact Quick Glance */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-brand" />
              <span className="font-mono">{profile.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>ICE: {profile.emergencyContactName} ({profile.emergencyContactPhone})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form: Demographic, Emergency & Clinical Safety Profile ───────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Contact & Identity Information */}
        <div className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              Personal & Contact Information
            </h3>
            <span className="text-[11px] text-muted-foreground font-medium">Official Hospital Records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-fullname"
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Age
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Primary Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Blood Group
              </label>
              <select
                id="profile-bloodgroup"
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Gender Identity
              </label>
              <select
                id="profile-gender"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
              >
                {['Female', 'Male', 'Non-Binary', 'Other'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Residential Address & City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-address"
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Emergency ICE Contact */}
        <div className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Emergency Contact Network (In Case of Emergency)
            </h3>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              Critical Medical Protocol
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Emergency Contact Name
              </label>
              <input
                id="profile-emergency-name"
                type="text"
                value={profile.emergencyContactName}
                onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Relationship
              </label>
              <input
                id="profile-emergency-relation"
                type="text"
                value={profile.emergencyContactRelation}
                onChange={(e) => setProfile({ ...profile, emergencyContactRelation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                Emergency Phone Number
              </label>
              <input
                id="profile-emergency-phone"
                type="tel"
                value={profile.emergencyContactPhone}
                onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3. Clinical Alerts & Known Allergies */}
        <div className="p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-card shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Critical Clinical Alerts & Known Allergies
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Prescription Safety Filter
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick Allergy Chips */}
            <div>
              <span className="block text-muted-foreground font-bold mb-2 uppercase text-[10px] tracking-wider">
                Quick Allergy Tags (Click to Toggle)
              </span>
              <div className="flex flex-wrap gap-2">
                {['Penicillin', 'Sulfa Drugs', 'Aspirin', 'Peanuts', 'Latex', 'No Known Allergies'].map((tag) => {
                  const isSelected = profile.allergies.toLowerCase().includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleAllergy(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold shadow-2xs'
                          : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                  Detailed Drug / Food Allergies
                </label>
                <input
                  id="profile-allergies"
                  type="text"
                  value={profile.allergies}
                  onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Shellfish, Dust"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                  Known Chronic Conditions
                </label>
                <input
                  id="profile-chronic"
                  type="text"
                  value={profile.chronicConditions}
                  onChange={(e) => setProfile({ ...profile, chronicConditions: e.target.value })}
                  placeholder="e.g. Hypertension, Asthma, None"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Save Profile Actions ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Changes sync automatically across MediSync hospital kiosks and EHR records.
          </p>

          <button
            id="btn-save-profile"
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}

