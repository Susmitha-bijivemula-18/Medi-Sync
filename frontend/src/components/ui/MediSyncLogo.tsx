import React from 'react';
import { Link } from 'react-router-dom';

export interface MediSyncIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Premium MediSync Brand Icon
 * 
 * Visual Architecture:
 * - A modern medical cross comprised of four rounded blue shapes
 * - A smooth, flowing white S-shaped curve weaving dynamically through the center
 * - Brand Palette: Deep navy (#102747), vibrant blue (#1677F2), cyan (#22B8E6), white (#FFFFFF)
 */
export function MediSyncIcon({ size = 32, className = '', ...props }: MediSyncIconProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      viewBox="0 0 40 40"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-label="MediSync Symbol"
      role="img"
      {...props}
    >
      <defs>
        {/* Harmonious modern multi-stop gradient incorporating all approved brand colors */}
        <linearGradient id="medisync-sync-cross-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22B8E6" />
          <stop offset="45%" stopColor="#1677F2" />
          <stop offset="100%" stopColor="#102747" />
        </linearGradient>

        {/* Top/Right cyan highlight gradient */}
        <linearGradient id="medisync-sync-accent" x1="14" y1="4" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22B8E6" />
          <stop offset="100%" stopColor="#1677F2" />
        </linearGradient>

        {/* Subtle drop shadow filter for premium depth */}
        <filter id="medisync-subtle-glow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#102747" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* ── 1. The 4 Rounded Blue Shapes Forming the Medical Cross ── */}
      <g filter="url(#medisync-subtle-glow)">
        {/* Top Rounded Lobe */}
        <rect
          x="14"
          y="3"
          width="12"
          height="16"
          rx="6"
          fill="url(#medisync-sync-accent)"
        />

        {/* Bottom Rounded Lobe */}
        <rect
          x="14"
          y="21"
          width="12"
          height="16"
          rx="6"
          fill="url(#medisync-sync-cross-grad)"
        />

        {/* Left Rounded Lobe */}
        <rect
          x="3"
          y="14"
          width="16"
          height="12"
          rx="6"
          fill="url(#medisync-sync-cross-grad)"
        />

        {/* Right Rounded Lobe */}
        <rect
          x="21"
          y="14"
          width="16"
          height="12"
          rx="6"
          fill="url(#medisync-sync-accent)"
        />

        {/* Center Nexus Connecting the 4 Shapes */}
        <rect
          x="13.5"
          y="13.5"
          width="13"
          height="13"
          rx="3"
          fill="#1677F2"
        />
      </g>

      {/* ── 2. The Smooth Flowing White S-Shaped Curve Through Center ── */}
      {/* Represents seamless synchronization between patient, doctor, and queue */}
      <path
        d="M 26 10 C 18.5 9 13.5 15.5 19.5 20 C 25.5 24.5 21.5 31 14 30"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic S-curve pulse terminal accents */}
      <circle cx="26" cy="10" r="1.6" fill="#22B8E6" />
      <circle cx="14" cy="30" r="1.6" fill="#FFFFFF" />
    </svg>
  );
}

export type LogoVariant = 'full' | 'compact' | 'icon-only';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | number;
export type LogoTheme = 'light' | 'dark' | 'auto';

export interface MediSyncLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
  asLink?: boolean;
  href?: string;
}

