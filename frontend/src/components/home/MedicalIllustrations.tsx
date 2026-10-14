interface IllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Friendly, modern medical illustrations for CareTrack specialties.
 * Designed with soft harmonious tones, approachable rounded vectors,
 * and high clarity for elderly patients and everyday users.
 */

// 1. Cardiology: Friendly Heart with ECG Pulse
export function CardiologyIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Heart doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-rose-100 dark:text-rose-950/60" />
      {/* Friendly anatomical heart outline */}
      <path
        d="M32 47.5C32 47.5 17 38.5 17 26.5C17 20.7 21.7 16 27.5 16C30.2 16 32 17.5 32 17.5C32 17.5 33.8 16 36.5 16C42.3 16 47 20.7 47 26.5C47 38.5 32 47.5 32 47.5Z"
        fill="#F43F5E"
        className="opacity-90 dark:opacity-95"
      />
      {/* Highlight sheen */}
      <path
        d="M23 21C20.5 23.5 20 27.5 20.5 30"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-70"
      />
      {/* Calm ECG Heartbeat line across center */}
      <path
        d="M20 31H25L28 26L31 36L34 28L36 31H44"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 2. Dermatology: Friendly Face & Gentle Skincare Droplet / Glow
export function DermatologyIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Skin and hair doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-amber-100 dark:text-amber-950/60" />
      {/* Friendly profile face silhouette */}
      <path
        d="M24 18C33 18 39 23 39 31C39 37 36 41 33 43C31 44.5 29 46 26 47H21C21 44 21 38 21 35C21 31 22 26 24 18Z"
        fill="#F59E0B"
        className="opacity-80"
      />
      {/* Friendly smiling face contour */}
      <circle cx="28" cy="30" r="1.75" fill="white" />
      <path
        d="M27 35C28.5 36.5 31.5 36.5 33 35"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Soothing skincare drop */}
      <path
        d="M44 26C44 26 39 32.5 39 36C39 38.8 41.2 41 44 41C46.8 41 49 38.8 49 36C49 32.5 44 26 44 26Z"
        fill="#0EA5E9"
        className="opacity-90"
      />
      {/* Healing glow sparkles */}
      <path
        d="M44 18V21M42.5 19.5H45.5"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 25V27M16 26H18"
        stroke="#F59E0B"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. General Medicine: Caring General Physician with Stethoscope
export function GeneralMedicineIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="General physician doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-blue-100 dark:text-blue-950/60" />
      {/* Doctor coat / torso */}
      <path
        d="M18 49C18 40 24 37 32 37C40 37 46 40 46 49H18Z"
        fill="#2563EB"
        className="opacity-90"
      />
      {/* Doctor face */}
      <circle cx="32" cy="25" r="9" fill="#F87171" className="opacity-90" />
      {/* Hair contour */}
      <path
        d="M23 24C23 18.5 27 15 32 15C37 15 41 18.5 41 24C38 21 34 20 32 20C29 20 25 21 23 24Z"
        fill="#1E293B"
      />
      {/* Friendly Stethoscope */}
      <path
        d="M26 37V42C26 45 28.5 47 32 47C35.5 47 38 45 38 42V37"
        stroke="#93C5FD"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Stethoscope chest piece */}
      <circle cx="32" cy="48" r="2.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
      {/* Medical health cross badge */}
      <circle cx="43" cy="21" r="6" fill="#10B981" />
      <path d="M43 18V24M40 21H46" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

// 4. Orthopedics: Bone, Joint & Knee Mobility Illustration
export function OrthopedicsIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Bone and joint doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-teal-100 dark:text-teal-950/60" />
      {/* Upper bone / Femur */}
      <path
        d="M30 15C28.5 15 27 16.5 27 18C27 19.5 28.5 21 30 21V28C28 29 27 30.5 27 32C27 33.5 28 35 30 36V43C28.5 43 27 44.5 27 46C27 47.5 28.5 49 30 49H34C35.5 49 37 47.5 37 46C37 44.5 35.5 43 34 43V36C36 35 37 33.5 37 32C37 30.5 36 29 34 28V21C35.5 21 37 19.5 37 18C37 16.5 35.5 15 34 15H30Z"
        fill="#0D9488"
        className="opacity-90"
      />
      {/* Knee joint central pivot */}
      <circle cx="32" cy="32" r="4.5" fill="#5EEAD4" stroke="#0F766E" strokeWidth="1.5" />
      {/* Comfort & flexibility radiating arcs */}
      <path
        d="M21 28C19.5 30.5 19.5 33.5 21 36"
        stroke="#0D9488"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M43 28C44.5 30.5 44.5 33.5 43 36"
        stroke="#0D9488"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M17 25C15 29 15 35 17 39"
        stroke="#14B8A6"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>
  );
}

