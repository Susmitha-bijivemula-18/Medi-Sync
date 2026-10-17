import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Award,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Search
} from 'lucide-react';
import { mockDoctors, getMergedDoctors, type ExtendedDoctor } from '../../lib/doctors';
import { doctorSignIn } from '../../lib/doctorAuth';
import { DoctorAvatar } from '../../components/common/DoctorAvatar';
import { MediSyncIcon, MediSyncLogoCompact } from '../../components/ui/Logo';

const specialitiesList = [
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Oncology'
];

export function DoctorLogin() {
  const navigate = useNavigate();
  
  // All doctors available in the system
  const [doctorsList, setDoctorsList] = useState<ExtendedDoctor[]>(mockDoctors);
  const [doctorSearch, setDoctorSearch] = useState('');

  // Fetch full list of doctors including backend database if reachable
  useEffect(() => {
    getMergedDoctors().then((docs) => {
      if (docs && docs.length > 0) {
        setDoctorsList(docs);
      }
    });
  }, []);

  // Filtered doctors for quick selection
  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.toLowerCase().trim();
    if (!q) return doctorsList;
    return doctorsList.filter((doc) =>
      (doc.full_name || '').toLowerCase().includes(q) ||
      (doc.specialization || '').toLowerCase().includes(q)
    );
  }, [doctorsList, doctorSearch]);

  // Doctor authentication credentials (all required)
  const [name, setName] = useState('Dr. Ananya Rao');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [email, setEmail] = useState('dr.ananya@medisync.com');
  const [password, setPassword] = useState('');
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>('6b69e7a2-bd9d-4c62-8fa4-10a49eb0f0f7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle selecting an existing specialist profile to pre-populate
  const handleSelectPreset = (doc: ExtendedDoctor) => {
    setSelectedPresetId(doc.id);
    setName(doc.full_name || '');
    setSpecialization(doc.specialization || '');
    const slug = (doc.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    setEmail(`${slug}@medisync.com`);
    setError('');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const clean = val.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
    const matched = doctorsList.find(
      (d) => (d.full_name || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase() === clean
    );
    if (matched) {
      setSelectedPresetId(matched.id);
      if (matched.specialization) setSpecialization(matched.specialization);
      const slug = (matched.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      setEmail(`${slug}@medisync.com`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Doctor name is required');
      return;
    }
    if (!specialization.trim()) {
      setError('Speciality is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid hospital email is required');
      return;
    }
    if (!password.trim()) {
      setError('Doctor portal password is required');
      return;
    }

    setLoading(true);

    try {
      await doctorSignIn({
        name: name.trim(),
        specialization: specialization.trim(),
        email: email.trim(),
        password: password.trim(),
        doctorId: selectedPresetId,
      });
      navigate('/doctor/dashboard');
    } catch {
      setError('Unable to authenticate physician credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground font-sans">
      
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-border bg-card/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MediSyncLogoCompact size="sm" />
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
            Doctor Portal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Patient Website</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground pl-3 border-l border-border">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Physician Access</span>
          </div>
        </div>
      </header>

      {/* Main Form Center */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-card p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mx-auto mb-3">
              <MediSyncIcon size={44} />
            </div>
            <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
              Doctor Portal Access
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enter physician name, speciality, hospital email, and password to unlock clinical workspace
            </p>
          </div>

          {/* Quick Select Physician Profile */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                Select Physician Profile ({doctorsList.length} Doctors):
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Autofills name & speciality</span>
            </div>

            {/* Quick search input */}
            {doctorsList.length > 4 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Search doctor by name or specialty..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredDoctors.map((doc) => {
                const isSelected = selectedPresetId === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleSelectPreset(doc)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                      isSelected
                        ? 'border-brand bg-brand/5 ring-1.5 ring-brand shadow-xs'
                        : 'border-border/80 hover:border-brand/40 hover:bg-secondary/40'
                    }`}
                  >
                    <DoctorAvatar
                      src={doc.avatar}
                      name={doc.full_name}
                      className="w-9 h-9 shadow-2xs"
                    />
                    <div className="w-full min-w-0">
                      <h4 className="text-[11px] font-bold text-foreground truncate" title={doc.full_name}>
                        {doc.full_name}
                      </h4>
                      <p className="text-[10px] text-brand font-medium truncate">
                        {doc.specialization}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredDoctors.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No matching doctors found for "{doctorSearch}". You can enter custom credentials directly below.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Physician Credential Form (All 4 required) */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* 1. Doctor Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Doctor Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Dr. Ananya Rao"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* 2. Doctor Speciality */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Medical Speciality <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  list="specialities-datalist"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Cardiology, Dermatology, Orthopedics"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <datalist id="specialities-datalist">
                  {specialitiesList.map((spec) => (
                    <option key={spec} value={spec} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* 3. Hospital Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Hospital Email / Medical ID <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.ananya@medisync.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Portal Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your physician password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Demo doctor passkey: any secure password (e.g. doctor123)</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-foreground text-background hover:bg-brand hover:text-brand-foreground text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-3"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Open Doctor Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Patient login link */}
          <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
            Looking for patient records or booking?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Patient Login →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="py-4 px-6 border-t border-border/60 text-center text-[11px] text-muted-foreground">
        MediSync Hospital Management System · Protected Health Information (PHI) Secure Zone
      </footer>
    </div>
  );
}
