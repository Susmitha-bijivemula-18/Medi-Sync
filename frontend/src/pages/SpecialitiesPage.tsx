import { useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Specialities } from '../components/home/Specialities';

export function SpecialitiesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7FAFD] dark:bg-background text-foreground flex flex-col justify-between">
      <Navbar />
      <main className="pt-16 sm:pt-20 flex-1">
        <Specialities />
      </main>
      <Footer />
    </div>
  );
}
