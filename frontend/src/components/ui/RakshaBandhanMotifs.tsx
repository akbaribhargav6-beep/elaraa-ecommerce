// Small decorative SVG motifs for the Raksha Bandhan campaign, shared between
// the /combo page, the homepage promo section, and the hero banner overlay.

export function RakhiMotif({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M32 4 C 20 14, 20 22, 32 24 C 44 22, 44 14, 32 4 Z" stroke="#FFE8B0" strokeWidth="1.4" opacity="0.85" />
      <circle cx="32" cy="34" r="13" stroke="#C9A66B" strokeWidth="1.6" opacity="0.9" />
      <circle cx="32" cy="34" r="7" fill="#C9A66B" opacity="0.35" />
      <circle cx="32" cy="34" r="3" fill="#FFE8B0" opacity="0.9" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="32"
          y1="34"
          x2={32 + 20 * Math.cos((deg * Math.PI) / 180)}
          y2={34 + 20 * Math.sin((deg * Math.PI) / 180)}
          stroke="#FFE8B0"
          strokeWidth="0.8"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}

export function MandalaRing({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="20" stroke="#FFE8B0" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.6" />
      <circle cx="24" cy="24" r="13" stroke="#C9A66B" strokeWidth="1" opacity="0.55" />
      <circle cx="24" cy="24" r="4" fill="#C9A66B" opacity="0.5" />
    </svg>
  );
}

export function FlowerMotif({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="12"
          rx="4.5"
          ry="8"
          fill="#E8B4BC"
          opacity="0.55"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3.2" fill="#FFE8B0" opacity="0.9" />
    </svg>
  );
}
