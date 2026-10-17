import { motion, type Variants } from 'framer-motion';

export function MediSyncIntro() {
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
            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
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
          className="hidden lg:flex w-full relative pt-2"
        >
          {/* Main Background Line */}
          <div className="absolute top-[1.25rem] left-0 w-full h-[1px] bg-border" />
          
          <div className="grid grid-cols-4 w-full">
            {steps.map((step, i) => (
              <div 
                 key={i}
                 className="flex flex-col px-4 xl:px-6 relative group h-full"
              >
                {/* Active Hover Line / Indicator */}
                <div className="w-full h-[1.5px] bg-brand scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out absolute top-[1.25rem] left-0 z-10" />
                <div className="w-2.5 h-2.5 rounded-full bg-background border-2 border-border group-hover:border-brand absolute top-[1.05rem] left-4 xl:left-6 z-20 transition-colors duration-300" />
                
                <div className="mt-10 flex flex-col">
                  <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5 uppercase tracking-wide">
                    <span className="text-muted-foreground mr-2 font-medium">{step.num}</span> 
                    {step.title}
                  </h3>
                  
                  <p className="text-[14px] text-foreground/70 leading-relaxed mb-6">
                    {step.desc}
                  </p>
                </div>
                
                {/* TRACK UI PREVIEW */}
                {step.isRich && step.type === 'track' && (
                   <div className="mt-auto w-full pt-4">
                      <div className="flex flex-col border border-border/60 rounded-xl p-5 bg-card/50 shadow-sm transition-all duration-300 group-hover:border-border group-hover:bg-card">
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Position</span>
                         <span className="text-3xl font-heading font-semibold text-foreground leading-none mb-4">#04</span>
                         
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Wait Time</span>
                         <span className="text-3xl font-heading font-semibold text-foreground leading-none mb-5">12 <span className="text-sm font-medium tracking-normal text-muted-foreground">min</span></span>

                         <div className="flex items-center gap-2 mt-1 pt-4 border-t border-border/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Live Queue</span>
                         </div>
                      </div>
                   </div>
                )}

                {/* NOTIFY UI PREVIEW */}
                {step.isRich && step.type === 'notify' && (
                   <div className="mt-auto w-full pt-4">
                      <div className="flex flex-col border border-brand/20 rounded-xl p-5 bg-brand/5 shadow-sm transition-all duration-300 group-hover:border-brand/40 group-hover:bg-brand/10">
                         <span className="text-[11px] font-semibold uppercase tracking-wider text-brand mb-3">Your turn is approaching</span>
                         <span className="text-[13px] leading-relaxed text-foreground/80 font-medium">Please arrive at the consultation area in approx. 10 minutes.</span>
                      </div>
                   </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* MOBILE/TABLET VERTICAL TIMELINE */}
        <motion.div 
          custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
          className="flex lg:hidden flex-col gap-8 relative pl-2 md:pl-6 max-w-2xl mx-auto"
        >
           {/* Vertical Line */}
           <div className="absolute left-[13px] md:left-[29px] top-3 bottom-0 w-[1px] bg-border" />
           
           {steps.map((step, i) => (
             <div key={i} className="flex flex-col relative pl-10 md:pl-12">
               {/* Timeline Dot */}
               <div className="absolute left-[8px] md:left-[24px] top-[6px] w-[11px] h-[11px] bg-background border-2 border-border rounded-full" />
               
               <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5 uppercase tracking-wide">
                 <span className="text-muted-foreground mr-2 font-medium">{step.num}</span> 
                 {step.title}
               </h3>
               
               <p className="text-[14px] text-foreground/70 leading-relaxed">
                 {step.desc}
               </p>
               
               {/* Mobile Rich UIs */}
               {step.isRich && step.type === 'track' && (
                 <div className="w-full max-w-[280px] mt-4 mb-2">
                    <div className="flex flex-col border border-border/60 rounded-xl p-5 bg-card/50 shadow-sm">
                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Position</span>
                       <span className="text-3xl font-heading font-semibold text-foreground leading-none mb-4">#04</span>
                       
                       <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Wait Time</span>
                       <span className="text-3xl font-heading font-semibold text-foreground leading-none mb-5">12 <span className="text-sm font-medium tracking-normal text-muted-foreground">min</span></span>

                       <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">Live Queue</span>
                       </div>
                    </div>
                 </div>
               )}

               {step.isRich && step.type === 'notify' && (
                 <div className="w-full max-w-[280px] mt-4 mb-2">
                    <div className="flex flex-col border border-brand/20 rounded-xl p-5 bg-brand/5 shadow-sm">
                       <span className="text-[11px] font-semibold uppercase tracking-wider text-brand mb-2">Your turn is approaching</span>
                       <span className="text-[13px] leading-relaxed text-foreground/80 font-medium">Please arrive in approx. 10 minutes.</span>
                    </div>
                 </div>
               )}
             </div>
           ))}
        </motion.div>

      </div>
    </section>
  );
}

export const CareTrackIntro = MediSyncIntro;
