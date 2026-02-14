import React from 'react';

/**
 * Logic Looper SVG logo: Two interlocking circles representing "Logic" and "Loops"
 * Minimalist, geometric design using Electric Cyan (#7752FE).
 */
export default function Logo({ size = 32, className = '' }) {
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
            {/* Left circle */}
            <circle
                cx="22"
                cy="32"
                r="16"
                stroke="#7752FE"
                strokeWidth="3.5"
                fill="none"
                opacity="0.9"
            />
            {/* Right circle (interlocking) */}
            <circle
                cx="42"
                cy="32"
                r="16"
                stroke="#7752FE"
                strokeWidth="3.5"
                fill="none"
                opacity="0.9"
            />
            {/* Intersection accent — subtle fill at the overlap */}
            <path
                d="M32 19.07 C28.06 22.14 25.5 26.77 25.5 32 C25.5 37.23 28.06 41.86 32 44.93 C35.94 41.86 38.5 37.23 38.5 32 C38.5 26.77 35.94 22.14 32 19.07Z"
                fill="#7752FE"
                opacity="0.18"
            />
        </svg>
    );
}

/**
 * Inline SVG string for use in favicon and other non-React contexts.
 */
export const logoSvgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='22' cy='32' r='16' stroke='%230AC4E0' stroke-width='3.5' fill='none'/><circle cx='42' cy='32' r='16' stroke='%230AC4E0' stroke-width='3.5' fill='none'/><path d='M32 19.07C28.06 22.14 25.5 26.77 25.5 32C25.5 37.23 28.06 41.86 32 44.93C35.94 41.86 38.5 37.23 38.5 32C38.5 26.77 35.94 22.14 32 19.07Z' fill='%230AC4E0' opacity='.18'/></svg>`;
