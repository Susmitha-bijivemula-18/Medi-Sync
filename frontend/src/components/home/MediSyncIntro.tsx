import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

export function MediSyncIntro() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const steps = [
    { 
      num: '01', 
      title: 'FIND', 
      desc: 'Choose a doctor and specialty.', 
      isRich: false 
    },
    { 
      num: '02', 
      title: 'BOOK', 
      desc: 'Pick a convenient appointment time.', 
      isRich: false 
    },
    { 
      num: '03', 
      title: 'TRACK', 
      desc: 'Follow your queue in real time.', 
      isRich: true, 
      type: 'track' 
    },
    { 
      num: '04', 
      title: 'ARRIVE', 
      desc: 'Get notified when it\'s almost your turn.', 
      isRich: true, 
      type: 'notify' 
    }
  ];

  // Auto-cycle through the steps with smooth line movement
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isAutoPlaying, steps.length]);

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.6,
        ease: 'easeOut'
      }
    })
  };

  return (
    <section id="how-it-works" className="relative py-12 md:py-20 px-6 md:px-12 lg:px-24 bg-background transition-colors duration-500 overflow-hidden">
      <div className="w-full max-w-[80rem] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
            className="flex items-center gap-2 mb-4"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#1677F2] animate-pulse"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1677F2]">
              How It Works
            </span>
          </motion.div>
          
          <motion.h2 
            custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.05] mb-5"
          >
            Book. Track. Arrive.
          </motion.h2>

          <motion.p 
            custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
            className="text-base sm:text-lg text-foreground/80 max-w-[600px] leading-relaxed"
          >
            Everything you need for a smoother visit with MediSync.
          </motion.p>
        </div>

        {/* DESKTOP HORIZONTAL JOURNEY */}
        <motion.div 
          custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
          className="hidden lg:flex w-full relative pt-2 select-none"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Background Line Track */}
          <div className="absolute top-[1.25rem] left-4 right-4 h-[2px] bg-[#E2E8F0] dark:bg-border/60 z-0" />
          
          <div className="grid grid-cols-4 w-full relative z-10">
            {steps.map((step, i) => {
              const isActive = activeStep === i;
              const isPassed = activeStep > i;

              return (
                <div 
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="flex flex-col px-4 xl:px-6 relative group h-full cursor-pointer"
                >
                  {/* Connecting Horizontal Line to the next step (i -> i+1) */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-[1.25rem] left-8 xl:left-10 right-[-1rem] xl:right-[-1.5rem] h-[2px] z-10 pointer-events-none overflow-hidden">
                      {/* Already completed step segment */}
                      {isPassed && (
                        <div className="w-full h-full bg-[#1677F2] shadow-[0_0_8px_rgba(22,119,242,0.4)]" />
                      )}

                      {/* Active step segment: line visibly moves from current step to next step */}
                      {isActive && (
                        <>
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#1677F2] via-[#1677F2] to-[#22B8E6] origin-left shadow-[0_0_8px_rgba(22,119,242,0.5)]"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                          />
                          {/* Traveling energy beam packet */}
                          <motion.div
                            className="absolute top-1/2 -translate-y-1/2 w-8 h-[4px] rounded-full bg-gradient-to-r from-transparent via-[#22B8E6] to-[#1677F2] shadow-[0_0_12px_#1677F2]"
                            initial={{ left: '-15%', opacity: 0 }}
                            animate={{
                              left: ['-15%', '100%'],
                              opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                              duration: 1.4,
                              repeat: Infinity,
                              repeatDelay: 0.5,
                              ease: 'easeInOut'
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Step Node Dot */}
                  <div className="relative">
                    <div className={cn(
                      "w-3 h-3 rounded-full absolute top-[1.05rem] left-4 xl:left-6 z-20 transition-all duration-300 flex items-center justify-center",
                      isActive
                        ? "bg-[#1677F2] ring-4 ring-[#1677F2]/25 shadow-[0_0_12px_rgba(22,119,242,0.6)]"
                        : isPassed
                          ? "bg-[#1677F2] ring-2 ring-[#1677F2]/20"
                          : "bg-white dark:bg-card border-2 border-[#CBD5E1] dark:border-border group-hover:border-[#1677F2]/60"
                    )}>
                      {isActive && (
                        <motion.span
                          className="absolute -inset-1.5 rounded-full bg-[#1677F2]/30"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                        />
                      )}
                      <span className={cn(
                        "w-1 h-1 rounded-full transition-colors",
                        isActive || isPassed ? "bg-white" : "bg-transparent"
                      )} />
                    </div>
                  </div>
                  
                  <div className="mt-10 flex flex-col">
                    <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                      <span className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-[#1677F2] dark:text-[#22B8E6] font-bold" : "text-muted-foreground font-medium"
                      )}>
                        {step.num}
                      </span> 
                      <span className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-[#102747] dark:text-foreground font-bold" : "text-foreground"
                      )}>
                        {step.title}
                      </span>
                    </h3>
                    
                    <p className="text-[14px] text-foreground/70 leading-relaxed mb-6">
                      {step.desc}
                    </p>
                  </div>
                  
                  {/* TRACK UI PREVIEW */}
                  {step.isRich && step.type === 'track' && (
                    <div className="mt-auto w-full pt-4">
                      <div className={cn(
                        "flex flex-col border rounded-xl p-5 shadow-xs transition-all duration-300",
                        isActive
                          ? "border-[#1677F2]/50 bg-white dark:bg-card shadow-[0_8px_24px_-6px_rgba(22,119,242,0.15)] ring-1 ring-[#1677F2]/20 scale-[1.02]"
                          : "border-border/60 rounded-xl bg-card/50 hover:border-border hover:bg-card"
                      )}>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Position</span>
                        <span className={cn(
                          "text-3xl font-heading font-semibold leading-none mb-4 transition-colors",
                          isActive ? "text-[#1677F2] dark:text-[#22B8E6]" : "text-foreground"
                        )}>#04</span>
                        
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Wait Time</span>
                        <span className="text-3xl font-heading font-semibold text-foreground leading-none mb-5">12 <span className="text-sm font-medium tracking-normal text-muted-foreground">min</span></span>

                        <div className="flex items-center gap-2 mt-1 pt-4 border-t border-border/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1677F2] animate-pulse" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Live Queue</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTIFY UI PREVIEW */}
                  {step.isRich && step.type === 'notify' && (
                    <div className="mt-auto w-full pt-4">
                      <div className={cn(
                        "flex flex-col border rounded-xl p-5 shadow-xs transition-all duration-300",
                        isActive
                          ? "border-[#1677F2]/40 bg-[#EBF5FF] dark:bg-[#102747]/40 shadow-[0_8px_24px_-6px_rgba(22,119,242,0.15)] ring-1 ring-[#1677F2]/25 scale-[1.02]"
                          : "border-brand/20 bg-brand/5 hover:border-brand/40 hover:bg-brand/10"
                      )}>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1677F2] dark:text-[#22B8E6] mb-3">
                          Your turn is approaching
                        </span>
                        <span className="text-[13px] leading-relaxed text-foreground/80 font-medium">
                          Please arrive at the consultation area in approx. 10 minutes.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* MOBILE/TABLET VERTICAL TIMELINE WITH ACTIVE LINE MOVEMENT */}
        <motion.div 
          custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
          className="flex lg:hidden flex-col gap-8 relative pl-2 md:pl-6 max-w-2xl mx-auto select-none"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {steps.map((step, i) => {
            const isActive = activeStep === i;
            const isPassed = activeStep > i;

            return (
              <div 
                key={i} 
                onClick={() => setActiveStep(i)}
                className="flex flex-col relative pl-10 md:pl-12 cursor-pointer group"
              >
                {/* ── Movement of Line to Next Step ── */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[13.5px] md:left-[29.5px] top-[19px] bottom-[-34px] w-[2px] -translate-x-1/2 z-0 pointer-events-none overflow-hidden">
                    {/* Background Track */}
                    <div className="w-full h-full bg-[#E2E8F0] dark:bg-border/60 rounded-full" />

                    {/* Completed Solid Line (when step is past) */}
                    {isPassed && (
                      <div className="absolute inset-0 w-full h-full bg-[#1677F2] rounded-full shadow-[0_0_6px_rgba(22,119,242,0.35)]" />
                    )}

                    {/* Active Drawing Line: flows from step i to step i+1 */}
                    {isActive && (
                      <>
                        <motion.div
                          className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#1677F2] via-[#1677F2] to-[#22B8E6] rounded-full shadow-[0_0_8px_rgba(22,119,242,0.5)] origin-top"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        />

                        {/* Traveling glowing pulse / laser packet moving down from step to step */}
                        <motion.div
                          className="absolute left-1/2 -translate-x-1/2 w-[5px] h-8 rounded-full bg-gradient-to-b from-transparent via-[#22B8E6] to-[#1677F2] shadow-[0_0_12px_#1677F2]"
                          initial={{ top: '-15%', opacity: 0 }}
                          animate={{ 
                            top: ['-15%', '100%'],
                            opacity: [0, 1, 1, 0]
                          }}
                          transition={{ 
                            duration: 1.4, 
                            repeat: Infinity,
                            repeatDelay: 0.5,
                            ease: 'easeInOut' 
                          }}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Timeline Dot */}
                <div 
                  className={cn(
                    "absolute left-[8px] md:left-[24px] top-[6px] w-[12px] h-[12px] rounded-full z-10 transition-all duration-300 flex items-center justify-center",
                    isActive
                      ? "bg-[#1677F2] ring-4 ring-[#1677F2]/25 shadow-[0_0_12px_rgba(22,119,242,0.6)]"
                      : isPassed
                        ? "bg-[#1677F2] ring-2 ring-[#1677F2]/20"
                        : "bg-white dark:bg-card border-2 border-[#CBD5E1] dark:border-border group-hover:border-[#1677F2]/60"
                  )}
                >
                  {/* Expanding pulse ripple on the currently active step dot */}
                  {isActive && (
                    <motion.span
                      className="absolute -inset-1.5 rounded-full bg-[#1677F2]/30"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  {/* Center micro dot */}
                  <span className={cn(
                    "w-1 h-1 rounded-full transition-colors",
                    isActive || isPassed ? "bg-white" : "bg-transparent"
                  )} />
                </div>
                
                {/* Step Header & Title */}
                <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <span className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-[#1677F2] dark:text-[#22B8E6] font-bold" : "text-muted-foreground font-medium"
                  )}>
                    {step.num}
                  </span> 
                  <span className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-[#102747] dark:text-foreground font-bold" : "text-foreground"
                  )}>
                    {step.title}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1677F2] dark:bg-[#22B8E6] animate-pulse ml-1" />
                  )}
                </h3>
                
                <p className={cn(
                  "text-[14px] leading-relaxed transition-colors duration-200",
                  isActive ? "text-foreground/90 font-medium" : "text-foreground/70"
                )}>
                  {step.desc}
                </p>
                
                {/* Mobile Rich UIs */}
                {step.isRich && step.type === 'track' && (
                  <div className="w-full max-w-[280px] mt-4 mb-2">
                    <div className={cn(
                      "flex flex-col rounded-xl p-5 shadow-xs transition-all duration-300 border",
                      isActive
                        ? "border-[#1677F2]/50 bg-white dark:bg-card shadow-[0_8px_24px_-6px_rgba(22,119,242,0.15)] ring-1 ring-[#1677F2]/20 scale-[1.02]"
                        : "border-border/60 rounded-xl bg-card/50 hover:border-border hover:bg-card"
                    )}>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Position</span>
                      <span className={cn(
                        "text-3xl font-heading font-semibold leading-none mb-4 transition-colors",
                        isActive ? "text-[#1677F2] dark:text-[#22B8E6]" : "text-foreground"
                      )}>#04</span>
                      
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Wait Time</span>
                      <span className="text-3xl font-heading font-semibold text-foreground leading-none mb-5">
                        12 <span className="text-sm font-medium tracking-normal text-muted-foreground">min</span>
                      </span>

                      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1677F2] animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Live Queue</span>
                      </div>
                    </div>
                  </div>
                )}

                {step.isRich && step.type === 'notify' && (
                  <div className="w-full max-w-[280px] mt-4 mb-2">
                    <div className={cn(
                      "flex flex-col rounded-xl p-5 shadow-xs transition-all duration-300 border",
                      isActive
                        ? "border-[#1677F2]/40 bg-[#EBF5FF] dark:bg-[#102747]/40 shadow-[0_8px_24px_-6px_rgba(22,119,242,0.15)] ring-1 ring-[#1677F2]/25 scale-[1.02]"
                        : "border-brand/20 bg-brand/5 hover:border-brand/40 hover:bg-brand/10"
                    )}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1677F2] dark:text-[#22B8E6] mb-2">
                        Your turn is approaching
                      </span>
                      <span className="text-[13px] leading-relaxed text-foreground/80 font-medium">
                        Please arrive in approx. 10 minutes.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}

export const CareTrackIntro = MediSyncIntro;

