import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { MediSyncIcon, MediSyncLogoCompact } from '../ui/Logo';

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yText = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const yProduct = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <section ref={containerRef} className="relative min-h-[75vh] md:min-h-[85vh] pt-24 pb-12 md:pt-32 md:pb-20 flex items-center bg-background transition-colors duration-500 overflow-hidden">
      <div className="w-full max-w-[90rem] mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid lg:grid-cols-[45%_55%] gap-12 lg:gap-16 items-center">
          
          {/* LEFT: Copy (45%) */}
          <motion.div style={{ y: yText }} className="flex flex-col items-start relative z-10 h-full justify-center py-4 lg:py-8">
            <div className="mb-6 pointer-events-none">
              <MediSyncLogoCompact iconClassName="w-6 h-6 md:w-6 md:h-6 text-foreground" className="gap-2" />
            </div>
            
            <h1 className="text-[3rem] sm:text-5xl md:text-[4.5rem] lg:text-[5rem] font-semibold tracking-tight text-foreground leading-[1.05] mb-6 transition-colors duration-500">
              Healthcare, <br className="hidden sm:block" />
              <span className="text-muted-foreground">made simpler.</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-[480px] leading-relaxed mb-8 transition-colors duration-500">
              Find doctors, book appointments, and track your turn in real time—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 mb-10 w-full sm:w-auto">
              <Link to="/book-appointment" className="w-full sm:w-auto group flex items-center justify-center gap-2 px-7 py-3.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg shadow-sm hover:opacity-90 hover:shadow-md transition-all duration-300 active:scale-[0.98]">
                Book an Appointment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link to="/login" className="w-full sm:w-auto group flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors py-3.5">
                Track My Appointment
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium transition-colors duration-500">
              <span>Real-Time Updates</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Live Queue</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Easy Booking</span>
            </div>
          </motion.div>
          
          {/* RIGHT: Dynamic Journey Sequence (55%) */}
          <motion.div 
            style={{ y: yProduct }}
            className="relative w-full h-[450px] sm:h-[500px] flex items-center justify-center lg:pl-10 mb-8 lg:mb-0"
          >
            <QueueJourney />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}

const STAGES = [
  { id: 'find', duration: 2000 },
  { id: 'booked', duration: 2000 },
  { id: 'waiting', duration: 2000 },
  { id: 'notified', duration: 2000 },
  { id: 'consult', duration: 2000 }
];

