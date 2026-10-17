export function MedicalRecordsShowcase() {
  return (
    <section className="py-16 md:py-20 px-4 md:px-8 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1 relative h-[500px] bg-background rounded-2xl border border-border p-6 shadow-subtle overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
          
          <div className="space-y-6 pt-12">
            {[
              { date: '08 OCT 2026', title: 'Cardiology Consultation', doc: 'Dr. Ananya Rao', files: 2 },
              { date: '21 AUG 2026', title: 'Blood Test', doc: 'Laboratory', files: 1 },
              { date: '12 JUN 2026', title: 'General Consultation', doc: 'Dr. Rahul Mehta', files: 1 },
            ].map((record, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card">
                <div className="text-xs font-bold tracking-widest text-muted-foreground mb-3">{record.date}</div>
                <div className="font-semibold text-lg">{record.title}</div>
                <div className="text-sm text-muted-foreground mb-4">{record.doc}</div>
                <div className="flex justify-between items-center text-sm pt-4 border-t border-border">
                  <span>{record.files} document{record.files > 1 ? 's' : ''}</span>
                  <span className="font-medium hover:text-muted-foreground cursor-pointer transition-colors">View record →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">Your healthcare history, in one place.</h2>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Keep your prescriptions, lab reports, and consultation records securely organized. MediSync ensures your medical history is always accessible for your next visit.
          </p>
        </div>
      </div>
    </section>
  );
}