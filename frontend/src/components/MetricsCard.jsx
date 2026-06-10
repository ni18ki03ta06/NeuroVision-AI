import React from 'react';
import { Target, Award, ArrowUpRight, BarChart3 } from 'lucide-react';

export default function MetricsCard({ accuracy, precision, recall, f1Score }) {
  const cards = [
    { title: "Accuracy", value: `${(accuracy * 100).toFixed(1)}%`, desc: "Correct vs. Total predictions", icon: <Target size={18} style={{ color: '#4ade80' }} /> },
    { title: "Precision", value: `${(precision * 100).toFixed(1)}%`, desc: "Positive predictive value", icon: <ArrowUpRight size={18} style={{ color: '#a78bfa' }} /> },
    { title: "Recall (Sensitivity)", value: `${(recall * 100).toFixed(1)}%`, desc: "True positive mapping rate", icon: <Award size={18} style={{ color: '#fb923c' }} /> },
    { title: "F1-Score", value: `${(f1Score * 100).toFixed(1)}%`, desc: "Harmonic mean of both values", icon: <BarChart3 size={18} style={{ color: 'var(--primary-accent)' }} /> }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', width: '100%' }}>
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="glass-card" 
          style={{ 
            padding: '20px', 
            border: '1px solid var(--border-color)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            margin: '0' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {card.title}
            </span>
            {card.icon}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-bright)' }}>
            {card.value}
          </div>
          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {card.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
