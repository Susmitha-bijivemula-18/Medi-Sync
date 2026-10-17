import { Link } from 'react-router-dom';

export function FinalCTA() {
  return (
    <section className="py-20 md:py-24 px-4 md:px-8 bg-foreground text-background text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Your Health. One Clearer Journey.</h2>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-12">
          Start managing your healthcare experience with MediSync.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/book-appointment" className="bg-background text-foreground px-8 py-4 rounded-xl text-base font-medium hover:opacity-90 transition-opacity">
            Book an Appointment
          </Link>
          <Link to="/login" className="bg-transparent border border-background text-background px-8 py-4 rounded-xl text-base font-medium hover:bg-background/10 transition-colors">
            Patient Login
          </Link>
        </div>
      </div>
    </section>
  );
}