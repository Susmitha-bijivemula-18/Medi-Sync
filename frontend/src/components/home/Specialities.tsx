import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, 
  Sparkles, 
  Stethoscope, 
  Bone, 
  Baby, 
  Brain, 
  Flower2, 
  Ear,
  Search, 
  ArrowRight, 
  Clock, 
  X, 
  ChevronRight,
  Activity
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

  // Icon selector helper with refined medical illustrations
  const renderSpecialtyIcon = (iconName: SpecialtyDirectoryItem['iconName'], isSelected: boolean = false) => {
    const iconClass = cn(
      "w-7 h-7 transition-all duration-300 ease-out",
      isSelected 
        ? "text-white" 
        : "text-[#1677F2] dark:text-[#22B8E6] group-hover:scale-110 group-hover:text-[#0E56B3] dark:group-hover:text-[#38BDF8]"
    );
    switch (iconName) {
      case 'heart':
        return <HeartPulse className={iconClass} strokeWidth={1.8} />;
      case 'sparkles':
        return <Sparkles className={iconClass} strokeWidth={1.8} />;
      case 'stethoscope':
        return <Stethoscope className={iconClass} strokeWidth={1.8} />;
      case 'activity':
        return <Bone className={iconClass} strokeWidth={1.8} />;
      case 'baby':
        return <Baby className={iconClass} strokeWidth={1.8} />;
      case 'brain':
        return <Brain className={iconClass} strokeWidth={1.8} />;
      case 'flower':
        return <Flower2 className={iconClass} strokeWidth={1.8} />;
      case 'ear':
        return <Ear className={iconClass} strokeWidth={1.8} />;
      default:
        return <Stethoscope className={iconClass} strokeWidth={1.8} />;
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
        spec.shortNameTe.toLowerCase().includes(q) ||
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
      aria-label="MediSync Medical Specialities"
      className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 lg:px-16 bg-[#F7FAFD] dark:bg-background text-foreground transition-colors duration-300 overflow-hidden"
    >
      {/* Subtle background glow accents behind header */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#22B8E6]/8 dark:bg-[#22B8E6]/4 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-12 left-10 w-80 h-80 bg-[#1677F2]/8 dark:bg-[#1677F2]/4 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[80rem] mx-auto">
        
        {/* ── 1. HEADER (Strong Typography, Medical Motif, Hospital-Grade Polish) ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-[#E2E8F0] dark:border-border/80">
          <div className="max-w-2xl">
            {/* Category Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF5FF] dark:bg-[#102747]/60 border border-[#BAE6FD]/80 dark:border-[#1677F2]/30 text-xs font-bold text-[#1677F2] dark:text-[#22B8E6] mb-3 shadow-xs">
              <Activity className="w-3.5 h-3.5 text-[#1677F2] dark:text-[#22B8E6] animate-pulse" />
              <span className="tracking-wider uppercase">{t.eyebrow}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-heading font-extrabold text-[#102747] dark:text-foreground tracking-tight leading-[1.2]">
              {t.heading}
            </h1>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base lg:text-lg text-[#475569] dark:text-muted-foreground mt-2.5 font-normal leading-relaxed">
              {t.subheading}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-start md:self-end">
            {/* Hospital-Grade Verification Motif */}
            <div className="hidden sm:flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-card border border-[#E2E8F0] dark:border-border shadow-[0_4px_16px_-4px_rgba(16,39,71,0.06)] shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1677F2] to-[#22B8E6] flex items-center justify-center text-white shadow-xs shrink-0">
                <HeartPulse className="w-4.5 h-4.5" />
              </div>
              <div className="text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#102747] dark:text-foreground">
                    {specialtiesDirectory.length} Clinical Specialties
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-muted-foreground mt-0.5">
                  {doctors.length > 0 ? `${doctors.length} Verified Specialists` : 'Live queue sync'}
                </p>
              </div>
            </div>

            {/* Language Selector */}
            <div 
              className="inline-flex items-center text-xs font-medium border border-[#CBD5E1] dark:border-border rounded-xl p-1 bg-white dark:bg-card shadow-xs"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer select-none font-semibold",
                  lang === 'en' 
                    ? "bg-[#102747] text-white shadow-xs" 
                    : "text-[#64748B] hover:text-[#102747] dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                English
              </button>
              <span className="text-slate-200 dark:text-border px-1 select-none">|</span>
              <button
                type="button"
                onClick={() => setLang('te')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer select-none font-semibold",
                  lang === 'te' 
                    ? "bg-[#102747] text-white shadow-xs" 
                    : "text-[#64748B] hover:text-[#102747] dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                తెలుగు
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. SEARCH AND FILTER SECTION (Responsive Search & Accessible Pills) ── */}
        <div className="pt-6 sm:pt-8 pb-6 sm:pb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-[#1677F2] dark:text-[#22B8E6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white dark:bg-card border border-[#CBD5E1] dark:border-border rounded-xl text-sm text-[#102747] dark:text-foreground placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1677F2]/25 focus:border-[#1677F2] shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#102747] dark:hover:text-foreground p-1 rounded-full cursor-pointer transition-colors"
                  title={t.clearSearch}
                  aria-label={t.clearSearch}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Status Indicator */}
            {(selectedSpecialtyKey || searchQuery) && (
              <div className="flex items-center gap-2 text-xs font-semibold self-start sm:self-center">
                <span className="text-[#64748B] dark:text-muted-foreground">
                  {filteredSpecialties.length} {filteredSpecialties.length === 1 ? 'specialty' : 'specialties'}
                </span>
                <span className="text-slate-300 dark:text-border">·</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[#1677F2] dark:text-[#22B8E6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>{t.clearSearch}</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Pills: Smooth horizontal scrolling on small/medium screens, wrapping layout on desktop */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 overflow-x-auto lg:flex-wrap pb-2 pt-1 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Department filters"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedSpecialtyKey === null && !searchQuery}
                onClick={clearSelection}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer border shadow-xs select-none",
                  selectedSpecialtyKey === null && !searchQuery
                    ? "bg-[#102747] text-white border-[#102747] shadow-sm ring-2 ring-[#102747]/20"
                    : "bg-white dark:bg-card text-[#475569] dark:text-muted-foreground border-[#E2E8F0] dark:border-border hover:border-[#1677F2]/45 hover:text-[#102747] dark:hover:text-foreground hover:bg-[#F8FAFD] dark:hover:bg-secondary/40"
                )}
              >
                {t.allDepartments}
              </button>

              {specialtiesDirectory.map((spec) => {
                const isSelected = selectedSpecialtyKey === spec.key;
                const label = lang === 'te' ? spec.shortNameTe : spec.name;
                return (
                  <button
                    key={spec.key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSpecialty(spec.key)}
                    className={cn(
                      "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer border shadow-xs select-none",
                      isSelected
                        ? "bg-[#102747] text-white border-[#102747] shadow-sm ring-2 ring-[#102747]/20"
                        : "bg-white dark:bg-card text-[#475569] dark:text-muted-foreground border-[#E2E8F0] dark:border-border hover:border-[#1677F2]/45 hover:text-[#102747] dark:hover:text-foreground hover:bg-[#F8FAFD] dark:hover:bg-secondary/40"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 3. REFINED SPECIALTY CARDS GRID (3-Column Desktop, 2-Column Tablet, 1-Column Mobile) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {filteredSpecialties.map((spec) => {
            const isSelected = selectedSpecialtyKey === spec.key;
            const displayName = lang === 'te' ? spec.nameTe : spec.name;
            const displayDesc = lang === 'te' ? spec.descriptionTe : spec.description;
            const count = doctors.filter((d) => (d.specialization || '').toLowerCase() === spec.key.toLowerCase()).length;

            return (
              <div
                key={spec.key}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => handleSelectSpecialty(spec.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectSpecialty(spec.key);
                  }
                }}
                className={cn(
                  "group relative p-6 sm:p-7 rounded-2xl border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between text-left h-full select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677F2] focus-visible:ring-offset-2",
                  isSelected
                    ? "border-[#1677F2] ring-2 ring-[#1677F2]/25 shadow-[0_16px_36px_-10px_rgba(22,119,242,0.22)] -translate-y-1.5 bg-[#F8FAFD] dark:bg-card"
                    : "bg-white dark:bg-card border-[#E2E8F0] dark:border-border/80 hover:border-[#1677F2]/50 dark:hover:border-[#22B8E6]/40 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_-10px_rgba(16,39,71,0.09)] dark:hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.45)] hover:bg-gradient-to-b hover:from-white hover:to-[#F8FAFD] dark:hover:from-card dark:hover:to-card/90"
                )}
              >
                <div className="flex-1 flex flex-col">
                  {/* Top Row: Icon Container + Doctor Count Pill */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={cn(
                      "w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ease-out shadow-xs",
                      isSelected 
                        ? "bg-gradient-to-br from-[#1677F2] to-[#0E56B3] text-white shadow-[0_6px_20px_rgba(22,119,242,0.35)]" 
                        : "bg-gradient-to-br from-[#EBF5FF] via-[#F0F7FF] to-[#E0F2FE] dark:from-[#102747]/60 dark:via-[#102747]/40 dark:to-[#1677F2]/25 border border-[#BAE6FD]/80 dark:border-[#1677F2]/30 group-hover:scale-105 group-hover:border-[#1677F2]/50 group-hover:shadow-[0_4px_14px_rgba(22,119,242,0.15)]"
                    )}>
                      {renderSpecialtyIcon(spec.iconName, isSelected)}
                    </div>

                    {/* Understated real doctor count pill with live indicator */}
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors duration-200",
                      isSelected
                        ? "bg-[#1677F2]/10 text-[#1677F2] dark:text-[#22B8E6] border border-[#1677F2]/20"
                        : "bg-[#F1F5F9] dark:bg-secondary text-[#475569] dark:text-muted-foreground border border-[#E2E8F0]/80 dark:border-border/60 group-hover:border-[#CBD5E1] dark:group-hover:border-border"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-300",
                        count > 0 ? "bg-[#1677F2] dark:bg-[#22B8E6] group-hover:scale-125" : "bg-slate-400"
                      )} />
                      <span className="whitespace-nowrap">
                        {count} {count === 1 
                          ? (lang === 'te' ? 'వైద్యుడు' : 'doctor available') 
                          : (lang === 'te' ? 'వైద్యులు' : 'doctors available')}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Specialty Name */}
                  <h3 className="text-lg sm:text-xl font-heading font-bold text-[#102747] dark:text-foreground tracking-tight group-hover:text-[#1677F2] dark:group-hover:text-[#22B8E6] transition-colors duration-200 mb-1.5 line-clamp-1">
                    {displayName}
                  </h3>

                  {/* Patient-friendly Description */}
                  <p className="text-xs sm:text-sm text-[#475569] dark:text-muted-foreground leading-relaxed line-clamp-2 min-h-[38px] sm:min-h-[42px]">
                    {displayDesc}
                  </p>
                </div>

                {/* Bottom Row: Refined Interactive "View Doctors →" Action */}
                <div className="mt-5 pt-4 border-t border-[#F1F5F9] dark:border-border/60 flex items-center justify-between">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200",
                    isSelected 
                      ? "text-[#1677F2] dark:text-[#22B8E6]" 
                      : "text-[#102747] dark:text-foreground group-hover:text-[#1677F2] dark:group-hover:text-[#22B8E6]"
                  )}>
                    <span>{isSelected ? t.hideDoctors : t.viewDoctors}</span>
                  </span>

                  <span className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out",
                    isSelected 
                      ? "bg-[#1677F2] text-white rotate-90 shadow-sm" 
                      : "bg-[#F1F5F9] dark:bg-secondary text-[#102747] dark:text-foreground group-hover:bg-[#1677F2] group-hover:text-white group-hover:translate-x-1 group-hover:shadow-[0_4px_12px_rgba(22,119,242,0.25)]"
                  )}>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. EMPTY SEARCH STATE ── */}
        {filteredSpecialties.length === 0 && (
          <div className="py-16 text-center border border-dashed border-[#CBD5E1] dark:border-border rounded-2xl bg-white dark:bg-card my-8 p-6">
            <div className="w-12 h-12 rounded-full bg-[#EBF5FF] dark:bg-[#102747]/40 flex items-center justify-center mx-auto mb-3 text-[#1677F2]">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#102747] dark:text-foreground mb-1">
              {t.noResultsTitle}
            </h4>
            <p className="text-sm text-[#64748B] dark:text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
              {t.noResultsDesc}
            </p>
            <button
              type="button"
              onClick={clearSelection}
              className="px-5 py-2.5 text-xs font-bold rounded-xl border border-[#CBD5E1] dark:border-border bg-white dark:bg-card hover:bg-slate-50 text-[#102747] dark:text-foreground cursor-pointer shadow-xs transition-colors"
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
                className="mt-12 pt-10 border-t border-[#E2E8F0] dark:border-border"
              >
                {/* Doctor Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1677F2]" />
                      <span className="text-xs font-bold tracking-wider text-[#1677F2] uppercase">
                        {t.availablePhysicians}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#102747] dark:text-foreground tracking-tight mt-1">
                      {activeSpecialtyDetails 
                        ? `${t.specialistsIn} ${lang === 'te' ? activeSpecialtyDetails.nameTe : activeSpecialtyDetails.name}` 
                        : (searchQuery ? `Matching Doctors for "${searchQuery}"` : t.availablePhysicians)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#64748B] dark:text-muted-foreground font-medium">
                      {displayedDoctors.length} {displayedDoctors.length === 1 ? 'physician' : 'physicians'} available
                    </span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-[#64748B] hover:text-[#102747] dark:text-muted-foreground dark:hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-secondary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t.close}</span>
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loadingDoctors ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-6 rounded-2xl border border-[#E2E8F0] dark:border-border bg-white dark:bg-card animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-secondary" />
                          <div className="space-y-2.5 flex-1">
                            <div className="h-4 bg-slate-200 dark:bg-secondary rounded w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-secondary rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedDoctors.length === 0 ? (
                  <div className="p-10 text-center bg-white dark:bg-card rounded-2xl border border-[#E2E8F0] dark:border-border">
                    <p className="text-sm text-[#64748B] dark:text-muted-foreground">
                      No doctors currently listed for this department.
                    </p>
                  </div>
                ) : (
                  /* Doctor Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] dark:border-border/80 bg-white dark:bg-card hover:border-[#1677F2]/50 hover:-translate-y-1 hover:shadow-[0_16px_32px_-8px_rgba(16,39,71,0.09)] dark:hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out flex flex-col justify-between"
                      >
                        <div>
                          {/* Doctor Header: Genuine Portrait, Name, Specialty */}
                          <div className="flex items-start gap-3.5 mb-4">
                            <img
                              src={doc.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80'}
                              alt={doc.full_name}
                              className="w-15 h-15 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#E2E8F0] dark:border-border/60 shrink-0 bg-slate-100 shadow-xs"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-heading font-bold text-[#102747] dark:text-foreground tracking-tight truncate">
                                {doc.full_name}
                              </h3>
                              <p className="text-xs text-[#1677F2] dark:text-[#22B8E6] font-semibold truncate mt-0.5">
                                {doc.specialization} · {doc.qualification}
                              </p>
                              <p className="text-xs text-[#64748B] dark:text-muted-foreground mt-1">
                                {doc.experience_years} years {t.experience}
                              </p>
                            </div>
                          </div>

                          {/* Next Appointment Slot & Fee */}
                          <div className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] dark:bg-secondary/50 border border-[#E2E8F0]/70 dark:border-border/40 text-xs mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[#64748B] dark:text-muted-foreground">
                              <Clock className="w-3.5 h-3.5 text-[#1677F2] shrink-0" />
                              <span className="truncate">{doc.nextSlot || 'Today · Available'}</span>
                            </div>
                            <span className="font-bold text-[#102747] dark:text-foreground shrink-0 text-sm">
                              ₹{doc.consultation_fee}
                            </span>
                          </div>
                        </div>

                        {/* Actions: View Profile & Book Appointment */}
                        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#F1F5F9] dark:border-border/50">
                          <button
                            type="button"
                            onClick={() => setActiveProfileDoctor(doc)}
                            className="px-3 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-secondary/60 text-[#102747] dark:text-foreground text-xs font-bold transition-colors text-center cursor-pointer shadow-xs"
                          >
                            {t.viewProfile}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/book-appointment/${doc.id}`)}
                            className="px-3 py-2.5 rounded-xl bg-[#1677F2] text-white hover:bg-[#0E56B3] text-xs font-bold transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-1 group/btn"
                          >
                            <span>{t.bookAppointment}</span>
                            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
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
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-[#E2E8F0] dark:border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-[#475569] dark:text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] dark:bg-[#102747]/50 flex items-center justify-center text-[#1677F2] dark:text-[#22B8E6] shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm leading-relaxed">{t.generalConsultNote}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectSpecialty('General Medicine')}
            className="text-xs font-bold text-[#1677F2] dark:text-[#22B8E6] hover:text-[#0E56B3] dark:hover:text-[#38BDF8] shrink-0 cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F7FF] dark:bg-[#102747]/40 border border-[#BAE6FD]/60 dark:border-[#1677F2]/30 transition-colors self-stretch sm:self-auto justify-center"
          >
            <span>{t.bookGeneralDoc}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── 7. DOCTOR PROFILE MODAL ── */}
      <AnimatePresence>
        {activeProfileDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-card text-foreground border border-[#E2E8F0] dark:border-border rounded-3xl shadow-[0_24px_60px_-12px_rgba(16,39,71,0.25)] p-6 sm:p-7 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveProfileDoctor(null)}
                className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-[#102747] hover:bg-slate-100 dark:hover:bg-secondary transition-colors cursor-pointer"
                title={t.close}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Doctor Details */}
              <div className="flex items-start gap-4 mb-5">
                <img
                  src={activeProfileDoctor.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80'}
                  alt={activeProfileDoctor.full_name}
                  className="w-18 h-18 rounded-2xl object-cover border border-[#E2E8F0] dark:border-border bg-slate-100 shadow-xs"
                />
                <div className="min-w-0 pr-6">
                  <h3 className="text-xl font-heading font-extrabold text-[#102747] dark:text-foreground">
                    {activeProfileDoctor.full_name}
                  </h3>
                  <p className="text-xs font-bold text-[#1677F2] mt-0.5">
                    {activeProfileDoctor.specialization}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-muted-foreground mt-0.5">
                    {activeProfileDoctor.qualification} · {activeProfileDoctor.experience_years} years {t.experience}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {activeProfileDoctor.bio && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-muted-foreground mb-1.5">
                    {t.aboutDoctor}
                  </p>
                  <p className="text-xs text-[#334155] dark:text-foreground/80 leading-relaxed bg-[#F8FAFC] dark:bg-secondary/30 p-3.5 rounded-xl border border-[#E2E8F0] dark:border-border/40">
                    {activeProfileDoctor.bio}
                  </p>
                </div>
              )}

              {/* Credentials & Availability Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-secondary/50 border border-[#E2E8F0] dark:border-border/40">
                  <span className="block text-[10px] text-[#64748B] dark:text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    {t.consultingDays}
                  </span>
                  <span className="font-bold text-[#102747] dark:text-foreground">
                    {activeProfileDoctor.available_days?.join(', ') || 'Mon - Fri'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-secondary/50 border border-[#E2E8F0] dark:border-border/40">
                  <span className="block text-[10px] text-[#64748B] dark:text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    {t.consultingHours}
                  </span>
                  <span className="font-bold text-[#102747] dark:text-foreground">
                    {activeProfileDoctor.available_from} - {activeProfileDoctor.available_to}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-secondary/50 border border-[#E2E8F0] dark:border-border/40">
                  <span className="block text-[10px] text-[#64748B] dark:text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    {t.nextAvailable}
                  </span>
                  <span className="font-bold text-[#1677F2]">
                    {activeProfileDoctor.nextSlot || 'Available Today'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-secondary/50 border border-[#E2E8F0] dark:border-border/40">
                  <span className="block text-[10px] text-[#64748B] dark:text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    {t.consultationFee}
                  </span>
                  <span className="font-bold text-[#102747] dark:text-foreground text-sm">
                    ₹{activeProfileDoctor.consultation_fee}
                  </span>
                </div>
              </div>

              {/* Modal CTA Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProfileDoctor(null)}
                  className="flex-1 py-3 rounded-xl border border-[#CBD5E1] dark:border-border bg-white dark:bg-card hover:bg-slate-50 text-xs font-bold text-[#102747] dark:text-foreground transition-colors cursor-pointer"
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
                  className="flex-1 py-3 rounded-xl bg-[#1677F2] text-white hover:bg-[#0E56B3] text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{t.proceedBooking}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}