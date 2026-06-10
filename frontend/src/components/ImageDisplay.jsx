import React from 'react';

export default function ImageDisplay({ 
  originalImage, 
  heatmaps, 
  selectedColormap, 
  setSelectedColormap, 
  opacity, 
  setOpacity 
}) {
  const colormaps = ['jet', 'hot', 'viridis', 'plasma', 'inferno', 'magma'];
  const activeHeatmap = heatmaps[selectedColormap] || heatmaps['jet'];

  return (
    <div className="glass-card">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', marginBottom: '15px' }}>
        
        {/* Blending Opacity Control */}
        <div className="control-group">
          <div className="control-label-wrapper">
            <span className="control-label">Overlay Opacity Blend</span>
            <span className="control-value">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            title="Slide to blend between original MRI and GradCAM activations"
          />
        </div>

        {/* Colormap Select Control */}
        <div className="control-group">
          <div className="control-label-wrapper">
            <span className="control-label">Contrast Colormap</span>
          </div>
          <select
            className="custom-select"
            value={selectedColormap}
            onChange={(e) => setSelectedColormap(e.target.value)}
          >
            {colormaps.map((cm) => (
              <option key={cm} value={cm}>
                {cm.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Layered Image Blending Canvas */}
      <div className="image-blend-wrapper">
        <img 
          src={originalImage} 
          alt="Original Brain MRI Scan" 
          className="mri-layer"
        />
        <img 
          src={activeHeatmap} 
          alt="GradCAM Heatmap Overlay" 
          className="heatmap-layer"
          style={{ opacity: opacity }}
        />
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#8b949e', marginTop: '10px' }}>
        MRI & GradCAM Overlay ({selectedColormap.toUpperCase()} colormap | Opacity: {Math.round(opacity * 100)}%)
      </div>
    </div>
  );
}
