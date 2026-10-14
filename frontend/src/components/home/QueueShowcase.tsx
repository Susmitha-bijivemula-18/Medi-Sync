import { motion, type Variants } from 'framer-motion';

export function QueueShowcase() {
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
    <section className="relative py-20 md:py-28 overflow-hidden bg-[#080808]">
      {/* Background Image & Sophisticated Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-50" />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="w-full max-w-[80rem] mx-auto px-6 md:px-12 lg:px-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* LEFT SIDE: Messaging */}
        <div className="flex flex-col text-white">
            <motion.h2 
              custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold tracking-tight mb-6 leading-[1.1]"
            >
              Your care, all in one place.
            </motion.h2>
          
            <motion.p 
              custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="text-base sm:text-lg text-white/90 max-w-md leading-relaxed mb-12"
            >
              Keep your appointments, queue updates, prescriptions, and visit history together.
            </motion.p>

          <div className="space-y-10 max-w-md">
            
            <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant} className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xl font-heading font-semibold text-white/50">01</span>
                <h4 className="text-[11px] font-semibold tracking-wider uppercase text-white">Live Queue</h4>
              </div>
              <p className="text-[15px] text-white/80 leading-relaxed pl-[42px]">
                See your position and estimated wait.
              </p>
            </motion.div>

            <motion.div custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant} className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xl font-heading font-semibold text-white/50">02</span>
                <h4 className="text-[11px] font-semibold tracking-wider uppercase text-white">Prescriptions & Records</h4>
              </div>
              <p className="text-[15px] text-white/80 leading-relaxed pl-[42px]">
                Access important information from past visits.
              </p>
            </motion.div>

            <motion.div custom={4} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant} className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xl font-heading font-semibold text-white/50">03</span>
                <h4 className="text-[11px] font-semibold tracking-wider uppercase text-white">Appointment History</h4>
              </div>
              <p className="text-[15px] text-white/80 leading-relaxed pl-[42px]">
                Keep track of your previous consultations.
              </p>
            </motion.div>

          </div>
        </div>

        {/* RIGHT SIDE: Premium Product UI Showcase */}
        <div className="relative flex flex-col justify-center lg:justify-end items-center lg:items-end w-full mt-8 lg:mt-0 pt-4">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px] bg-card text-foreground border border-border rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-brand" />
             
             <div className="p-6 sm:p-8">
               {/* Header */}
               <div className="flex items-start justify-between border-b border-border pb-6 mb-8">
                 <div className="flex flex-col">
                   <div className="font-heading font-semibold text-xl tracking-tight mb-1">Dr. Ananya Rao</div>
                   <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cardiology</div>
                 </div>
                 
                 {/* Live Indicator */}
                 <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-border/60 bg-foreground/[0.02]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-foreground">Live Queue</span>
                 </div>
               </div>

               {/* Token & Stats */}
               <div className="flex flex-col mb-10">
                 <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your Token</div>
                 <div className="text-5xl sm:text-6xl leading-none font-heading font-semibold tracking-tight text-foreground">A-27</div>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-10 pb-10 border-b border-border">
                 <div className="flex flex-col">
                   <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Current</div>
                   <div className="text-2xl font-heading font-semibold text-foreground">A-23</div>
                 </div>
                 <div className="flex flex-col">
                   <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Ahead</div>
                   <div className="text-2xl font-heading font-semibold text-foreground">3</div>
                 </div>
                 <div className="flex flex-col">
                   <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Est. Wait</div>
                   <div className="text-2xl font-heading font-semibold text-foreground">18 <span className="text-sm font-medium tracking-normal text-muted-foreground">min</span></div>
                 </div>
               </div>

               {/* Live Queue Visual */}
               <div className="flex flex-col gap-3">
                 {['A-23', 'A-24', 'A-25', 'A-26'].map((token) => (
                   <div key={token} className="flex items-center gap-4 text-muted-foreground opacity-50">
                     <span className="w-10 text-[13px] font-semibold">{token}</span>
                     <div className="w-[1.5px] h-3 bg-border" />
                   </div>
                 ))}
                 
                 <div className="flex items-center gap-4 text-foreground pt-1">
                   <span className="w-10 text-[13px] font-bold">A-27</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                   <span className="text-[10px] font-bold tracking-wider uppercase text-brand">You</span>
                 </div>
               </div>
             </div>

             {/* Integrated Notification Panel (replaces floating) */}
             <div className="bg-brand/5 border-t border-brand/10 p-5 mt-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">Your turn is approaching</span>
                </div>
                <span className="text-[13px] font-medium leading-relaxed text-foreground/80">
                  Please arrive at the consultation area in approx. 10 minutes.
                </span>
             </div>
             
          </motion.div>
          
        </div>

      </div>
    </section>
  );
}