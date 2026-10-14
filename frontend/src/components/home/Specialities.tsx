import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Sparkles, 
  Stethoscope, 
  Activity, 
  Baby, 
  Brain, 
  Flower2, 
  Ear,
  Search, 
  ArrowRight, 
  Clock, 
  X, 
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { specialtiesDirectory, editorialI18n, type Language, type SpecialtyDirectoryItem } from './specialtiesData';
import { getMergedDoctors, type ExtendedDoctor } from '../../lib/doctors';

export function Specialities() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorSectionRef = useRef<HTMLDivElement>(null);

  // Language state (English default, Telugu supported)
  const [lang, setLang] = useState<Language>('en');
  const t = editorialI18n[lang];

  // Doctors data state
  const [doctors, setDoctors] = useState<ExtendedDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Search & Active Department Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSpecialtyKey, setManualSpecialtyKey] = useState<string | null>(null);

  // Doctor Profile Modal State
  const [activeProfileDoctor, setActiveProfileDoctor] = useState<ExtendedDoctor | null>(null);

  // Fetch unified doctors on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingDoctors(true);
      const data = await getMergedDoctors();
      if (isMounted) {
        setDoctors(data);
        setLoadingDoctors(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive active specialty from searchParams URL, falling back to manual selection
  const urlDept = searchParams.get('specialty') || searchParams.get('dept');
  const matchedUrlDept = urlDept
    ? specialtiesDirectory.find(
        (s) => s.key.toLowerCase() === urlDept.toLowerCase() || s.name.toLowerCase() === urlDept.toLowerCase()
      )?.key ?? null
    : null;

  const selectedSpecialtyKey = matchedUrlDept ?? manualSpecialtyKey;

  // Handle specialty selection
  const handleSelectSpecialty = (key: string) => {
    if (selectedSpecialtyKey === key) {
      // Toggle off if clicked again
      setManualSpecialtyKey(null);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('specialty');
      newParams.delete('dept');
      setSearchParams(newParams, { replace: true });
    } else {
      setManualSpecialtyKey(key);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('specialty', key);
      setSearchParams(newParams, { replace: true });

      // Smoothly scroll to doctor section
      setTimeout(() => {
        doctorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const clearSelection = () => {
    setManualSpecialtyKey(null);
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('specialty');
    newParams.delete('dept');
    setSearchParams(newParams, { replace: true });
  };

  // Icon selector helper
  const renderSpecialtyIcon = (iconName: SpecialtyDirectoryItem['iconName']) => {
    const iconClass = "w-5 h-5 transition-colors duration-300";
    switch (iconName) {
      case 'heart':
        return <Heart className={iconClass} strokeWidth={1.75} />;
      case 'sparkles':
        return <Sparkles className={iconClass} strokeWidth={1.75} />;
      case 'stethoscope':
        return <Stethoscope className={iconClass} strokeWidth={1.75} />;
      case 'activity':
        return <Activity className={iconClass} strokeWidth={1.75} />;
      case 'baby':
        return <Baby className={iconClass} strokeWidth={1.75} />;
      case 'brain':
        return <Brain className={iconClass} strokeWidth={1.75} />;
      case 'flower':
        return <Flower2 className={iconClass} strokeWidth={1.75} />;
      case 'ear':
        return <Ear className={iconClass} strokeWidth={1.75} />;
      default:
        return <Stethoscope className={iconClass} strokeWidth={1.75} />;
    }
  };

  // Filtered Specialties based on search query
  const filteredSpecialties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return specialtiesDirectory;

    return specialtiesDirectory.filter((spec) => {
      const matchesSpec = 
        spec.name.toLowerCase().includes(q) ||
        spec.nameTe.toLowerCase().includes(q) ||
        spec.description.toLowerCase().includes(q) ||
        spec.descriptionTe.toLowerCase().includes(q);

      // Also match if a doctor in this specialty matches search query
      const matchesDoctor = doctors.some(
        (doc) =>
          doc.specialization?.toLowerCase() === spec.key.toLowerCase() &&
          (doc.full_name || '').toLowerCase().includes(q)
      );

      return matchesSpec || matchesDoctor;
    });
  }, [searchQuery, doctors]);

  // Doctors to display in the discovery panel
  const displayedDoctors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return doctors.filter((doc) => {
      // If a specialty is explicitly selected, only show doctors for that specialty
      if (selectedSpecialtyKey) {
        if ((doc.specialization || '').toLowerCase() !== selectedSpecialtyKey.toLowerCase()) {
          return false;
        }
      }

      // If search query is present
      if (q) {
        const matchesName = (doc.full_name || '').toLowerCase().includes(q);
        const matchesSpec = (doc.specialization || '').toLowerCase().includes(q);
        return matchesName || matchesSpec;
      }

      // Otherwise if selectedSpecialtyKey is active, show matching doctors
      return selectedSpecialtyKey !== null;
    });
  }, [doctors, selectedSpecialtyKey, searchQuery]);

  // Selected specialty details
  const activeSpecialtyDetails = useMemo(() => {
    if (!selectedSpecialtyKey) return null;
    return specialtiesDirectory.find((s) => s.key === selectedSpecialtyKey) || null;
  }, [selectedSpecialtyKey]);

  return (
    <section 
      id="specialities" 
      aria-label="CareTrack Medical Specialities"
      className="relative py-16 md:py-20 px-6 sm:px-8 md:px-12 lg:px-20 bg-background text-foreground border-y border-border transition-colors duration-300"
    >
      <div className="w-full max-w-[80rem] mx-auto">
        
        {/* ── 1. HEADER (Compact, Minimalist, Hospital Website Aesthetic) ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border/70">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="text-[11px] font-semibold tracking-widest text-brand uppercase mb-2">
              {t.eyebrow}
            </p>
            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold tracking-tight text-foreground leading-tight">
              {t.heading}
            </h2>
            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-normal leading-relaxed">
              {t.subheading}
            </p>
          </div>

          {/* Minimalist Language Selector */}
          <div className="flex items-center self-start sm:self-end text-xs font-medium border border-border rounded-lg p-1 bg-card/60">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                lang === 'en' 
                  ? "bg-foreground text-background font-semibold shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              English
            </button>
            <span className="text-border px-1">|</span>
            <button
              type="button"
              onClick={() => setLang('te')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                lang === 'te' 
                  ? "bg-foreground text-background font-semibold shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              తెలుగు
            </button>
          </div>
        </div>

        {/* ── 2. SEARCH AND FILTER BAR ── */}
        <div className="pt-8 pb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Clean Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-9 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                title={t.clearSearch}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
            <button
              type="button"
              onClick={clearSelection}
              className={cn(
                "px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer border",
                selectedSpecialtyKey === null && !searchQuery
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-border/80"
              )}
            >
              {t.allDepartments}
            </button>

            {specialtiesDirectory.map((spec) => {
              const isSelected = selectedSpecialtyKey === spec.key;
              return (
                <button
                  key={spec.key}
                  type="button"
                  onClick={() => handleSelectSpecialty(spec.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer border",
                    isSelected
                      ? "bg-brand text-brand-foreground border-brand font-semibold"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-border/80"
                  )}
                >
                  {lang === 'te' ? spec.nameTe.split(' ')[0] : spec.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. SPECIALITY DIRECTORY (Editorial Style, Refined Grid) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {filteredSpecialties.map((spec) => {
            const isSelected = selectedSpecialtyKey === spec.key;
            const displayName = lang === 'te' ? spec.nameTe : spec.name;
            const displayDesc = lang === 'te' ? spec.descriptionTe : spec.description;

            return (
              <div
                key={spec.key}
                onClick={() => handleSelectSpecialty(spec.key)}
                className={cn(
                  "group relative p-5 rounded-lg border bg-card transition-all duration-200 cursor-pointer flex flex-col justify-between",
                  isSelected
                    ? "border-brand ring-1 ring-brand bg-brand/[0.02]"
                    : "border-border/80 hover:border-border hover:shadow-subtle hover:bg-card/90"
                )}
              >
                <div>
                  {/* Icon & Department Name */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={cn(
                      "p-2 rounded-md transition-colors",
                      isSelected 
                        ? "bg-brand/10 text-brand" 
                        : "bg-secondary text-muted-foreground group-hover:text-foreground group-hover:bg-secondary/80"
                    )}>
                      {renderSpecialtyIcon(spec.iconName)}
                    </div>
                    <h3 className="text-base font-heading font-semibold text-foreground tracking-tight">
                      {displayName}
                    </h3>
                  </div>

                  {/* One short plain-English description */}
                  <p className="text-xs text-muted-foreground leading-relaxed pl-0.5 min-h-[32px]">
                    {displayDesc}
                  </p>
                </div>

                {/* Subtle "View Doctors →" link */}
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 transition-colors",
                    isSelected 
                      ? "text-brand" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {isSelected ? t.hideDoctors : t.viewDoctors}
                    <ArrowRight className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isSelected ? "rotate-90 text-brand" : "group-hover:translate-x-0.5"
                    )} />
                  </span>

                  {/* Small count pill */}
                  <span className="text-[11px] font-mono text-muted-foreground/60">
                    {doctors.filter((d) => d.specialization.toLowerCase() === spec.key.toLowerCase()).length} MD
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. EMPTY SEARCH STATE ── */}
        {filteredSpecialties.length === 0 && (
          <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card/40 my-6">
            <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <h4 className="text-base font-medium text-foreground mb-1">
              {t.noResultsTitle}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              {t.noResultsDesc}
            </p>
            <button
              type="button"
              onClick={clearSelection}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-border bg-card hover:bg-secondary text-foreground cursor-pointer"
            >
              {t.clearSearch}
            </button>
          </div>
        )}

        {/* ── 5. DOCTOR DISCOVERY SECTION ── */}
        <div ref={doctorSectionRef}>
          <AnimatePresence>
            {(selectedSpecialtyKey !== null || (searchQuery.trim().length > 0 && displayedDoctors.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-10 pt-8 border-t border-border"
              >
                {/* Doctor Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand" />
                      <span className="text-xs font-semibold tracking-wider text-brand uppercase">
                        {t.availablePhysicians}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-heading font-semibold text-foreground tracking-tight mt-1">
                      {activeSpecialtyDetails 
                        ? `${t.specialistsIn} ${lang === 'te' ? activeSpecialtyDetails.nameTe : activeSpecialtyDetails.name}` 
                        : (searchQuery ? `Matching Doctors for "${searchQuery}"` : t.availablePhysicians)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {displayedDoctors.length} {displayedDoctors.length === 1 ? 'physician' : 'physicians'} available
                    </span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-secondary"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t.close}</span>
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loadingDoctors ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-5 rounded-lg border border-border bg-card animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-secondary" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-secondary rounded w-3/4" />
                            <div className="h-3 bg-secondary rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedDoctors.length === 0 ? (
                  <div className="p-8 text-center bg-card rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">
                      No doctors currently listed for this department.
                    </p>
                  </div>
                ) : (
                  /* Doctor Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-5 rounded-lg border border-border/80 bg-card hover:border-brand/40 hover:shadow-subtle transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {/* Doctor Header: Genuine Portrait, Name, Specialty */}
                          <div className="flex items-start gap-4 mb-4">
                            <img
                              src={doc.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80'}
                              alt={doc.full_name}
                              className="w-14 h-14 rounded-full object-cover border border-border/60 shrink-0 bg-secondary"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-heading font-semibold text-foreground tracking-tight truncate">
                                {doc.full_name}
                              </h4>
                              <p className="text-xs text-brand font-medium truncate mt-0.5">
                                {doc.specialization} · {doc.qualification}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {doc.experience_years} years {t.experience}
                              </p>
                            </div>
                          </div>

                          {/* Next Appointment Slot & Fee */}
                          <div className="py-2.5 px-3 rounded-md bg-secondary/50 border border-border/40 text-xs mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span className="truncate">{doc.nextSlot || 'Today · Available'}</span>
                            </div>
                            <span className="font-semibold text-foreground shrink-0">
                              ₹{doc.consultation_fee}
                            </span>
                          </div>
                        </div>

                        {/* Actions: View Profile & Book Appointment */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                          <button
                            type="button"
                            onClick={() => setActiveProfileDoctor(doc)}
                            className="px-3 py-2 rounded-md border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors text-center cursor-pointer"
                          >
                            {t.viewProfile}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/book-appointment/${doc.id}`)}
                            className="px-3 py-2 rounded-md bg-foreground text-background hover:bg-brand hover:text-brand-foreground text-xs font-semibold transition-colors text-center cursor-pointer shadow-xs"
                          >
                            {t.bookAppointment}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 6. COMPACT GENERAL MEDICINE GUIDANCE NOTE ── */}
        <div className="mt-12 p-4 rounded-lg bg-card border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Stethoscope className="w-4 h-4 text-brand shrink-0" />
            <span>{t.generalConsultNote}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectSpecialty('General Medicine')}
            className="text-xs font-semibold text-brand hover:underline shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>{t.bookGeneralDoc}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* ── 7. DOCTOR PROFILE MODAL ── */}
      <AnimatePresence>
        {activeProfileDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg bg-card text-foreground border border-border rounded-xl shadow-floating p-6 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveProfileDoctor(null)}
                className="absolute right-4 top-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title={t.close}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Doctor Details */}
              <div className="flex items-start gap-4 mb-5">
                <img
                  src={activeProfileDoctor.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80'}
                  alt={activeProfileDoctor.full_name}
                  className="w-16 h-16 rounded-full object-cover border border-border bg-secondary"
                />
                <div className="min-w-0 pr-6">
                  <h3 className="text-lg font-heading font-bold text-foreground">
                    {activeProfileDoctor.full_name}
                  </h3>
                  <p className="text-xs font-semibold text-brand mt-0.5">
                    {activeProfileDoctor.specialization}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeProfileDoctor.qualification} · {activeProfileDoctor.experience_years} years {t.experience}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {activeProfileDoctor.bio && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {t.aboutDoctor}
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/40">
                    {activeProfileDoctor.bio}
                  </p>
                </div>
              )}

              {/* Credentials & Availability Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                    {t.consultingDays}
                  </span>
                  <span className="font-semibold text-foreground">
                    {activeProfileDoctor.available_days?.join(', ') || 'Mon - Fri'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                    {t.consultingHours}
                  </span>
                  <span className="font-semibold text-foreground">
                    {activeProfileDoctor.available_from} - {activeProfileDoctor.available_to}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                    {t.nextAvailable}
                  </span>
                  <span className="font-semibold text-brand">
                    {activeProfileDoctor.nextSlot || 'Available Today'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                    {t.consultationFee}
                  </span>
                  <span className="font-semibold text-foreground">
                    ₹{activeProfileDoctor.consultation_fee}
                  </span>
                </div>
              </div>

              {/* Modal CTA Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProfileDoctor(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  {t.close}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = activeProfileDoctor.id;
                    setActiveProfileDoctor(null);
                    navigate(`/book-appointment/${id}`);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-brand hover:text-brand-foreground text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {t.proceedBooking}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}