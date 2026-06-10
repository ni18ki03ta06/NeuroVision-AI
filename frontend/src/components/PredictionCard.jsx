import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

export default function PredictionCard({ 
  tumorType, 
  severityClass, 
  riskLevel, 
  description, 
  modality 
}) {
  const getRiskDetails = (level) => {
    switch (level) {
      case 'high':
        return { label: 'High Risk', class: 'risk-tag-high', icon: <AlertCircle size={16} /> };
      case 'medium':
        return { label: 'Medium Risk', class: 'risk-tag-medium', icon: <AlertTriangle size={16} /> };
      case 'low':
        return { label: 'Low Risk', class: 'risk-tag-low', icon: <Check size={16} /> };
      default:
        return { label: 'No Risk', class: 'risk-tag-none', icon: <ShieldCheck size={16} /> };
    }
  };

  const risk = getRiskDetails(riskLevel);

  return (
    <div className={`result-card result-card-${riskLevel}`}>
      <div className="result-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="result-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {risk.icon} {tumorType} Detected
          </div>
          <div className="result-sub">
            Subtype: <strong>{severityClass}</strong> • Sequence Modality: <strong>{modality}</strong>
          </div>
        </div>
        <span className={`risk-tag ${risk.class}`}>
          {risk.label}
        </span>
      </div>
      <div className="result-desc">
        {description}
      </div>
    </div>
  );
}
