import React from 'react';

export default function GaugeChart({ value, label }) {
  // SVG gauge constants
  const radius = 65;
  const circ = 2 * Math.PI * radius; // ~408.4
  const arcLength = circ / 2; // Semi-circle = 204.2
  
  // Calculate stroke offset
  const pct = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = arcLength - (pct / 100) * arcLength;

  // Determine gradient stop colors based on risk/confidence levels
  let zoneColor = '#a78bfa'; // Default violet
  if (value < 50) zoneColor = '#f87171'; // Red
  else if (value < 75) zoneColor = '#fb923c'; // Orange
  else zoneColor = '#4ade80'; // Green

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '170px' }}>
      <svg width="220" height="135" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
        <defs>
          {/* Neon Purple Gradient for the Gauge Bar */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor={zoneColor} />
          </linearGradient>
          {/* Backdrop Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Gauge Background Track */}
        <circle
          cx="100"
          cy="95"
          r={radius}
          fill="none"
          stroke="#161b22"
          strokeWidth="12"
          strokeDasharray={`${arcLength} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-180 100 95)"
        />

        {/* Segmented Color Threshold Indicators (Subtle backglow dots) */}
        <circle cx="35" cy="95" r="3" fill="#f87171" opacity="0.3" /> {/* 0% Marker */}
        <circle cx="100" cy="30" r="3" fill="#fb923c" opacity="0.3" /> {/* 50% Marker */}
        <circle cx="165" cy="95" r="3" fill="#4ade80" opacity="0.3" /> {/* 100% Marker */}

        {/* Active Confidence Progress Path */}
        <circle
          cx="100"
          cy="95"
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeDasharray={`${arcLength} ${circ}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#glow)"
          transform="rotate(-180 100 95)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Text Details Inside Arc */}
        <text x="100" y="80" textAnchor="middle" fill="#8b949e" style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Stage 1 Confidence
        </text>
        <text x="100" y="102" textAnchor="middle" fill="#ffffff" style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          {value}%
        </text>
      </svg>
      
      {/* Active Subtitle */}
      <div style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 600, marginTop: '-12px', fontFamily: 'var(--font-display)' }}>
        {label.toUpperCase()} DETECTED
      </div>
    </div>
  );
}
