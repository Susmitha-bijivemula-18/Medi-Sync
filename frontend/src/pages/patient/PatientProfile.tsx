import { useState } from 'react';
import { 
  User, 
  Heart, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

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

import { loadAllAppointments } from '../../lib/queueStore';

export function PatientProfile() {
  const [profile, setProfile] = useState<PatientProfileData>(() => {
    const saved = localStorage.getItem('caretrack_patient_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }

    // Try reading active logged in patient or latest appointment
    const userStr = localStorage.getItem('user');
    let u: any = {};
    if (userStr) {
      try { u = JSON.parse(userStr); } catch {}
    }

    const all = loadAllAppointments();
    const latest = all[all.length - 1];

    return {
      fullName: u.name || latest?.patientName || 'Patient',
      age: Number(u.age || latest?.patientAge || 28),
      gender: u.gender || 'Not Specified',
      phone: u.phone || latest?.patientPhone || '+91 ',
      email: u.email || latest?.patientEmail || '',
      bloodGroup: u.bloodGroup || latest?.bloodGroup || 'O+',
      address: u.location || latest?.location || 'Hyderabad, Telangana',
      emergencyContactName: u.emergencyContactName || '',
      emergencyContactRelation: u.emergencyContactRelation || 'Family',
      emergencyContactPhone: u.emergencyContactPhone || '',
      allergies: u.allergies || 'None reported',
      chronicConditions: u.chronicConditions || 'None',
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('caretrack_patient_profile', JSON.stringify(profile));

    // Also sync to active user session
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
    window.dispatchEvent(new Event('caretrack:user-updated'));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Personal Demographics</span>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
            Patient Profile & Medical ID
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your verified hospital registration details, emergency contacts, and allergy alerts.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully
          </div>
        )}
      </header>

      {/* Main Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand to-brand/70 text-white font-bold text-2xl flex items-center justify-center shadow-md">
          {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-foreground">{profile.fullName}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Patient
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {profile.gender} · {profile.age} years · Blood Group: <strong className="text-brand font-bold">{profile.bloodGroup}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            UHID: <span className="font-mono text-foreground font-semibold">CT-2026-8890</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            Contact & Identity Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Full Legal Name</label>
              <input
                id="profile-fullname"
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Age</label>
              <input
                id="profile-age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Phone Number</label>
              <input
                id="profile-phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Blood Group</label>
              <select
                id="profile-bloodgroup"
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Gender</label>
              <select
                id="profile-gender"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              >
                {['Male', 'Female', 'Non-Binary', 'Other'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Residential Address</label>
              <input
                id="profile-address"
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Emergency Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Contact Name</label>
              <input
                id="profile-emergency-name"
                type="text"
                value={profile.emergencyContactName}
                onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Relationship</label>
              <input
                id="profile-emergency-relation"
                type="text"
                value={profile.emergencyContactRelation}
                onChange={(e) => setProfile({ ...profile, emergencyContactRelation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Emergency Phone</label>
              <input
                id="profile-emergency-phone"
                type="tel"
                value={profile.emergencyContactPhone}
                onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Medical Alerts & Allergies */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Critical Clinical Alerts & Allergies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Known Allergies (Drugs, Foods)</label>
              <input
                id="profile-allergies"
                type="text"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-semibold mb-1.5 uppercase text-[10px]">Chronic Conditions</label>
              <input
                id="profile-chronic"
                type="text"
                value={profile.chronicConditions}
                onChange={(e) => setProfile({ ...profile, chronicConditions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-brand/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            id="btn-save-profile"
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-brand/90 transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