function QueueJourney() {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStageIdx(prev => (prev + 1) % STAGES.length);
    }, STAGES[stageIdx].duration); 
    
    return () => clearTimeout(timer);
  }, [stageIdx]);

  const stage = STAGES[stageIdx].id;

  return (
    <div className="relative w-full h-full flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-colors duration-500">
      
      {/* Top Context - static frame */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center pt-6 px-6 lg:px-8 z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <MediSyncIcon className="w-3.5 h-3.5 text-foreground" />
            <div className="text-xs font-semibold tracking-tight transition-colors duration-500">
              <span className="text-[#102747] font-bold" style={{ color: '#102747' }}>Medi</span><span className="text-[#1677F2] font-bold">Sync</span>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium transition-colors duration-500 mt-0.5">Live Journey</div>
        </div>
      </div>

      {/* Center Dynamic Content */}
      <div className="w-full flex-1 relative flex items-center justify-center overflow-hidden pt-12 pb-16">
        <AnimatePresence mode="wait">
          
          {/* STATE 0: Find Doctor */}
          {stage === 'find' && (
            <motion.div 
              key="find"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center w-full px-6"
            >
              <div className="w-full max-w-sm flex flex-col gap-3">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 text-left font-semibold">Select Specialist</div>
                
                {/* Primary Doctor (Target) */}
                <div className="relative overflow-hidden flex flex-col gap-1 p-4 border border-brand/30 bg-brand/[0.03] rounded-xl shadow-sm transition-colors cursor-default">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-card shrink-0">
                        <img src="/doctor_profile.jpg" alt="Dr. Ananya Rao" className="w-full h-full object-cover grayscale-[20%]" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">Dr. Ananya Rao</div>
                        <div className="text-xs text-muted-foreground truncate">Cardiology</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Available today</div>
                      </div>
                      <div className="shrink-0 text-[10px] font-medium text-foreground flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-full shadow-sm">
                        <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                        Available
                      </div>
                  </div>
                  {/* Subtle progress indicator to next state */}
                  <motion.div 
                    initial={{ scaleX: 0 }} 
                    animate={{ scaleX: 1 }} 
                    transition={{ duration: 2, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-[2px] bg-brand origin-left w-full opacity-70"
                  />
                </div>

                {/* Secondary Doctor 1 */}
                <div className="flex items-center gap-4 p-3 border border-border rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80" alt="Dr. Sarah Chen" className="w-full h-full object-cover grayscale-[20%]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">Dr. Sarah Chen</div>
                    <div className="text-xs text-muted-foreground truncate">Neurology</div>
                  </div>
                  <div className="shrink-0 text-[10px] text-muted-foreground font-medium px-2 py-1">Available</div>
                </div>

                {/* Secondary Doctor 2 */}
                <div className="flex items-center gap-4 p-3 border border-border rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&q=80" alt="Dr. Priya Nair" className="w-full h-full object-cover grayscale-[20%]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">Dr. Priya Nair</div>
                    <div className="text-xs text-muted-foreground truncate">General Medicine</div>
                  </div>
                  <div className="shrink-0 text-[10px] text-muted-foreground font-medium px-2 py-1">Available</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 1: Booked */}
          {stage === 'booked' && (
            <motion.div 
              key="booked"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center w-full px-6"
            >
               <div className="w-14 h-14 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-6">
                 <Check className="w-6 h-6" strokeWidth={2.5} />
               </div>
               <div className="text-xl font-semibold text-foreground mb-1">Appointment Booked</div>
               <div className="text-sm text-muted-foreground">Dr. Ananya Rao • Cardiology</div>
               <div className="mt-8 px-5 py-2.5 bg-secondary/50 border border-border rounded-lg text-xs font-medium text-foreground tracking-wide">
                  Today at 10:30 AM
               </div>
            </motion.div>
          )}

          {/* STATE 2: Waiting (Queue Preview) */}
          {stage === 'waiting' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center w-full px-6"
            >
               <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4 text-center">Your Appointment</div>
               
               <div className="w-full max-w-xs bg-background border border-border rounded-xl p-5 flex flex-col gap-5 shadow-sm">
                  <div className="flex justify-between items-center pb-5 border-b border-border">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Token</span>
                        <span className="text-2xl font-bold text-foreground leading-none">A-27</span>
                     </div>
                     <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Position</span>
                        <span className="text-2xl font-bold text-foreground leading-none">#04</span>
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium mb-1.5">Status</span>
                        <span className="text-xs font-semibold text-brand flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                          Waiting
                        </span>
                     </div>
                     <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium mb-1.5">Estimated Wait</span>
                        <span className="text-sm font-semibold text-foreground">12 min</span>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* STATE 3: Notified */}
          {stage === 'notified' && (
            <motion.div 
              key="notified"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center w-full px-6"
            >
               <div className="w-full max-w-xs bg-foreground text-background rounded-xl p-6 flex flex-col gap-4 shadow-lg">
                  <div className="flex gap-2 items-center text-[10px] uppercase tracking-wider font-semibold opacity-80">
                     <span className="w-1.5 h-1.5 bg-background rounded-full animate-pulse" />
                     Your turn approaching
                  </div>
                  <div className="text-lg font-medium leading-snug">
                     Please head to Room 04 for your consultation.
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-background/20 mt-2">
                     <div className="text-xs font-medium opacity-80">Position: #01</div>
                     <div className="text-xs font-semibold">Wait: 2 min</div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* STATE 4: Consultation */}
          {stage === 'consult' && (
            <motion.div 
              key="consult"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center w-full px-6"
            >
               <div className="w-20 h-20 rounded-full overflow-hidden border border-border bg-card mb-5 shadow-sm">
                  <img src="/doctor_profile.jpg" alt="Dr. Ananya Rao" className="w-full h-full object-cover grayscale-[20%]" />
               </div>
               <div className="text-lg font-semibold text-foreground mb-1">Consultation Active</div>
               <div className="text-sm text-muted-foreground mb-6">Dr. Ananya Rao</div>
               <div className="text-[10px] uppercase tracking-widest text-foreground font-semibold px-4 py-2 border border-border bg-secondary/30 rounded-full flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                  In Progress
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      
      {/* Bottom Sequence Indicator */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/50 backdrop-blur-sm border-t border-border p-4 z-20">
         <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-muted-foreground w-full">
            <span className={stageIdx === 0 ? "text-brand" : stageIdx > 0 ? "text-foreground" : ""}>FIND</span>
            
            <div className="flex-1 h-[2px] bg-border mx-1 relative overflow-hidden rounded-full">
               <motion.div className="absolute top-0 left-0 h-full bg-brand" initial={false} animate={{ width: stageIdx >= 1 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>

            <span className={stageIdx === 1 ? "text-brand" : stageIdx > 1 ? "text-foreground" : ""}>BOOKED</span>
            
            <div className="flex-1 h-[2px] bg-border mx-1 relative overflow-hidden rounded-full">
               <motion.div className="absolute top-0 left-0 h-full bg-brand" initial={false} animate={{ width: stageIdx >= 2 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
            
            <span className={stageIdx === 2 ? "text-brand" : stageIdx > 2 ? "text-foreground" : ""}>WAITING</span>
            
            <div className="flex-1 h-[2px] bg-border mx-1 relative overflow-hidden rounded-full">
               <motion.div className="absolute top-0 left-0 h-full bg-brand" initial={false} animate={{ width: stageIdx >= 3 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
            
            <span className={stageIdx === 3 ? "text-brand" : stageIdx > 3 ? "text-foreground" : ""}>NOTIFIED</span>
            
            <div className="flex-1 h-[2px] bg-border mx-1 relative overflow-hidden rounded-full">
               <motion.div className="absolute top-0 left-0 h-full bg-brand" initial={false} animate={{ width: stageIdx >= 4 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
            
            <span className={stageIdx >= 4 ? "text-brand" : ""}>CONSULT</span>
         </div>
      </div>
    </div>
  )
}