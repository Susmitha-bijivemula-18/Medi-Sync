import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MediSyncLogo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="bg-background pt-16 pb-8 border-t border-border transition-colors duration-500 overflow-hidden">
      <div className="w-full max-w-[80rem] mx-auto px-6 md:px-12 lg:px-24">
        
        {/* CTA SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 border-b border-border/60 mb-12">
          <div className="flex flex-col max-w-xl">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground leading-[1.1] mb-3">
              Ready for a better care experience?
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              Book your appointment and stay informed every step of the way with MediSync.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <Link 
              to="/book-appointment" 
              className="w-full sm:w-auto bg-foreground text-background px-8 py-3.5 text-sm font-semibold rounded-lg hover:bg-foreground/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Book an Appointment
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto flex justify-center text-sm font-semibold text-foreground px-8 py-3.5 border border-border/80 rounded-lg hover:bg-foreground/[0.03] transition-colors items-center gap-2 group"
            >
              Patient Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-60" />
            </Link>
          </div>
        </div>

        {/* MAIN LINKS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-4 flex flex-col items-start pr-0 lg:pr-8">
            <MediSyncLogo className="mb-5 hover:opacity-80 transition-opacity" />
            <p className="text-sm text-foreground/70 leading-relaxed max-w-[280px]">
              Manage your appointments and follow your queue in real time with MediSync.
            </p>
          </div>
          
          {/* LINKS COLUMNS */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-foreground mb-4">MediSync</h3>
            <ul className="space-y-3 text-sm text-foreground/70 font-medium">
              <li><Link to="/" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Specialties</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">How it Works</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-2 lg:col-start-8">
            <h3 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-foreground mb-4">Patient</h3>
            <ul className="space-y-3 text-sm text-foreground/70 font-medium">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Patient Login</Link></li>
              <li><Link to="/book-appointment" className="hover:text-foreground transition-colors">Book Appointment</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Live Queue</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Visit History</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-3 lg:col-start-10">
            <h3 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-foreground mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-foreground/70 font-medium">
              <li><Link to="/book-appointment" className="hover:text-foreground transition-colors">Find a Doctor</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Help</Link></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="flex flex-col gap-5 pt-8 border-t border-border/60">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-[13px] font-medium text-foreground/60">
              © 2026 MediSync. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6 text-[13px] text-foreground/60 font-medium">
              <span className="cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Terms of Service</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Cookie Settings</span>
            </div>
          </div>
          
          <p className="text-[11px] text-foreground/40 leading-relaxed font-medium">
            Disclaimer: MediSync and associated statistics, reviews, and features are fictional demonstration content created for prototype purposes. Do not submit real medical data.
          </p>
        </div>

      </div>
    </footer>
  );
}