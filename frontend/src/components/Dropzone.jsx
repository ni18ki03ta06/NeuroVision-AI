import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export default function Dropzone({ onFileSelected, disabled }) {
  const [isDragActive, setIsDragActive] = useState(false);
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (disabled) return;
    fileInputRef.current.click();
  };

  return (
    <div 
      className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="dropzone-icon">
        <Upload size={32} />
      </div>
      <div>
        <p style={{ fontWeight: 600, color: '#e6edf3', fontSize: '13px' }}>
          Upload Brain MRI Scan(s)
        </p>
        <p style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
          Drag & drop T1, T1C+, or T2 scans — max 10 MB
        </p>
      </div>
    </div>
  );
}
