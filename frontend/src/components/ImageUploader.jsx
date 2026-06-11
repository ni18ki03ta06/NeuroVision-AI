import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, X } from 'lucide-react';

export default function ImageUploader({ onFileSelected, disabled }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    fileInputRef.current.click();
  };

  const triggerAnalyze = (e) => {
    e.stopPropagation();
    if (selectedFile) {
      onFileSelected(selectedFile);
      // Reset local state after sending it upwards
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div 
      className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Upload Brain MRI Scan slice. Press Enter or Space to select files, or drag and drop image files."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onButtonClick(e);
        }
      }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      style={{ 
        opacity: disabled ? 0.6 : 1, 
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: previewUrl ? '15px' : '30px 20px',
        borderStyle: previewUrl ? 'solid' : 'dashed'
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
      />

      {!previewUrl ? (
        <>
          <div className="dropzone-icon">
            <Upload size={28} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#e6edf3', fontSize: '13px' }}>
              Upload Brain MRI Scan(s)
            </p>
            <p style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
              Drag & drop T1, T1C+, or T2 scans
            </p>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          {/* Preview Image */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1.8', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img 
              src={previewUrl} 
              alt="Scan upload preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button 
              onClick={clearSelection}
              aria-label="Clear selected file"
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(7, 9, 14, 0.75)', border: '1px solid var(--border-color)', color: '#fff', padding: '4px', borderRadius: '50%', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontSize: '11px', color: 'var(--text-muted)' }}>
            <FileImage size={14} style={{ color: 'var(--primary-accent)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }} title={selectedFile.name}>
              {selectedFile.name}
            </span>
          </div>

          <button 
            onClick={triggerAnalyze} 
            disabled={disabled}
            className="primary-btn" 
            style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
          >
            Run Diagnostic Inference
          </button>
        </div>
      )}
    </div>
  );
}