// 5. Pediatrics: Cheerful Child / Infant Face
export function PediatricsIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Child doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-yellow-100 dark:text-yellow-950/60" />
      {/* Infant face */}
      <circle cx="32" cy="33" r="14" fill="#FBBF24" />
      {/* Baby hair curl on top */}
      <path
        d="M32 19C30 16 32 14 34 14C36 14 36 16.5 33.5 18"
        stroke="#D97706"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <circle cx="27" cy="31" r="1.75" fill="#451A03" />
      <circle cx="37" cy="31" r="1.75" fill="#451A03" />
      {/* Cheerful rosy cheeks */}
      <circle cx="24" cy="35" r="2.2" fill="#F87171" className="opacity-80" />
      <circle cx="40" cy="35" r="2.2" fill="#F87171" className="opacity-80" />
      {/* Smiling mouth */}
      <path
        d="M29 36C30 38 34 38 35 36"
        stroke="#451A03"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Gentle protective care hands */}
      <path
        d="M18 46C22 43 27 44 32 44C37 44 42 43 46 46"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 6. Neurology: Brain & Calm Neural Synapses
export function NeurologyIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Brain and nerve doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-indigo-100 dark:text-indigo-950/60" />
      {/* Stylized friendly brain lobes */}
      <path
        d="M32 18C27 18 22 21 21 26C20 29 21 32 20 35C19 38 21 42 25 43C27 43.5 29 42 30 41C31 42 32 42.5 32 42.5C32 42.5 33 42 34 41C35 42 37 43.5 39 43C43 42 45 38 44 35C43 32 44 29 43 26C42 21 37 18 32 18Z"
        fill="#6366F1"
        className="opacity-90"
      />
      {/* Neural connecting branches */}
      <path
        d="M32 22V38M25 28C28 29 32 30 35 27M28 35C31 34 35 35 38 33"
        stroke="#EEF2FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Glowing neural signal nodes */}
      <circle cx="32" cy="22" r="2.2" fill="#A5B4FC" />
      <circle cx="25" cy="28" r="2" fill="#C7D2FE" />
      <circle cx="39" cy="27" r="2" fill="#C7D2FE" />
      <circle cx="28" cy="35" r="2" fill="#C7D2FE" />
      <circle cx="36" cy="35" r="2" fill="#C7D2FE" />
    </svg>
  );
}

// 7. Gynecology: Caring Women's Health & Maternal Silhouette
export function GynecologyIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Women's health doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-pink-100 dark:text-pink-950/60" />
      {/* Elegant woman profile & protective embrace */}
      <circle cx="32" cy="22" r="6.5" fill="#EC4899" className="opacity-90" />
      {/* Nurturing contour */}
      <path
        d="M23 44C23 35 27 31 32 31C37 31 41 35 41 44C41 45.5 39.5 46.5 38 46.5H26C24.5 46.5 23 45.5 23 44Z"
        fill="#DB2777"
        className="opacity-80"
      />
      {/* Gentle caring maternal curve / heart */}
      <path
        d="M32 34C30 37 27 38.5 27 41C27 43 29 44.5 32 46.5C35 44.5 37 43 37 41C37 38.5 34 37 32 34Z"
        fill="#FDF2F8"
        className="opacity-95"
      />
      {/* Gentle flower wellness petal */}
      <path
        d="M40 21C42 19 45 20 45 22C45 24 43 25 41 24L40 21Z"
        fill="#F472B6"
      />
    </svg>
  );
}

// 8. ENT: Ear, Acoustic Waves & Clear Breathing Contours
export function ENTIllustration({ className = '', size = 56 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ear, nose and throat doctor illustration"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" className="text-sky-100 dark:text-sky-950/60" />
      {/* Anatomical ear friendly silhouette */}
      <path
        d="M26 17C33 17 38 21.5 38 28C38 33 34 36 34 39C34 42 32 45 28 45C24 45 22 42 22 39C22 37 24 35.5 25.5 35.5C27 35.5 28 36.5 28 38C28 39 29 40 30 40C31 40 32 38.5 32 37C32 33 34 30.5 34 28C34 23.5 30.5 20.5 26 20.5C21.5 20.5 19 23.5 19 27C19 28.5 17.5 29.5 16 29.5C14.5 29.5 13.5 28 13.5 26.5C13.5 21 18.5 17 26 17Z"
        fill="#0284C7"
        className="opacity-90"
      />
      {/* Acoustic hearing wave rings */}
      <path
        d="M42 23C44.5 25.5 44.5 30.5 42 33"
        stroke="#0EA5E9"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M47 19C51 23.5 51 32.5 47 37"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Airway breath indicator */}
      <path
        d="M26 48C28 48 30 49 32 50"
        stroke="#0284C7"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="opacity-70"
      />
    </svg>
  );
}

// Master component helper
export function SpecialtyIllustration({
  specialtyId,
  className = '',
  size = 56
}: {
  specialtyId: string;
  className?: string;
  size?: number;
}) {
  switch (specialtyId.toLowerCase()) {
    case 'cardiology':
      return <CardiologyIllustration className={className} size={size} />;
    case 'dermatology':
      return <DermatologyIllustration className={className} size={size} />;
    case 'general-medicine':
    case 'general medicine':
      return <GeneralMedicineIllustration className={className} size={size} />;
    case 'orthopedics':
      return <OrthopedicsIllustration className={className} size={size} />;
    case 'pediatrics':
      return <PediatricsIllustration className={className} size={size} />;
    case 'neurology':
      return <NeurologyIllustration className={className} size={size} />;
    case 'gynecology':
      return <GynecologyIllustration className={className} size={size} />;
    case 'ent':
      return <ENTIllustration className={className} size={size} />;
    default:
      return <GeneralMedicineIllustration className={className} size={size} />;
  }
}
