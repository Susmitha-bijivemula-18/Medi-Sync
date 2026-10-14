import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Specialities } from '../components/home/Specialities';

export function SpecialitiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />
      <main className="pt-20 flex-1">
        <Specialities />
      </main>
      <Footer />
    </div>
  );
}
