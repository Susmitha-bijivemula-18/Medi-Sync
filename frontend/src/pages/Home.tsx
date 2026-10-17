import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';

import { AboutHospital } from '../components/home/AboutHospital';
import { Specialities } from '../components/home/Specialities';
import { MediSyncIntro } from '../components/home/MediSyncIntro';
import { QueueShowcase } from '../components/home/QueueShowcase';

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />

        <AboutHospital />
        <Specialities />
        <MediSyncIntro />
        <QueueShowcase />
      </main>
      <Footer />
    </div>
  );
}