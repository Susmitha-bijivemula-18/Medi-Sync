import { motion, type Variants } from 'framer-motion';

export function AboutHospital() {
  
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
    <section id="about" className="relative py-12 md:py-20 px-6 md:px-12 lg:px-24 bg-background transition-colors duration-500 overflow-hidden">
      <div className="w-full max-w-[76rem] mx-auto">
        
        {/* Main Content Split */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* LEFT SIDE: Typography & Explanation */}
          <div className="flex flex-col items-start relative z-10">
            <motion.div 
              custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="flex items-center gap-2 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand transition-colors duration-500">
                Why CareTrack
              </span>
            </motion.div>
            
            <motion.h2 
              custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6 max-w-[480px]"
            >
              Healthcare shouldn't mean <span className="text-muted-foreground font-medium">waiting without knowing.</span>
            </motion.h2>

            <motion.p 
              custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="text-base md:text-lg text-foreground/90 max-w-[400px] leading-relaxed"
            >
              Know when it's your turn. See your queue position, get timely updates, and arrive when you're needed.
            </motion.p>
          </div>
          
          {/* RIGHT SIDE: Experience Comparison */}
          <div className="w-full flex flex-col gap-4 lg:pl-10 mt-8 lg:mt-0">
            
            {/* The Old Way */}
            <motion.div 
              custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-secondary/50 border border-border/50 text-muted-foreground opacity-70"
            >
               <div className="flex items-center mb-3 sm:mb-0">
                  <span className="text-xs font-semibold uppercase tracking-wider">The Old Way</span>
               </div>
               <div className="flex items-center gap-6 text-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Position</span>
                    <span className="font-medium">— Unknown</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Wait Time</span>
                    <span className="font-medium">— Uncertain</span>
                  </div>
               </div>
            </motion.div>

            {/* The CareTrack Way */}
            <motion.div 
              custom={4} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUpVariant}
              className="flex flex-col p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-brand" />
               <span className="text-xs font-semibold uppercase tracking-wider text-brand mb-6 block">With CareTrack</span>
               
               <div className="flex flex-row gap-10 sm:gap-16 mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Your Position</span>
                    <span className="text-5xl sm:text-6xl font-heading font-semibold tracking-tight text-foreground leading-none">#04</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Estimated Wait</span>
                    <span className="text-5xl sm:text-6xl font-heading font-semibold tracking-tight text-foreground leading-none">
                      12<span className="text-2xl sm:text-3xl text-muted-foreground font-medium tracking-normal ml-1">min</span>
                    </span>
                  </div>
               </div>

               <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary/30 rounded-xl border border-border/50 w-fit">
                 <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                 <span className="text-sm font-medium text-foreground">Status: <span className="font-semibold ml-1 text-brand">Your turn approaching</span></span>
               </div>
            </motion.div>

          </div>
          
        </div>

        {/* BOTTOM HIGHLIGHTS */}
        <motion.div 
          custom={5} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={fadeUpVariant}
          className="mt-16 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          {/* Highlight 01 */}
          <div className="flex flex-col pr-4 sm:border-r border-border/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">Real-Time Queue</span>
            <span className="text-sm text-muted-foreground leading-relaxed">Know where you stand at all times.</span>
          </div>
          
          {/* Highlight 02 */}
          <div className="flex flex-col pr-4 sm:border-r border-border/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">Timely Notifications</span>
            <span className="text-sm text-muted-foreground leading-relaxed">Know exactly when to arrive.</span>
          </div>

          {/* Highlight 03 */}
          <div className="flex flex-col pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">Visit History</span>
            <span className="text-sm text-muted-foreground leading-relaxed">Keep your consultations organized.</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}