import React from 'react';
import { Brain, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus }) {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'analyze', label: 'Analysis' },
    { id: 'results', label: 'Performance' },
    { id: 'docs', label: 'Methodology' },
    { id: 'about', label: 'Team Info' }
  ];

  return (
    <nav className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', margin: '0 0 20px 0', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
        <Brain size={24} style={{ color: 'var(--primary-accent)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)' }}>
          NeuroVision <span style={{ color: 'var(--primary-accent)', fontSize: '12px', verticalAlign: 'super' }}>AI</span>
        </span>
      </div>

      {/* Horizontal Navigation Links */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--primary-glow)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--primary-border)' : '1px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-accent)' : 'var(--text-muted)',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Health Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <Activity size={12} style={{ color: apiStatus ? '#4ade80' : '#f87171' }} />
        <span>{apiStatus ? 'API Connected' : 'Connecting API...'}</span>
      </div>
    </nav>
  );
}
