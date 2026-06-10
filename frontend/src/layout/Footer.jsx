import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ marginTop: 'auto', padding: '20px 0 10px 0', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', maxWidth: '600px' }}>
        <Shield size={14} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
        <span>
          <strong>Research Disclaimer:</strong> This portal is built for demonstration purposes. Classification and severity evaluations are and should remain exploratory research outputs.
        </span>
      </div>

      {/* Developer Log */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        © 2026 NeuroVision AI • Decoupled Suite
      </div>
    </footer>
  );
}
