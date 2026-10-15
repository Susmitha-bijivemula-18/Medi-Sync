import { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { getDoctorFallbackAvatar } from '../../lib/doctors';

interface DoctorAvatarProps {
  src?: string;
  name?: string;
  className?: string;
  imgClassName?: string;
}

export function DoctorAvatar({ src, name = 'Doctor', className = 'w-12 h-12', imgClassName = '' }: DoctorAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const fallbackUrl = getDoctorFallbackAvatar(name);

  // Compute initials
  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'DR';

  const imageSrc = !hasError && src ? src : fallbackUrl;

  return (
    <div className={`relative rounded-full overflow-hidden bg-brand/10 border border-border flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={imageSrc}
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${imgClassName}`}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
      />
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-tr from-brand to-brand/70 text-brand-foreground flex items-center justify-center font-bold text-xs select-none">
          <span>{initials}</span>
          <Stethoscope className="w-2.5 h-2.5 absolute bottom-1 right-1 opacity-70" />
        </div>
      )}
    </div>
  );
}
