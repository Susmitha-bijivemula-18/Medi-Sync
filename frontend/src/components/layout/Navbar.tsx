import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CareTrackLogo } from '../ui/Logo';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#specialities', label: 'Specialities' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#experience', label: 'Patient Experience' },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out',
          isScrolled
            ? 'py-3 bg-background/95 backdrop-blur-md border-b border-border shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-none'
            : 'py-6 bg-transparent border-b border-transparent'
        )}
      >
        <div className="w-full max-w-[90rem] mx-auto px-6 md:px-10 flex items-center justify-between gap-4">
          
          {/* LEFT: Brand Lockup */}
          <div className="flex-1 flex items-center justify-start z-50">
            <CareTrackLogo />
          </div>

          {/* CENTER: Refined Navigation Composition */}
          <nav className="hidden lg:flex flex-none items-center justify-center">
            <div className={cn(
              "flex items-center gap-1 transition-all duration-500 ease-in-out",
              isScrolled ? "bg-secondary/80 px-2 py-1 rounded-sm border border-border" : "px-0 py-0"
            )}>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 xl:px-5 py-2 text-[12px] xl:text-[13px] uppercase tracking-[0.08em] font-bold text-foreground opacity-80 transition-all duration-300",
                    "hover:opacity-100 hover:bg-foreground/5 group overflow-hidden rounded-md whitespace-nowrap"
                  )}
                >
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute bottom-1.5 left-5 right-5 h-[2px] bg-foreground transform scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </a>
              ))}
            </div>
          </nav>

          {/* RIGHT: Secondary Action & Signature CTA & Theme Toggle */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-4 xl:gap-6 z-50">
            
            <button 
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" strokeWidth={2} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={2} />}
            </button>

            {/* Patient Login */}
            <Link
              to="/login"
              className={cn(
                "relative inline-flex items-center justify-center px-4 py-2 border border-border rounded-none",
                "text-[12px] xl:text-[13px] uppercase tracking-[0.05em] font-medium text-foreground",
                "transition-all duration-300 ease-out overflow-hidden group whitespace-nowrap",
                "hover:border-foreground"
              )}
            >
              <span className="relative z-10">Patient Login</span>
            </Link>

            {/* Dedicated Doctor Portal Link */}
            <Link
              to="/doctor/login"
              className={cn(
                "relative inline-flex items-center justify-center px-4 py-2 border border-border/80 rounded-none",
                "text-[12px] xl:text-[13px] uppercase tracking-[0.05em] font-medium text-brand",
                "bg-brand/5 hover:bg-brand/10 hover:border-brand transition-all duration-300 ease-out whitespace-nowrap"
              )}
            >
              <span className="relative z-10 font-semibold">For Doctors</span>
            </Link>
            
            {/* Solid Book Appointment Primary CTA */}
            <Link
              to="/book-appointment"
              className={cn(
                "group relative inline-flex items-center gap-2.5 px-5 xl:px-6 py-2.5 rounded-none",
                "bg-foreground text-background border border-transparent dark:border-border",
                "text-[12px] xl:text-[13px] uppercase tracking-[0.05em] font-medium",
                "transition-all duration-300 ease-out hover:-translate-y-0.5",
                "shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] dark:hover:bg-card dark:hover:text-foreground",
                "overflow-hidden whitespace-nowrap"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 dark:from-black/0 dark:via-black/5 dark:to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Calendar className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-6" />
              <span className="relative z-10">Book Appointment</span>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex-1 flex justify-end gap-3 z-50 items-center">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground"
            >
              {isDark ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
            </button>
            <button
              className="flex items-center justify-center w-10 h-10 text-foreground hover:opacity-70 transition-opacity"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {/* Premium Mobile Navigation Panel */}
        <div
          className={cn(
            "fixed inset-0 w-full h-[100dvh] bg-background/98 backdrop-blur-xl z-40 transition-all duration-500 ease-in-out md:hidden overflow-y-auto",
            isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="flex flex-col min-h-full justify-center px-8 py-28">
            <nav className="flex flex-col gap-6">
            {navLinks.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-3xl font-light tracking-tight text-foreground hover:opacity-60 transition-opacity",
                  isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}
                style={{ transitionDelay: `${idx * 100}ms`, transitionDuration: '500ms' }}
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          <div 
            className={cn(
              "mt-12 flex flex-col gap-4 border-t border-border pt-8 transition-all duration-700 delay-300",
              isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
          >
            
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full py-3.5 border border-border rounded-none text-foreground text-sm uppercase tracking-widest font-medium transition-colors hover:border-foreground"
            >
              Patient Login
            </Link>
            <Link
              to="/doctor/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full py-3.5 border border-brand/40 bg-brand/5 text-brand text-sm uppercase tracking-widest font-semibold transition-colors hover:bg-brand/10"
            >
              For Doctors (Doctor Portal)
            </Link>
            <Link
              to="/book-appointment"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-none bg-foreground text-background text-sm uppercase tracking-widest font-medium shadow-lg transition-transform active:scale-[0.98]"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment
            </Link>
          </div>
          </div>
        </div>
      </header>
    </>
  );
}