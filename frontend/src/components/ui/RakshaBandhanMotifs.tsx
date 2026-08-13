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

// A larger, illustrated centerpiece — a gift box wrapped in a rakhi thread —
// built as one composition of independently-animated <g> groups (see the
// rb2-* classes in globals.css) rather than another small line-icon, so the
// homepage promo section reads as its own designed moment instead of a
// smaller repeat of the /combo page's hero motifs.
export function GiftBoxIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" fill="none" className={className} role="img" aria-label="A gift box wrapped with a Raksha Bandhan rakhi thread">
      <defs>
        <linearGradient id="rb2-box-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3C48A" />
          <stop offset="100%" stopColor="#A8823D" />
        </linearGradient>
        <linearGradient id="rb2-lid-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3DBA3" />
          <stop offset="100%" stopColor="#C9A66B" />
        </linearGradient>
        <radialGradient id="rb2-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE8B0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFE8B0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft glow behind everything */}
      <circle className="rb2-glow" cx="160" cy="175" r="118" fill="url(#rb2-glow-grad)" />

      {/* slow-rotating rangoli ring */}
      <g className="rb2-ring-rotate" style={{ transformOrigin: '160px 168px' }}>
        <circle cx="160" cy="168" r="128" stroke="#C9A66B" strokeWidth="1" strokeDasharray="1 9" opacity="0.55" />
        <circle cx="160" cy="168" r="104" stroke="#9C2B3B" strokeWidth="1" strokeDasharray="10 14" opacity="0.3" />
      </g>

      {/* dangling rakhi thread, off to the left of the box */}
      <g className="rb2-rakhi-swing" style={{ transformOrigin: '58px 150px' }}>
        <line x1="58" y1="150" x2="58" y2="188" stroke="#9C2B3B" strokeWidth="2" opacity="0.7" />
        <circle cx="58" cy="150" r="24" stroke="#9C2B3B" strokeWidth="3" strokeDasharray="3 5" fill="none" />
        <circle cx="58" cy="126" r="4.5" fill="#E8B4BC" />
        <circle cx="79" cy="150" r="4" fill="#FFE8B0" />
        <circle cx="58" cy="174" r="4" fill="#C9A66B" />
        <path d="M58 188 L51 200 L58 212 L65 200 Z" fill="#9C2B3B" opacity="0.9" />
        <circle cx="58" cy="200" r="3.2" fill="#FFE8B0" />
      </g>

      {/* a small floating jewellery ring, tying the illustration to the brand */}
      <g className="rb2-float-ring" style={{ transformOrigin: '258px 118px' }}>
        <ellipse cx="258" cy="122" rx="15" ry="11" stroke="#A8823D" strokeWidth="3.5" fill="none" />
        <path d="M258 108 L252 100 L264 100 Z" fill="#9C2B3B" />
      </g>

      {/* the gift box itself */}
      <g className="rb2-box-float">
        <rect x="90" y="176" width="140" height="94" rx="8" fill="url(#rb2-box-grad)" />
        <rect x="90" y="176" width="140" height="94" rx="8" stroke="#7A5E2E" strokeOpacity="0.25" strokeWidth="1" />
        <rect x="78" y="152" width="164" height="28" rx="7" fill="url(#rb2-lid-grad)" />
        <rect x="78" y="152" width="164" height="28" rx="7" stroke="#7A5E2E" strokeOpacity="0.2" strokeWidth="1" />

        {/* ribbon straps */}
        <rect x="149" y="152" width="22" height="118" fill="#9C2B3B" opacity="0.92" />
        <rect x="78" y="158" width="164" height="15" fill="#9C2B3B" opacity="0.92" />

        {/* bow */}
        <g className="rb2-bow-sway" style={{ transformOrigin: '160px 150px' }}>
          <ellipse cx="140" cy="146" rx="20" ry="14" fill="#B5334A" transform="rotate(-28 140 146)" />
          <ellipse cx="180" cy="146" rx="20" ry="14" fill="#B5334A" transform="rotate(28 180 146)" />
          <path d="M160 150 L148 172 L160 166 L172 172 Z" fill="#9C2B3B" />
          <circle cx="160" cy="150" r="9" fill="#D8455F" />
        </g>
      </g>

      {/* sparkles */}
      {[
        { x: 96, y: 118, s: 7, d: '0s' },
        { x: 222, y: 96, s: 5, d: '.6s' },
        { x: 236, y: 200, s: 6, d: '1.1s' },
        { x: 70, y: 232, s: 5, d: '.3s' },
      ].map((sp, i) => (
        <path
          key={i}
          className="rb2-sparkle"
          style={{ transformOrigin: `${sp.x}px ${sp.y}px`, animationDelay: sp.d }}
          d={`M${sp.x} ${sp.y - sp.s} L${sp.x + sp.s * 0.28} ${sp.y - sp.s * 0.28} L${sp.x + sp.s} ${sp.y} L${sp.x + sp.s * 0.28} ${sp.y + sp.s * 0.28} L${sp.x} ${sp.y + sp.s} L${sp.x - sp.s * 0.28} ${sp.y + sp.s * 0.28} L${sp.x - sp.s} ${sp.y} L${sp.x - sp.s * 0.28} ${sp.y - sp.s * 0.28} Z`}
          fill="#FFE8B0"
        />
      ))}
    </svg>
  );
}
