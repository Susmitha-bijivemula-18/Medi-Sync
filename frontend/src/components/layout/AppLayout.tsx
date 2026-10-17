import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { X, LayoutDashboard, Search, Calendar, Users, FileText, Activity, Bell, User, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MediSyncLogoCompact } from '../ui/Logo';

const navItems = [
  { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { name: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { name: 'Appointments', path: '/patient/appointments', icon: Calendar },
  { name: 'Queue', path: '/patient/queue', icon: Users },
  { name: 'Medical Records', path: '/patient/records', icon: FileText },
  { name: 'Health History', path: '/patient/history', icon: Activity },
  { name: 'Notifications', path: '/patient/notifications', icon: Bell },
  { name: 'Profile', path: '/patient/profile', icon: User },
  { name: 'Settings', path: '/patient/settings', icon: Settings },
];

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-6">
                <MediSyncLogoCompact onClick={() => setIsMobileMenuOpen(false)} />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-md hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )
                      }
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="p-4 mt-auto border-t border-border">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
