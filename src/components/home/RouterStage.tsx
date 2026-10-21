"use client";

const LINK = { x: 70, y: 150 };
const AVATARS = [
  { x: 300, y: 80 },
  { x: 300, y: 150 },
  { x: 300, y: 220 },
] as const;

export default function RouterStage({
  names,
  link,
  click,
  fresh,
  assigned,
  desk,
  aria,
}: {
  names: readonly string[];
  link: string;
  click: string;
  fresh: string;
  assigned: string;
  desk: string;
  aria: string;
}) {
  return (
    <div className="rd-stage" role="img" aria-label={aria}>
      <svg viewBox="0 0 400 300" className="rd-svg" aria-hidden style={{ direction: "ltr" }}>
        <defs>
          <filter id="rd-neon" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="rd-surface" cx="30%" cy="20%" r="90%">
            <stop offset="0%" stopColor="#102018" />
            <stop offset="100%" stopColor="#0a0f0a" />
          </radialGradient>
          <linearGradient id="rd-token" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9ad7ff" />
            <stop offset="100%" stopColor="#25d366" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="397" height="297" rx="28" fill="url(#rd-surface)" />
        <rect x="1.5" y="1.5" width="397" height="297" rx="28" fill="none" stroke="#25d366" strokeWidth="1.6" filter="url(#rd-neon)" />
        {AVATARS.map((a, i) => (
          <line key={`wire-${i}`} x1={LINK.x + 22} y1={LINK.y} x2={a.x - 24} y2={a.y} stroke="rgba(37,211,102,0.4)" strokeWidth="1.2" className="rd-wire" />
        ))}
        <circle cx={LINK.x} cy={LINK.y} r="22" fill="none" stroke="rgba(37,211,102,0.55)" strokeWidth="1.5" className="rd-pulse" />
        <circle cx={LINK.x} cy={LINK.y} r="20" fill="rgba(37,211,102,0.14)" stroke="#25d366" strokeWidth="1.5" />
        <g transform={`translate(${LINK.x - 9} ${LINK.y - 9}) scale(0.75)`} fill="none" stroke="#d4ecff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </g>
        <text x={LINK.x} y={LINK.y + 40} textAnchor="middle" fontSize="11" fontWeight="700" fill="#c5d7cc">{link}</text>
        <text x={LINK.x} y={LINK.y - 32} textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="1.4" fill="#25d366">{click}</text>
        {AVATARS.map((a, i) => (
          <g key={`avatar-${i}`}>
            <circle cx={a.x} cy={a.y} r="26" fill="none" stroke="#25d366" strokeWidth="1.5" className={`rd-avatar-ring rd-avatar-ring-${i + 1}`} filter="url(#rd-neon)" />
            <circle cx={a.x} cy={a.y} r="20" fill="#102033" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <circle cx={a.x} cy={a.y - 5} r="6.5" fill="rgba(184,255,212,0.7)" />
            <path d={`M ${a.x - 11} ${a.y + 13} a 11 11 0 0 1 22 0`} fill="rgba(184,255,212,0.35)" />
            <text x={a.x + 32} y={a.y + 4} fontSize="12" fontWeight="700" fill="#f3faf6">{names[i]}</text>
          </g>
        ))}
        {AVATARS.map((_, i) => (
          <circle key={`token-${i}`} cx={LINK.x} cy={LINK.y} r="6" fill="url(#rd-token)" filter="url(#rd-neon)" className={`rd-token rd-token-${i + 1}`} />
        ))}
        {AVATARS.map((_, i) => (
          <g key={`card-${i}`} className={`rd-card rd-card-${i + 1}`}>
            <rect x="108" y="238" width="214" height="46" rx="14" fill="#102033" stroke="rgba(37,211,102,0.45)" strokeWidth="1" />
            <rect x="118" y="248" width="26" height="26" rx="8" fill="rgba(37,211,102,0.16)" />
            <path d="M125 261h12M125 256h12M125 266h7" stroke="#25d366" strokeWidth="1.6" strokeLinecap="round" />
            <text x="154" y="258" fontSize="11" fontWeight="800" fill="#f3faf6">{fresh}</text>
            <text x="154" y="272" fontSize="10" fill="#8ea4c0">{assigned} <tspan fill="#25d366" fontWeight="800">{names[i]}</tspan></text>
            <circle cx="308" cy="261" r="3.5" fill="#25d366" />
          </g>
        ))}
        <text x="386" y="24" textAnchor="end" fontSize="10" fontWeight="800" letterSpacing="1.6" fill="rgba(37,211,102,0.85)">{desk}</text>
      </svg>
    </div>
  );
}