const SIZE_CONFIGS: Record<'sm' | 'md' | 'lg' | 'xl', { iconSize: number; wordmarkClass: string; taglineClass: string; gapClass: string; plClass: string }> = {
  sm: {
    iconSize: 24,
    wordmarkClass: 'text-[17px] leading-none',
    taglineClass: 'text-[8.5px] tracking-[0.14em]',
    gapClass: 'gap-2',
    plClass: 'pl-[32px]',
  },
  md: {
    iconSize: 32,
    wordmarkClass: 'text-[22px] leading-none',
    taglineClass: 'text-[9.5px] tracking-[0.16em]',
    gapClass: 'gap-2.5',
    plClass: 'pl-[42px]',
  },
  lg: {
    iconSize: 40,
    wordmarkClass: 'text-[26px] leading-none',
    taglineClass: 'text-[11px] tracking-[0.18em]',
    gapClass: 'gap-3',
    plClass: 'pl-[52px]',
  },
  xl: {
    iconSize: 48,
    wordmarkClass: 'text-[32px] leading-none',
    taglineClass: 'text-[12.5px] tracking-[0.2em]',
    gapClass: 'gap-3.5',
    plClass: 'pl-[62px]',
  },
};

/**
 * Reusable, Premium MediSync Logo Component
 * 
 * Supports:
 * - full: Sync Cross + Wordmark ("Medi" Navy, "Sync" Blue) + Tagline ("Better Care. Less Waiting.")
 * - compact: Sync Cross + Wordmark ("Medi" Navy, "Sync" Blue)
 * - icon-only: Standalone Sync Cross icon
 * - Themes: light, dark, auto (adapts seamlessly to system dark mode)
 */
export function MediSyncLogo({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  className = '',
  iconClassName = '',
  onClick,
  asLink = true,
  href = '/',
}: MediSyncLogoProps) {
  // Determine sizes
  const isNamedSize = typeof size === 'string' && size in SIZE_CONFIGS;
  const config = isNamedSize ? SIZE_CONFIGS[size as 'sm' | 'md' | 'lg' | 'xl'] : SIZE_CONFIGS.md;
  const actualIconSize = typeof size === 'number' ? size : config.iconSize;

  // Wordmark & Tagline Brand Styling:
  // "Medi" is explicitly deep navy (#102747) as approved in the MediSync brand identity.
  // Explicit styling guarantees "Medi" is dark and prominently legible everywhere.
  const isDarkExplicit = theme === 'dark';

  const mediStyle: React.CSSProperties = {
    color: isDarkExplicit ? '#F8FAFC' : '#102747',
  };

  const syncStyle: React.CSSProperties = {
    color: '#1677F2',
  };

  const taglineStyle: React.CSSProperties = {
    color: isDarkExplicit ? '#94A3B8' : '#64748B',
  };

  const content = (
    <div className={`inline-flex flex-col group select-none ${className}`}>
      {/* Top Row: Icon + Wordmark */}
      <div className={`flex items-center ${config.gapClass}`}>
        <MediSyncIcon
          size={actualIconSize}
          className={`group-hover:scale-105 transition-transform duration-300 ${iconClassName}`}
        />

        {variant !== 'icon-only' && (
          <span
            className={`font-heading font-bold tracking-tight mt-0.5 select-none ${config.wordmarkClass}`}
          >
            <span
              style={mediStyle}
              className="text-[#102747] font-bold"
            >
              Medi
            </span>
            <span
              style={syncStyle}
              className="text-[#1677F2] font-bold"
            >
              Sync
            </span>
          </span>
        )}
      </div>

      {/* Bottom Row: Tagline (Only in 'full' variant) */}
      {variant === 'full' && (
        <div
          style={taglineStyle}
          className={`uppercase font-semibold mt-1 tracking-wider ${config.plClass} ${config.taglineClass}`}
        >
          Better Care. Less Waiting.
        </div>
      )}
    </div>
  );

  if (asLink && href) {
    return (
      <Link
        to={href}
        onClick={onClick}
        className="inline-block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677F2] rounded-lg"
        aria-label="MediSync - Better Care. Less Waiting. Home"
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677F2] rounded-lg text-left"
        aria-label="MediSync"
      >
        {content}
      </button>
    );
  }

  return content;
}

/**
 * Dedicated Compact Shortcut
 */
export function MediSyncLogoCompact(props: Omit<MediSyncLogoProps, 'variant'>) {
  return <MediSyncLogo variant="compact" {...props} />;
}
