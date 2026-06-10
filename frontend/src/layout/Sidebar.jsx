import React from 'react';
import { Home, ScanFace, BarChart3, BookOpen, Users, BrainCircuit } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'home', label: 'Dashboard Home', icon: <Home size={16} /> },
    { id: 'analyze', label: 'MRI Analysis', icon: <ScanFace size={16} /> },
    { id: 'results', label: 'Performance Metrics', icon: <BarChart3 size={16} /> },
    { id: 'docs', label: 'Methodology Docs', icon: <BookOpen size={16} /> },
    { id: 'about', label: 'Team Info', icon: <Users size={16} /> }
  ];

  return (
    <div className="glass-card" style={{ width: '240px', padding: '20px 14px', height: 'fit-content', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', margin: '0' }}>
      
      {/* Console Section Label */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-bright)', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
          <BrainCircuit size={16} style={{ color: 'var(--primary-accent)' }} />
          <span>NeuroVision Console</span>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>v1.0.0 (FastAPI-React)</p>
      </div>

      <hr className="divider" style={{ margin: '0' }} />

      {/* Menu Switchers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
