import React from 'react';
import { 
  Radar, 
  RadarChart as RechartsRadar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

export default function RadarChart({ data }) {
  // Map internal keys to clinician-friendly labels
  const labelMap = {
    'glioma': 'Glioma',
    'meningioma': 'Meningioma',
    'neurocitoma': 'Neurocytoma',
    'schwannoma': 'Schwannoma',
    'outros': 'Other Lesion',
    'normal': 'Normal'
  };

  // Format confidences dictionary into Recharts array structure
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1),
    value: value,
  }));

  return (
    <div style={{ width: '100%', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#8b949e', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Stage 2 — Multi-class Similarity Radar
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#8b949e', fontSize: 9, fontWeight: 500 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: '#8b949e', fontSize: 8 }}
            stroke="#30363d"
          />
          <Radar
            name="Similarity Score"
            dataKey="value"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
