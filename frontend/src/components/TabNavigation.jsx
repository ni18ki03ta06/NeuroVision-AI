import React from 'react';

export default function TabNavigation({ tabs, activeTab, setActiveTab, style }) {
  return (
    <div 
      style={{ 
        display: 'flex', 
        gap: '6px', 
        background: 'rgba(7, 9, 14, 0.4)', 
        padding: '4px', 
        borderRadius: '8px', 
        border: '1px solid var(--border-color)',
        width: 'fit-content',
        ...style 
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              background: isActive ? 'var(--primary-color)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
