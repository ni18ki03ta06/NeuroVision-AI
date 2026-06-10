import React from 'react';

export default function ConfidenceBar({ label, value, color = 'var(--primary-color)' }) {
  const roundedVal = Math.round(value * 10) / 10;
  
  // Decide track color based on confidence level if not overridden
  const activeColor = value > 75 
    ? '#4ade80' // Green
    : value > 50 
      ? '#fb923c' // Orange
      : '#f87171'; // Red

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
        <span style={{ color: 'var(--text-bright)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{roundedVal}%</span>
      </div>
      
      {/* Outer track */}
      <div style={{ width: '100%', height: '6px', background: 'rgba(33, 38, 45, 0.8)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {/* Inner fill progress */}
        <div 
          style={{ 
            width: `${value}%`, 
            height: '100%', 
            background: activeColor, 
            borderRadius: '4px',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      </div>
    </div>
  );
}
