import React from 'react';
import { Home, ScanFace, BarChart3, BookOpen, Users, Brain, History, Activity } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, apiStatus }) {
  const menuItems = [
    { id: 'home', label: 'Dashboard Home', icon: <Home size={16} /> },
    { id: 'analyze', label: 'MRI Analysis', icon: <ScanFace size={16} /> },
    { id: 'history', label: 'Case History', icon: <History size={16} /> },
    { id: 'results', label: 'Performance Metrics', icon: <BarChart3 size={16} /> },
    { id: 'docs', label: 'Methodology Docs', icon: <BookOpen size={16} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Brand Logo */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 2px' }} 
        onClick={() => setActiveTab('home')}
      >
        <Brain size={26} style={{ color: 'var(--primary-accent)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-bright)' }}>
          NeuroVision <span style={{ color: 'var(--primary-accent)', fontSize: '11px', verticalAlign: 'super' }}>AI</span>
        </span>
      </div>

      {/* Health Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '2px', marginTop: '-8px' }}>
        <Activity size={12} style={{ color: apiStatus ? '#4ade80' : '#f87171' }} />
        <span>{apiStatus ? 'API Connected' : 'Connecting API...'}</span>
      </div>

      <hr className="divider" style={{ margin: '4px 0 0 0' }} />

      {/* Menu Switchers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                borderRadius: '8px',
                color: isActive ? 'var(--primary-accent)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
