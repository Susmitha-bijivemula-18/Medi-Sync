import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';
import { mockDoctors } from '../../lib/doctors';
import { doctorSignIn } from '../../lib/doctorAuth';

export function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(mockDoctors[0].id);
  const [isQuickSelect, setIsQuickSelect] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isQuickSelect) {
        await doctorSignIn({ doctorId: selectedDoctorId });
      } else {
        if (!email.trim()) {
          setError('Please enter your doctor email or medical ID');
          setLoading(false);
          return;
        }
        await doctorSignIn({ email, password });
      }
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
        <Link to="/" className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Website</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure Clinical Portal</span>
        </div>
      </header>

      {/* Main Form Center */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card border border-border rounded-xl shadow-card p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
              Doctor Portal Login
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Access clinical consultations, live patient queue, and schedule management
            </p>
          </div>

          {/* Quick Select / Direct Login Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-secondary/80 p-1 rounded-lg text-xs font-semibold mb-6">
            <button
              type="button"
              onClick={() => setIsQuickSelect(true)}
              className={`py-2 rounded-md transition-colors cursor-pointer ${
                isQuickSelect 
                  ? 'bg-foreground text-background shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Verified Specialists
            </button>
            <button
              type="button"
              onClick={() => setIsQuickSelect(false)}
              className={`py-2 rounded-md transition-colors cursor-pointer ${
                !isQuickSelect 
                  ? 'bg-foreground text-background shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Staff Credentials
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {isQuickSelect ? (
              /* Verified Specialist Quick Select */
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  Select Physician Account:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {mockDoctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-brand bg-brand/5 ring-1 ring-brand'
                            : 'border-border/80 hover:border-border hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={doc.avatar}
                            alt={doc.full_name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground truncate">{doc.full_name}</h3>
                            <p className="text-[11px] text-brand font-medium truncate">
                              {doc.specialization} · {doc.experience_years} yrs
                            </p>
                          </div>
                        </div>
                        {isSelected && <UserCheck className="w-4 h-4 text-brand shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Email & Password Form */
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Hospital Email / Medical ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dr.ananya@caretrack.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-foreground text-background hover:bg-brand hover:text-brand-foreground text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Doctor Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Patient login link */}
          <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
            Looking for patient records or booking?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Patient Login →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="py-4 px-6 border-t border-border/60 text-center text-[11px] text-muted-foreground">
        CareTrack Hospital Management System · Protected Health Information (PHI) Secure Zone
      </footer>
    </div>
  );
}
