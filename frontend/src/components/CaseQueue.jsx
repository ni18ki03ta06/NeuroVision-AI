import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

export default function CaseQueue({ cases, activeCaseName, onCaseSelected }) {
  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'high':
        return <AlertCircle size={14} style={{ color: '#f87171' }} />;
      case 'medium':
        return <AlertTriangle size={14} style={{ color: '#fb923c' }} />;
      case 'low':
        return <CheckCircle2 size={14} style={{ color: '#4ade80' }} />;
      case 'none':
        return <ShieldCheck size={14} style={{ color: '#4ade80' }} />;
      default:
        return <FileText size={14} style={{ color: '#8b949e' }} />;
    }
  };

  const truncate = (str, len = 18) => {
    if (str.length <= len) return str;
    return str.slice(0, len) + '...';
  };

  const caseNames = Object.keys(cases);

  if (caseNames.length === 0) {
    return (
      <div style={{ color: '#8b949e', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
        No scans in queue
      </div>
    );
  }

  return (
    <div className="queue-list">
      {caseNames.map((name) => {
        const item = cases[name];
        const res = item.result;
        const isActive = name === activeCaseName;

        return (
          <button
            key={name}
            onClick={() => onCaseSelected(name)}
            className={`queue-btn ${isActive ? 'active' : ''}`}
          >
            <span className="queue-btn-label">
              {getRiskIcon(res.risk_level)}
              <span title={name}>{truncate(name)}</span>
            </span>
            <span style={{ fontSize: '10px', color: '#8b949e', fontStyle: 'italic' }}>
              ({res.tumor_type})
            </span>
          </button>
        );
      })}
    </div>
  );
}
