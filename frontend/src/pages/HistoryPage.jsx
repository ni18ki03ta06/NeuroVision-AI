import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Trash2, Eye, X, 
  Calendar, User, FileSpreadsheet, AlertTriangle, 
  CheckCircle, ShieldAlert, Activity, FileText, Loader2
} from 'lucide-react';
import { getPredictionHistory, deletePredictionHistoryItem } from '../api/predictionAPI';
import { generatePDFReport } from '../services/api';
import theme from '../theme';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-hot-toast';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTumor, setFilterTumor] = useState('All');
  const [filterModality, setFilterModality] = useState('All');
  
  // Selected case details drawer/modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [detailOpacity, setDetailOpacity] = useState(0.40);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Report form state for selected case
  const [reportPatientName, setReportPatientName] = useState('');
  const [reportPhysician, setReportPhysician] = useState('Dr. Sarah Jenkins');
  const [reportNotes, setReportNotes] = useState('MRI evaluation retrieved from archive history.');
  
  useEffect(() => {
    fetchHistory();
  }, []);
  
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPredictionHistory();
      setHistory(data);
    } catch (err) {
      setError("Failed to load prediction history. Check server connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteItem = async (id, e) => {
    e.stopPropagation(); // Prevent opening detail panel
    if (!window.confirm("Are you sure you want to permanently delete this prediction record from history?")) {
      return;
    }
    
    const toastId = toast.loading("Deleting prediction record...");
    try {
      await deletePredictionHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedCase && selectedCase.id === id) {
        setSelectedCase(null);
      }
      toast.success("Prediction record deleted successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete record: " + err.message, { id: toastId });
    }
  };
  
  const handleOpenDetail = (item) => {
    setSelectedCase(item);
    setReportPatientName(item.patient_name || 'Anonymous');
    setReportNotes(item.description || 'MRI evaluation retrieved from archive history.');
  };
  
  const handleExportPDF = async () => {
    if (!selectedCase) return;
    setIsExportingPDF(true);
    const toastId = toast.loading("Compiling clinical PDF report...");
    try {
      const payload = {
        result: {
          tumor_type: selectedCase.tumor_type,
          severity_class: selectedCase.severity_class,
          risk_level: selectedCase.risk_level,
          risk_label: selectedCase.risk_label,
          stage1_top_pct: selectedCase.stage1_top_pct,
          modality: selectedCase.modality,
          stage1_confidences: selectedCase.stage1_confidences,
          stage2_confidences: selectedCase.stage2_confidences
        },
        original_image: selectedCase.original_image,
        gradcam_heatmap: selectedCase.gradcam_heatmap,
        patient_name: reportPatientName,
        ref_id: selectedCase.ref_id || `REF-${selectedCase.id}`,
        physician: reportPhysician,
        notes: reportNotes,
        signature: reportPhysician
      };

      const pdfBlob = await generatePDFReport(payload);
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `neurovision_history_report_${selectedCase.ref_id || selectedCase.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();
      toast.success("Clinical PDF report downloaded successfully!", { id: toastId });
    } catch (err) {
      toast.error(`PDF report download failed: ${err.message}`, { id: toastId });
    } finally {
      setIsExportingPDF(false);
    }
  };
  
  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    // Define headers
    const headers = [
      "ID", "Date", "Patient Name", "Reference ID", 
      "Modality", "Tumor Type", "Severity", 
      "Risk Level", "Risk Label", "Confidence %"
    ];
    
    // Map records
    const rows = history.map(item => [
      item.id,
      item.timestamp,
      `"${item.patient_name || 'Pending'}"`,
      `"${item.ref_id || ''}"`,
      item.modality,
      `"${item.tumor_type}"`,
      `"${item.severity_class}"`,
      item.risk_level,
      `"${item.risk_label}"`,
      item.stage1_top_pct.toFixed(2)
    ]);
    
    // Compile CSV string
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "neurovision_prediction_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Prediction history exported as CSV successfully!");
  };
  
  // Filtering Logic
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      (item.patient_name && item.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.ref_id && item.ref_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tumor_type && item.tumor_type.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesTumor = filterTumor === 'All' || item.tumor_type === filterTumor;
    const matchesModality = filterModality === 'All' || item.modality === filterModality;
    
    return matchesSearch && matchesTumor && matchesModality;
  });
  
  // Calculate summary stats
  const totalScans = history.length;
  const highRiskCount = history.filter(i => i.risk_level === 'high').length;
  const tumorDetectedCount = history.filter(i => i.tumor_type !== 'No Tumor').length;
  const tumorPct = totalScans > 0 ? ((tumorDetectedCount / totalScans) * 100).toFixed(0) : 0;
  
  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case 'high': return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'medium': return { color: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' };
      default: return { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.3)' };
    }
  };

  return (
    <SkeletonTheme baseColor="#161b22" highlightColor="#21262d">
      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
            Archive Case History
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Browse, inspect, and export past MRI scans and model diagnostic predictions.
          </p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2"
            style={{
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary-accent)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '12px', borderRadius: '10px', color: '#a78bfa' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total Scans</span>
            <h4 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-bright)', margin: '4px 0 0 0' }}>
              {isLoading ? <Skeleton width={45} height={24} /> : totalScans}
            </h4>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', color: '#f87171' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>High Risk Cases</span>
            <h4 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-bright)', margin: '4px 0 0 0' }}>
              {isLoading ? <Skeleton width={45} height={24} /> : highRiskCount}
            </h4>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '10px', color: '#fbbf24' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Tumor Detection Rate</span>
            <h4 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-bright)', margin: '4px 0 0 0' }}>
              {isLoading ? <Skeleton width={45} height={24} /> : `${tumorPct}%`}
            </h4>
          </div>
        </div>

      </div>

      {/* Main Container: Search Filters and Table */}
      <div className="glass-card" style={{ border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
        
        {/* Search and Filters Section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by Patient, Ref ID, or Tumor type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-bright)',
                fontSize: '13px'
              }}
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tumor:</span>
              <select 
                value={filterTumor}
                onChange={e => setFilterTumor(e.target.value)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '12px'
                }}
              >
                <option value="All">All types</option>
                <option value="Glioma">Glioma</option>
                <option value="Meningioma">Meningioma</option>
                <option value="Pituitary">Pituitary</option>
                <option value="No Tumor">No Tumor (Healthy)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Modality:</span>
              <select 
                value={filterModality}
                onChange={e => setFilterModality(e.target.value)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '12px'
                }}
              >
                <option value="All">All modalities</option>
                <option value="T1">T1</option>
                <option value="T1C+">T1C+</option>
                <option value="T2">T2</option>
                <option value="Auto-detect">Auto-detect</option>
              </select>
            </div>

          </div>

        </div>

        {/* Database List Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Ref ID</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date/Time</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Patient ID</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Modality</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Diagnosis</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Confidence</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Risk</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={80} /></td>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={110} /></td>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={90} /></td>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={60} /></td>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={120} /></td>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={50} /></td>
                    <td style={{ padding: '12px 8px' }}><Skeleton width={70} /></td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><Skeleton width={40} /></td>
                  </tr>
                ))
              ) : error ? (
                <tr style={{ borderBottom: 'none' }}>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#f87171', fontSize: '13px' }}>
                    {error}
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr style={{ borderBottom: 'none' }}>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-bright)' }}>No prediction history found</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Run standard analysis predictions to record diagnostics.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const riskStyle = getRiskBadgeColor(item.risk_level);
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      className="hover-row"
                    >
                      <td style={{ padding: '12px 8px', color: '#a78bfa', fontWeight: 550 }}>
                        {item.ref_id || `ID-${item.id}`}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {item.timestamp}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-bright)', fontWeight: 500 }}>
                        {item.patient_name || 'Anonymous'}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                          {item.modality}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-bright)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{item.tumor_type}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.severity_class}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-bright)', fontWeight: 600 }}>
                        {item.stage1_top_pct ? `${item.stage1_top_pct.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          color: riskStyle.color, 
                          background: riskStyle.bg, 
                          border: `1px solid ${riskStyle.border}`,
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '10px',
                          fontWeight: 650,
                          textTransform: 'uppercase',
                          letterSpacing: '.02em'
                        }}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenDetail(item); }}
                          style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: '4px' }}
                          title="Open Console Inspector"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Case Details Drawer / Modal Overlay */}
      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px'
        }}>
          
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            borderRadius: '16px',
            background: 'var(--card-bg)'
          }}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Case Archive Inspector
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)' }}>
                  Ref: {selectedCase.ref_id || `ID-${selectedCase.id}`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ overflowY: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              
              {/* Left Column: Image Blending display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.05em' }}>
                  MRI & GradCAM Overlay Blend (Jet Colormap)
                </span>
                
                {/* Visualizer Frame */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  background: '#090d13',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {/* Bottom: Original MRI image */}
                  <img 
                    src={selectedCase.original_image} 
                    alt="Original MRI scan slice" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  
                  {/* Top: GradCAM activation overlay */}
                  <img 
                    src={selectedCase.gradcam_heatmap} 
                    alt="GradCAM heatmap overlay activations" 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      opacity: detailOpacity,
                      mixBlendMode: 'screen',
                      pointerEvents: 'none',
                      transition: 'opacity 0.05s linear'
                    }}
                  />
                </div>

                {/* Opacity Controller slider */}
                <div className="glass-card" style={{ padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>GradCAM Overlay Opacity</span>
                    <span style={{ color: '#a78bfa', fontWeight: 600 }}>{(detailOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={detailOpacity}
                    onChange={e => setDetailOpacity(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

              </div>

              {/* Right Column: Model predictions info and reporting */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Diagnostics Panel Card */}
                <div className="glass-card" style={{ padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Neural Network Decision
                  </span>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-bright)', fontWeight: 700 }}>
                        {selectedCase.tumor_type}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Severity: {selectedCase.severity_class}
                      </p>
                    </div>
                    
                    <span style={{
                      color: getRiskBadgeColor(selectedCase.risk_level).color,
                      background: getRiskBadgeColor(selectedCase.risk_level).bg,
                      border: `1px solid ${getRiskBadgeColor(selectedCase.risk_level).border}`,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {selectedCase.risk_label}
                    </span>
                  </div>

                  <p style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {selectedCase.description}
                  </p>
                </div>

                {/* Confidences Display List */}
                <div className="glass-card" style={{ padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Probability Confidence Distributions
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {selectedCase.stage1_confidences && Object.entries(selectedCase.stage1_confidences).map(([cls, val]) => {
                      const isTop = val === Math.max(...Object.values(selectedCase.stage1_confidences));
                      return (
                        <div key={cls}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                            <span style={{ color: isTop ? 'var(--text-bright)' : 'var(--text-muted)', fontWeight: isTop ? 600 : 450 }}>{cls}</span>
                            <span style={{ color: isTop ? '#a78bfa' : 'var(--text-muted)', fontWeight: isTop ? 700 : 500 }}>{(val * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${val * 100}%`, height: '100%', background: isTop ? 'var(--primary-accent)' : 'var(--border-color)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PDF Sign-off Form */}
                <div className="glass-card" style={{ padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Generate Physician Signed PDF
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Patient Name</label>
                      <input 
                        type="text" 
                        value={reportPatientName}
                        onChange={e => setReportPatientName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--text-bright)',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Signing Physician</label>
                      <input 
                        type="text" 
                        value={reportPhysician}
                        onChange={e => setReportPhysician(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--text-bright)',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Diagnostic Notes</label>
                    <textarea 
                      value={reportNotes}
                      onChange={e => setReportNotes(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-bright)',
                        fontSize: '12px',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <button 
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    style={{
                      background: 'var(--primary-accent)',
                      border: 'none',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {isExportingPDF ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Compiling Clinical PDF Report...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        <span>Export PDF Report</span>
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      </div>
    </SkeletonTheme>
  );
}
