import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, Stethoscope, Star, ArrowRight, Calendar, Clock } from 'lucide-react';
import { mockDoctors, getMergedDoctors, type ExtendedDoctor } from '../lib/doctors';
import { DoctorAvatar } from '../components/common/DoctorAvatar';

const specializations = [
  'All', 
  'Cardiology', 
  'Dermatology', 
  'General Medicine', 
  'Orthopedics', 
  'Pediatrics', 
  'Neurology', 
  'Gynecology', 
  'ENT'
];

export function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSpecialty = searchParams.get('specialty');
  
  const [doctors, setDoctors] = useState<ExtendedDoctor[]>(mockDoctors);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Directly derive active filter from searchParams URL
  const activeFilter = (requestedSpecialty && specializations.find(s => s.toLowerCase() === requestedSpecialty.toLowerCase())) || 'All';

  const handleFilterSelect = (spec: string) => {
    if (spec === 'All') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('specialty');
      setSearchParams(newParams);
    } else {
      setSearchParams({ specialty: spec });
    }
  };

  async function loadDoctors() {
    const mergedData = await getMergedDoctors();
    setDoctors(mergedData);
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = (doc.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || doc.specialization === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[85rem] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
                Book an Appointment
              </h1>
              <p className="text-[12px] font-semibold tracking-widest uppercase text-muted-foreground mt-2">
                Choose a specialist to get started
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[85rem] mx-auto px-6 py-8">
        {/* ── Search bar ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
            <Search className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[15px] font-medium placeholder:text-muted-foreground text-foreground"
            />
            <div className="flex items-center gap-2 pl-3 border-l border-border hidden sm:flex">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-muted-foreground whitespace-nowrap">
                {filteredDoctors.length} found
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Specialization filter chips ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2.5 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0"
        >
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => handleFilterSelect(spec)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 border ${
                activeFilter === spec
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'bg-secondary text-foreground border-transparent hover:border-border hover:bg-secondary/80'
              }`}
            >
              {spec}
            </button>
          ))}
        </motion.div>

        {/* ── Doctors Grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl p-6 border border-border bg-card shadow-sm animate-pulse">
                <div className="w-full h-24 bg-secondary rounded-lg mb-4" />
                <div className="w-3/4 h-5 bg-secondary rounded mb-2" />
                <div className="w-1/2 h-4 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-card rounded-2xl border border-border/50"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-secondary text-muted-foreground">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">No doctors found</h3>
            <p className="text-[15px] text-muted-foreground max-w-sm mx-auto">
              We couldn't find any doctors matching your search. Try clearing your filters.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); handleFilterSelect('All'); }}
              className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDoctors.map((doctor, i) => (
                <motion.div
                  key={doctor.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group flex flex-col rounded-2xl p-6 border border-border bg-card hover:border-brand/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300"
                >
                    {/* Header: Photo + Name + Spec */}
                    <div className="flex items-start gap-5 mb-5">
                      <DoctorAvatar
                        src={doctor.avatar}
                        name={doctor.full_name}
                        className="w-[72px] h-[72px] border-2 border-border/50"
                        imgClassName="transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-heading font-semibold tracking-tight text-foreground truncate group-hover:text-brand transition-colors">
                          {doctor.full_name}
                        </h3>
                        <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5">
                          {doctor.specialization}
                        </div>
                        <div className="text-[13px] text-foreground/60 mt-1.5">
                          {doctor.experience_years} years experience
                        </div>
                      </div>
                    </div>

                    {/* Availability Card */}
                    <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-brand/5 border border-brand/10 mb-5">
                       <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-brand" />
                         <span className="text-[13px] font-semibold text-brand">{doctor.availableStatus}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4 text-muted-foreground" />
                         <span className="text-[13px] text-foreground/70">Next available: <span className="font-semibold text-foreground">{doctor.nextSlot}</span></span>
                       </div>
                    </div>

                    {/* Footer: Fee, Rating */}
                    <div className="flex items-center justify-between mb-6 pt-2 border-t border-border/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consultation</span>
                        <span className="text-xl font-heading font-semibold text-foreground">₹{doctor.consultation_fee}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Rating</span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                          <span className="text-[15px] font-semibold text-foreground">
                            {doctor.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <Link 
                        to={`/book-appointment/${doctor.id}`} 
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold text-foreground border border-border hover:bg-secondary transition-colors"
                      >
                        View Profile
                      </Link>
                      <Link 
                        to={`/book-appointment/${doctor.id}`} 
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold bg-brand text-white hover:bg-brand/90 transition-colors shadow-sm"
                      >
                        Book
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
