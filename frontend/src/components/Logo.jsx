import React from 'react';

/**
 * Logic Looper SVG logo: Two interlocking circles — duotone brand colors.
 */
export default function Logo({ size = 32, className = '' }) {
  const id = 'logo-grad';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logic Looper logo"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#414BEA" />
          <stop offset="100%" stopColor="#0AC4E0" />
        </linearGradient>
      </defs>
      {/* Left circle — brand purple */}
      <circle cx="22" cy="32" r="16" stroke="#7752FE" strokeWidth="3.5" fill="none" opacity="0.95" />
      {/* Right circle — brand blue→cyan gradient */}
      <circle cx="42" cy="32" r="16" stroke={`url(#${id})`} strokeWidth="3.5" fill="none" opacity="0.95" />
      {/* Intersection fill — duotone blend */}
      <path
        d="M32 19.07C28.06 22.14 25.5 26.77 25.5 32C25.5 37.23 28.06 41.86 32 44.93C35.94 41.86 38.5 37.23 38.5 32C38.5 26.77 35.94 22.14 32 19.07Z"
        fill={`url(#${id})`}
        opacity="0.3"
      />
    </svg>
  );
}

export const logoSvgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='22' cy='32' r='16' stroke='%237752FE' stroke-width='3.5' fill='none'/><circle cx='42' cy='32' r='16' stroke='%23414BEA' stroke-width='3.5' fill='none'/><path d='M32 19.07C28.06 22.14 25.5 26.77 25.5 32C25.5 37.23 28.06 41.86 32 44.93C35.94 41.86 38.5 37.23 38.5 32C38.5 26.77 35.94 22.14 32 19.07Z' fill='%23414BEA' opacity='.25'/></svg>`;
