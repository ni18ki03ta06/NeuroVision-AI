import React, { useState, useEffect } from 'react';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';
import Footer from './layout/Footer';

import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import ResultsPage from './pages/ResultsPage';
import DocumentationPage from './pages/DocumentationPage';
import AboutPage from './pages/AboutPage';

import ImageUploader from './components/ImageUploader';
import CaseQueue from './components/CaseQueue';
import { uploadMRI, generatePDFReport } from './services/api';

export default function App() {
  // Navigation & API status states
  const [activeTab, setActiveTab] = useState('home');
  const [apiStatus, setApiStatus] = useState(false);

  // Global cases registry: { [filename]: { file, result } }
  const [cases, setCases] = useState({});
  const [activeCaseName, setActiveCaseName] = useState(null);
  
  // Sidebar uploader parameters
  const [modality, setModality] = useState("Auto-detect");
  const [confThreshold, setConfThreshold] = useState(70);
  
  // Active MRI overlay parameters
  const [opacity, setOpacity] = useState(0.40);
  const [selectedColormap, setSelectedColormap] = useState("jet");
  
  // API loader triggers
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Health check API on startup
  useEffect(() => {
    const apiBaseUrl = import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
    const healthUrl = apiBaseUrl.replace(/\/api\/?$/, "") + "/health";
    fetch(healthUrl)
      .then(res => {
        if (res.ok) setApiStatus(true);
      })
      .catch(() => setApiStatus(false));
  }, []);

  // Reprocess active case when MRI modality is switched globally
  useEffect(() => {
    if (activeCaseName && cases[activeCaseName]) {
      const activeCase = cases[activeCaseName];
      if (activeCase.result.modality !== modality) {
        reprocessCase(activeCaseName, activeCase.file, modality);
      }
    }
  }, [modality]);

  const handleFileUploaded = async (file) => {
    setIsAnalyzing(true);
    setError(null);
    setActiveTab('analyze'); // Route to analysis console instantly on upload
    
    try {
      const result = await uploadMRI(file, modality);
      setCases(prev => ({
        ...prev,
        [file.name]: { file, result }
      }));
      setActiveCaseName(file.name);
    } catch (err) {
      setError(err.message || "Failed to process MRI scan");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reprocessCase = async (filename, file, targetModality) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await uploadMRI(file, targetModality);
      setCases(prev => ({
        ...prev,
        [filename]: { file, result }
      }));
    } catch (err) {
      setError(`Recalculation error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportReport = async (physicianMeta) => {
    if (!activeCaseName || !cases[activeCaseName]) return;
    setIsExporting(true);
    setError(null);
    
    try {
      const activeCase = cases[activeCaseName];
      const res = activeCase.result;
      const heatmapBase64 = res.heatmaps[selectedColormap] || res.gradcam_heatmap;
      
      const payload = {
        result: {
          tumor_type: res.tumor_type,
          severity_class: res.severity_class,
          risk_label: res.risk_label,
          stage1_top_pct: res.stage1_top_pct,
          modality: res.modality,
          stage1_confidences: res.stage1_confidences,
          stage2_confidences: res.stage2_confidences
        },
        original_image: res.original_image,
        gradcam_heatmap: heatmapBase64,
        patient_name: physicianMeta.patient_name,
        ref_id: physicianMeta.ref_id,
        physician: physicianMeta.physician,
        notes: physicianMeta.notes,
        signature: physicianMeta.signature
      };

      const pdfBlob = await generatePDFReport(payload);
      
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `neurovision_${physicianMeta.ref_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();
    } catch (err) {
      setError(`PDF generation failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const activeCase = activeCaseName ? cases[activeCaseName] : null;

  return (
    <div className="app-container">
      
      {/* ── Left Sidebar Navigation Panel ───────────────────── */}
      <div className="sidebar">
        {/* Sidebar navigation links switch list */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <hr className="divider" />

        {/* Drop uploader widget with local image previews */}
        <ImageUploader onFileSelected={handleFileUploaded} disabled={isAnalyzing} />

        {error && (
          <div style={{ color: '#f87171', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {isAnalyzing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontSize: '12px', marginBottom: '16px' }}>
            <div className="spinner" />
            <span>Running predictions (TTA 8x)...</span>
          </div>
        )}

        <hr className="divider" />

        {/* Modality selectors */}
        <div className="control-group">
          <span className="section-label">MRI Modality</span>
          <div className="modality-selector">
            {['Auto-detect', 'T1', 'T1C+', 'T2'].map((m) => (
              <button
                key={m}
                onClick={() => setModality(m)}
                className={`modality-btn ${modality === m ? 'active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence threshold bar */}
        <div className="control-group">
          <div className="control-label-wrapper">
            <span className="control-label">Confidence Threshold</span>
            <span className="control-value">{confThreshold}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={confThreshold}
            onChange={(e) => setConfThreshold(parseInt(e.target.value))}
          />
        </div>

        <hr className="divider" />

        {/* Cases list queue */}
        <span className="section-label">Scan Case Queue</span>
        <CaseQueue 
          cases={cases} 
          activeCaseName={activeCaseName} 
          onCaseSelected={(name) => {
            setActiveCaseName(name);
            setActiveTab('analyze'); // Reroute to console on case select
          }} 
        />
      </div>

      {/* ── Main Dashboard Workspace ─────────────────────────── */}
      <div className="workspace">
        {/* Horizontal Navigation Header */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          apiStatus={apiStatus} 
        />

        <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Dynamic Page Router Switcher */}
          {activeTab === 'home' && <HomePage setActiveTab={setActiveTab} />}
          
          {activeTab === 'analyze' && (
            <AnalysisPage
              activeCaseName={activeCaseName}
              activeCase={activeCase}
              confThreshold={confThreshold}
              opacity={opacity}
              setOpacity={setOpacity}
              selectedColormap={selectedColormap}
              setSelectedColormap={setSelectedColormap}
              isAnalyzing={isAnalyzing}
              isExporting={isExporting}
              handleExportReport={handleExportReport}
            />
          )}

          {activeTab === 'results' && <ResultsPage />}

          {activeTab === 'docs' && <DocumentationPage />}

          {activeTab === 'about' && <AboutPage />}

          {/* Footer branding */}
          <Footer />
        </div>
      </div>

    </div>
  );
}
