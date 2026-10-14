import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Stethoscope, Star, Calendar, Clock, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { getMergedDoctors, type ExtendedDoctor } from '../../lib/doctors';

const specialties = [
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

export function PatientDoctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<ExtendedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const data = await getMergedDoctors();
        setDoctors(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = 
      (doc.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.qualification || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">Care Specialists</span>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground mt-1">
            Find Doctors & Specialists
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Book priority OPD appointments with verified senior consultants and medical specialists.
          </p>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="doctor-search-input"
            type="text"
            placeholder="Search by doctor name, specialty, or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-xs"
          />
        </div>

        {/* Specialty Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedSpecialty === spec
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border p-8 bg-card/50">
          <Stethoscope className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No doctors match your criteria</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Try adjusting your search terms or clearing specialty filters to discover our medical staff.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSpecialty('All');
            }}
            className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-brand/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand/10 to-brand/20 border border-brand/20 flex items-center justify-center text-brand font-bold text-lg overflow-hidden shrink-0">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.full_name} className="w-full h-full object-cover" />
                      ) : (
                        doc.full_name?.replace('Dr. ', '').charAt(0) || 'D'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-base text-foreground group-hover:text-brand transition-colors">
                          {doc.full_name}
                        </h3>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-xs font-medium text-brand">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{doc.rating || 4.9}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{doc.qualification || 'MBBS, MD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>
                      {doc.available_days && doc.available_days.length > 0
                        ? doc.available_days.slice(0, 3).join(', ') + (doc.available_days.length > 3 ? '...' : '')
                        : 'Mon, Tue, Wed, Fri'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{doc.available_from || '09:00 AM'} - {doc.available_to || '05:00 PM'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Consultation Fee</span>
                  <div className="text-sm font-bold text-foreground">
                    ₹{doc.consultation_fee || 700}
                  </div>
                </div>
                <button
                  id={`book-doctor-${doc.id}`}
                  onClick={() => navigate(`/book-appointment/${doc.id}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all group-hover:translate-x-0.5"
                >
                  Book Visit
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
