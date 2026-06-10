import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileImage, X, ShieldAlert, Check, RefreshCw, FileText, Save, Loader2, Info } from 'lucide-react';
import { uploadMRI, generatePDFReport } from '../services/api';
import ConfidenceBar from '../components/ConfidenceBar';

export default function AnalysisPage() {
  const fileInputRef = useRef(null);

  // Input file & preview states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Settings states
  const [modality, setModality] = useState("Auto-detect");
  const [confThreshold, setConfThreshold] = useState(70);

  // API loading & result states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // UI adjustments
  const [selectedColormap, setSelectedColormap] = useState("jet");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Physician metadata for PDF
  const [patientId, setPatientId] = useState("P-1042");
  const [notes, setNotes] = useState("Lesion boundaries visible under TTA. Strong localization markers present in the feature block.");
  const [physician, setPhysician] = useState("Dr. Sarah Jenkins");

  // File drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnalyzing) return;
    
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
    if (isAnalyzing) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.value && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or WEBP scan.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10 MB limit. Please optimize the MRI slice size.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Run predictions
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await uploadMRI(selectedFile, modality);
      setResult(response);
    } catch (err) {
      setError(err.message || "An error occurred during inference. Please check backend connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setSaveSuccess(false);
  };

  // Compile and download report
  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    setError(null);

    try {
      const heatmapBase64 = result.heatmaps[selectedColormap] || result.gradcam_heatmap;
      const payload = {
        result: {
          tumor_type: result.tumor_type,
          severity_class: result.severity_class,
          risk_label: result.risk_label,
          stage1_top_pct: result.stage1_top_pct,
          modality: result.modality,
          stage1_confidences: result.stage1_confidences,
          stage2_confidences: result.stage2_confidences
        },
        original_image: result.original_image,
        gradcam_heatmap: heatmapBase64,
        patient_name: patientId,
        ref_id: `CASE-${Date.now().toString().slice(-6)}`,
        physician: physician,
        notes: notes,
        signature: physician
      };

      const pdfBlob = await generatePDFReport(payload);
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `neurovision_report_${patientId}.pdf`;
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

  // Save results locally to simulate dashboard saving
  const handleSaveResults = () => {
    if (!result) return;
    try {
      const savedList = JSON.parse(localStorage.getItem('neurovision_saved') || '[]');
      const newRecord = {
        id: `CASE-${Date.now().toString().slice(-6)}`,
        patientId,
        tumorType: result.tumor_type,
        severityClass: result.severity_class,
        riskLevel: result.risk_level,
        topConfidence: result.stage1_top_pct,
        date: new Date().toLocaleString()
      };
      savedList.unshift(newRecord);
      localStorage.setItem('neurovision_saved', JSON.stringify(savedList));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError("Failed to save results locally.");
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-950/40 border-red-800/60';
      case 'medium': return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'low': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      default: return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    }
  };

  const colormaps = ['jet', 'hot', 'viridis', 'plasma', 'inferno', 'magma'];

  // ── Render loading state ───────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-300">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <div className="text-center flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-white">Running 2-Stage Neural Network Inference</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Applying 8x Test-Time Augmentation (TTA) views and extracting last-layer activation gradients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-slate-200">
      
      {/* Error message card */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-400 p-4 rounded-xl text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result ? (
        /* ── 1 & 2. Upload and Settings Panel Layout ─────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left panel: File Uploader */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              MRI File Upload
            </h3>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[300px] ${
                isDragActive 
                  ? 'border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10' 
                  : 'border-slate-800 bg-slate-900/30 hover:border-violet-500/50 hover:bg-violet-600/5'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
              />

              {!previewUrl ? (
                <>
                  <Upload className="w-10 h-10 text-violet-400 animate-pulse" />
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-white">
                      Drag & Drop MRI scan slice
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports JPEG, PNG, or WEBP formats (Max 10 MB)
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-full max-h-[200px] rounded-lg overflow-hidden border border-slate-800 bg-black">
                    <img 
                      src={previewUrl} 
                      alt="Local Upload Preview" 
                      className="w-full h-full object-contain mx-auto max-h-[200px]"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/80 border border-slate-850 hover:border-slate-700 text-white rounded-full transition-colors duration-150"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden w-full px-2 justify-center">
                    <FileImage size={14} className="text-violet-400 flex-shrink-0" />
                    <span className="truncate max-w-xs">{selectedFile.name}</span>
                  </div>
                </div>
              )}
            </div>

            {previewUrl && (
              <button
                onClick={handleAnalyze}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 transition-all duration-200 text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Analyze Scan
              </button>
            )}
          </div>

          {/* Right panel: Settings Panel */}
          <div className="flex flex-col gap-6 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md h-fit">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              Pipeline Settings
            </h3>

            {/* MRI Modality selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-slate-400">
                Sequence Modality
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Auto-detect', 'T1', 'T1C+', 'T2'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModality(m)}
                    className={`py-2 px-3 border text-xs font-semibold rounded-lg transition-all duration-150 ${
                      modality === m
                        ? 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-inner'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence threshold slider */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-400">
                  Confidence Alert Threshold
                </label>
                <span className="font-bold text-violet-400">{confThreshold}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseInt(e.target.value))}
                className="w-full accent-violet-500"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Class predictions falling below this score will trigger low-confidence validation alerts.
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* ── 3, 4, 5. Results and evaluation Layout ──────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Area (Side-by-side Images) - Col Span 7 */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
                Spatial Interpretability Maps
              </h3>
              
              {/* Colormap selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Colormap:</span>
                <select
                  value={selectedColormap}
                  onChange={(e) => setSelectedColormap(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md outline-none"
                >
                  {colormaps.map(cm => (
                    <option key={cm} value={cm}>{cm.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side Images Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              {/* Original MRI Slice */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-400 text-center font-mono">Original MRI Scan</div>
                <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                  <img 
                    src={result.original_image} 
                    alt="Original MRI" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Pure GradCAM heatmap */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-400 text-center font-mono">GradCAM Heatmap ({selectedColormap.toUpperCase()})</div>
                <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                  <img 
                    src={result.heatmaps[selectedColormap] || result.gradcam_heatmap} 
                    alt="GradCAM Overlay" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Collapsible Physician Sign-off Notes */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                Clinician Observations & approvals
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-500 font-semibold">Patient ID</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-500 font-semibold">Referring Clinician</label>
                  <input
                    type="text"
                    value={physician}
                    onChange={(e) => setPhysician(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[11px] text-slate-500 font-semibold">Clinical Recommendations</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Area (Classification & Metrics) - Col Span 5 */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              Pipeline Diagnostics
            </h3>

            {/* Main Result Card */}
            <div className={`border p-5 rounded-2xl shadow-md ${getRiskColor(result.risk_level)}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xl font-bold text-white font-display">
                    {result.tumor_type}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Grade: {result.severity_class} • Modality: {result.modality}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-md">
                  {result.risk_level} Risk
                </span>
              </div>
              <p className="text-xs leading-relaxed border-t border-slate-800/40 pt-3 text-slate-350">
                {result.description}
              </p>
              
              {/* Threshold alert */}
              {result.stage1_top_pct < confThreshold && (
                <div className="flex items-center gap-2 text-[10.5px] text-amber-400 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-lg mt-3">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Low Confidence Alert: Prediction score {result.stage1_top_pct}% is below {confThreshold}% threshold.
                  </span>
                </div>
              )}
            </div>

            {/* Confidence Tracks */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
              
              {/* Stage 1 bars */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                  Stage 1 Classifier Probability
                </h4>
                {Object.entries(result.stage1_confidences).map(([cls, val]) => (
                  <ConfidenceBar key={cls} label={cls.toUpperCase()} value={val} />
                ))}
              </div>

              {/* Stage 2 bars (rendered only if a tumor was detected) */}
              {result.tumor_type !== 'No Tumor' && (
                <div className="border-t border-slate-800/80 pt-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                    Stage 2 Severity Similarity
                  </h4>
                  {Object.entries(result.stage2_confidences).map(([cls, val]) => (
                    <ConfidenceBar key={cls} label={cls.charAt(0).toUpperCase() + cls.slice(1)} value={val} />
                  ))}
                </div>
              )}
            </div>

            {/* Save success toast banner */}
            {saveSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2 justify-center">
                <Check size={14} />
                <span>Diagnostic findings saved successfully to local database records.</span>
              </div>
            )}

            {/* Action buttons panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleReset}
                className="py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={14} />
                New Scan
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="py-2.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-violet-600/20 disabled:opacity-50 transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Compiling...
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    Report PDF
                  </>
                )}
              </button>

              <button
                onClick={handleSaveResults}
                className="py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Save size={14} />
                Save Results
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
