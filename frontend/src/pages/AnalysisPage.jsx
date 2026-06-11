import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileImage, X, ShieldAlert, Check, RefreshCw, FileText, Save, Loader2, Info } from 'lucide-react';
import { uploadMRI, generatePDFReport, uploadMRIList, generateBatchPDFReport } from '../services/api';
import ConfidenceBar from '../components/ConfidenceBar';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { parseError } from '../utils/errorHandler';

export default function AnalysisPage({
  activeCaseName,
  activeCase,
  confThreshold: globalConfThreshold,
  opacity,
  setOpacity,
  isAnalyzing: globalIsAnalyzing,
  isExporting: globalIsExporting,
  handleExportReport,
  apiStatus,
  checkApiHealth,
  onFileUploaded
} = {}) {
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

  // Batch processing states
  const [batchItems, setBatchItems] = useState([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(null);
  const [concurrency, setConcurrency] = useState("sequential");
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const isBatchMode = batchItems.length > 0;
  const showAnalyzing = isAnalyzing || globalIsAnalyzing;
  const showExporting = isExporting || globalIsExporting;

  const [apiError, setApiError] = useState(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const lastActionRef = useRef(null);

  // Turn off demo mode if API becomes online
  useEffect(() => {
    if (apiStatus) {
      setIsDemoMode(false);
      setApiError(null);
    }
  }, [apiStatus]);

  // Synchronize with activeCase passed from App.jsx sidebar upload
  useEffect(() => {
    if (activeCase && activeCase.result) {
      setResult(activeCase.result);
      setSelectedFile(activeCase.file);
      const url = URL.createObjectURL(activeCase.file);
      setPreviewUrl(url);
      
      // Clear batch states if we've switched to a single active case
      setBatchItems([]);
      setSelectedBatchIndex(null);
    }
  }, [activeCase]);

  // Synchronize threshold from global settings
  useEffect(() => {
    if (globalConfThreshold !== undefined) {
      setConfThreshold(globalConfThreshold);
    }
  }, [globalConfThreshold]);

  // File drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (showAnalyzing || isBatchAnalyzing) return;
    
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
    if (showAnalyzing || isBatchAnalyzing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (showAnalyzing || isBatchAnalyzing) return;
    if (e.target.value && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files) => {
    if (files.length === 0) return;
    setError(null);
    setSaveSuccess(false);

    if (files.length === 1) {
      // Single scan mode
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        const msg = "Invalid file type. Please upload a JPEG, PNG, or WEBP scan.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        const msg = "File exceeds the 10 MB limit. Please optimize the MRI slice size.";
        setError(msg);
        toast.error(msg);
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
      
      // Clear batch states
      batchItems.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setBatchItems([]);
      setSelectedBatchIndex(null);
      toast.success(`Loaded scan: ${file.name}`);
    } else {
      // Batch mode
      const items = files.map((file, idx) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        let err = null;
        if (!validTypes.includes(file.type)) {
          err = "Invalid file type. Supports JPEG, PNG, or WEBP.";
          toast.error(`${file.name}: ${err}`);
        } else if (file.size > 10 * 1024 * 1024) {
          err = "Exceeds 10MB limit.";
          toast.error(`${file.name}: ${err}`);
        }
        return {
          id: `batch-item-${idx}-${Date.now()}`,
          file,
          previewUrl: URL.createObjectURL(file),
          status: err ? 'error' : 'queued',
          error: err,
          result: null,
          patientId: `P-${1000 + Math.floor(Math.random() * 9000)}`
        };
      });

      // Revoke any existing URLs
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      batchItems.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      setBatchItems(items);
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setSelectedBatchIndex(null);
      setBatchProgress(0);
      setSuccessCount(0);
      setErrorCount(items.filter(item => item.status === 'error').length);
      
      const queuedCount = items.filter(item => item.status === 'queued').length;
      if (queuedCount > 0) {
        toast.success(`Queued ${queuedCount} scans for batch analysis.`);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      batchItems.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [previewUrl, batchItems]);

  // Simulated mock analysis for Demo Mode
  const handleAnalyzeMock = () => {
    setIsAnalyzing(true);
    setApiError(null);
    setError(null);
    setSaveSuccess(false);

    setTimeout(() => {
      const tumorTypes = ["Glioma", "Meningioma", "Pituitary", "No Tumor"];
      const selectedType = tumorTypes[Math.floor(Math.random() * tumorTypes.length)];
      
      let riskLevel = "low";
      let severity = "N/A";
      let desc = "No signs of neoplastic tissue or lesion structures detected in the current slice.";
      let stage1_confidences = { glioma: 2.1, meningioma: 1.5, pituitary: 0.8, "no tumor": 95.6 };
      let stage2_confidences = {};

      if (selectedType === "Glioma") {
        riskLevel = "high";
        severity = "grade IV";
        desc = "The classifier has detected hyperintense neoplastic regions consistent with Glioma (High Grade). Recommended for urgent MRI contrast follow-up.";
        stage1_confidences = { glioma: 91.2, meningioma: 4.5, pituitary: 1.2, "no tumor": 3.1 };
        stage2_confidences = { "grade II": 5.4, "grade III": 15.6, "grade IV": 79.0 };
      } else if (selectedType === "Meningioma") {
        riskLevel = "medium";
        severity = "grade I";
        desc = "Well-defined dural-tail slice marker detected, matching classic Meningioma features. Minimal mass effect present.";
        stage1_confidences = { glioma: 6.2, meningioma: 84.8, pituitary: 3.1, "no tumor": 5.9 };
        stage2_confidences = { "grade I": 88.0, "grade II": 10.0, "grade III": 2.0 };
      } else if (selectedType === "Pituitary") {
        riskLevel = "medium";
        severity = "grade II";
        desc = "Sellar region enlargement and boundary encroachment suggestive of a Pituitary adenoma structure.";
        stage1_confidences = { glioma: 1.8, meningioma: 5.4, pituitary: 89.2, "no tumor": 3.6 };
        stage2_confidences = { "grade I": 20.0, "grade II": 75.0, "grade III": 5.0 };
      }

      const mockRes = {
        tumor_type: selectedType,
        severity_class: severity,
        risk_level: riskLevel,
        risk_label: riskLevel.toUpperCase() + " RISK",
        stage1_top_pct: Math.max(...Object.values(stage1_confidences)),
        modality: modality === "Auto-detect" ? "T2" : modality,
        description: desc,
        original_image: previewUrl || "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400",
        gradcam_heatmap: previewUrl || "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400",
        heatmaps: {
          jet: previewUrl || "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400",
          hot: previewUrl || "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400",
          viridis: previewUrl || "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400"
        },
        stage1_confidences,
        stage2_confidences
      };

      setResult(mockRes);
      setIsAnalyzing(false);
      toast.success("Simulation complete! Rendered mock inference results.");
    }, 1500);
  };

  // Run single prediction
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setApiError(null);
    setError(null);
    setSaveSuccess(false);
    lastActionRef.current = { type: 'analyze' };

    if (isDemoMode) {
      handleAnalyzeMock();
      return;
    }

    if (onFileUploaded) {
      onFileUploaded(selectedFile, modality);
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("Analyzing scan with 2-Stage pipeline...");
    try {
      const response = await uploadMRI(selectedFile, modality);
      setResult(response);
      toast.success("Analysis complete! 2-Stage neural network inference completed successfully.", { id: toastId });
    } catch (err) {
      const parsed = parseError(err, "MRI Analysis");
      parsed.technicalMessage = err.stack || err.message || String(err);
      setApiError(parsed);
      setError(parsed.message);
      toast.error(`Analysis failed: ${parsed.message}`, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulated mock analysis for Batch mode
  const handleAnalyzeBatchMock = async () => {
    const items = batchItems.map(item => {
      if (item.status === 'error') return item;
      return { ...item, status: 'queued', result: null, error: null };
    });
    setBatchItems(items);

    const pendingItems = items.filter(item => item.status === 'queued');
    if (pendingItems.length === 0) {
      setIsBatchAnalyzing(false);
      return;
    }

    let completed = 0;
    let successes = 0;
    let errors = 0;

    toast.loading(`Simulating batch analysis on ${pendingItems.length} scans...`, { duration: 3500 });

    const updateItemStatus = (id, updates) => {
      setBatchItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const processItem = async (item) => {
      updateItemStatus(item.id, { status: 'processing' });
      
      // Simulate inference time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 850));

      const tumorTypes = ["Glioma", "Meningioma", "Pituitary", "No Tumor"];
      const selectedType = tumorTypes[Math.floor(Math.random() * tumorTypes.length)];
      
      let riskLevel = "low";
      let severity = "N/A";
      let desc = "No signs of neoplastic tissue or lesion structures detected.";
      let stage1_confidences = { glioma: 2.1, meningioma: 1.5, pituitary: 0.8, "no tumor": 95.6 };
      let stage2_confidences = {};

      if (selectedType === "Glioma") {
        riskLevel = "high";
        severity = "grade IV";
        desc = "Neoplastic markers consistent with high-grade Glioma detected.";
        stage1_confidences = { glioma: 91.2, meningioma: 4.5, pituitary: 1.2, "no tumor": 3.1 };
        stage2_confidences = { "grade II": 5.4, "grade III": 15.6, "grade IV": 79.0 };
      } else if (selectedType === "Meningioma") {
        riskLevel = "medium";
        severity = "grade I";
        desc = "Dural-tail slice marker matching Meningioma features detected.";
        stage1_confidences = { glioma: 6.2, meningioma: 84.8, pituitary: 3.1, "no tumor": 5.9 };
        stage2_confidences = { "grade I": 88.0, "grade II": 10.0, "grade III": 2.0 };
      } else if (selectedType === "Pituitary") {
        riskLevel = "medium";
        severity = "grade II";
        desc = "Sellar region enlargement suggestive of a Pituitary adenoma.";
        stage1_confidences = { glioma: 1.8, meningioma: 5.4, pituitary: 89.2, "no tumor": 3.6 };
        stage2_confidences = { "grade I": 20.0, "grade II": 75.0, "grade III": 5.0 };
      }

      const mockRes = {
        tumor_type: selectedType,
        severity_class: severity,
        risk_level: riskLevel,
        risk_label: riskLevel.toUpperCase() + " RISK",
        stage1_top_pct: Math.max(...Object.values(stage1_confidences)),
        modality: modality === "Auto-detect" ? "T2" : modality,
        description: desc,
        original_image: item.previewUrl,
        gradcam_heatmap: item.previewUrl,
        heatmaps: {
          jet: item.previewUrl,
          hot: item.previewUrl,
          viridis: item.previewUrl
        },
        stage1_confidences,
        stage2_confidences
      };

      updateItemStatus(item.id, { status: 'success', result: mockRes });
      successes++;
      setSuccessCount(successes);

      // Auto-save to localStorage history
      try {
        const savedList = JSON.parse(localStorage.getItem('neurovision_saved') || '[]');
        const newRecord = {
          id: `CASE-${Date.now().toString().slice(-6)}-${item.patientId}`,
          patientId: item.patientId,
          tumorType: selectedType,
          severityClass: severity,
          riskLevel: riskLevel,
          topConfidence: mockRes.stage1_top_pct,
          date: new Date().toLocaleString()
        };
        savedList.unshift(newRecord);
        localStorage.setItem('neurovision_saved', JSON.stringify(savedList));
      } catch (e) {
        console.error("Local save failed", e);
      }

      completed++;
      setBatchProgress(Math.round((completed / pendingItems.length) * 100));
    };

    if (concurrency === 'sequential') {
      for (const item of pendingItems) {
        await processItem(item);
      }
    } else {
      // Parallel processing
      await Promise.all(pendingItems.map(item => processItem(item)));
    }

    setIsBatchAnalyzing(false);
    toast.success(`Simulated batch analysis complete! Successfully simulated ${successes} scans.`);
  };

  // Run batch predictions
  const handleAnalyzeBatch = async () => {
    if (batchItems.length === 0) return;
    setApiError(null);
    setError(null);
    lastActionRef.current = { type: 'analyze_batch' };

    if (isDemoMode) {
      handleAnalyzeBatchMock();
      return;
    }

    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setSuccessCount(0);
    setErrorCount(0);

    // Initialize status for non-error queued files
    const items = batchItems.map(item => {
      if (item.status === 'error') return item;
      return { ...item, status: 'queued', result: null, error: null };
    });
    setBatchItems(items);

    const pendingItems = items.filter(item => item.status === 'queued');
    if (pendingItems.length === 0) {
      setIsBatchAnalyzing(false);
      return;
    }

    let completed = 0;
    let successes = 0;
    let errors = 0;

    toast.loading(`Starting batch analysis on ${pendingItems.length} scans...`, { duration: 3000 });

    const updateItemStatus = (id, updates) => {
      setBatchItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const processItem = async (item) => {
      updateItemStatus(item.id, { status: 'processing' });
      try {
        const res = await uploadMRI(item.file, modality);
        updateItemStatus(item.id, { status: 'success', result: res });
        successes++;
        setSuccessCount(successes);

        // Auto-save to localStorage history to match handleSaveResults
        try {
          const savedList = JSON.parse(localStorage.getItem('neurovision_saved') || '[]');
          const newRecord = {
            id: `CASE-${Date.now().toString().slice(-6)}-${item.patientId}`,
            patientId: item.patientId,
            tumorType: res.tumor_type,
            severityClass: res.severity_class,
            riskLevel: res.risk_level,
            topConfidence: res.stage1_top_pct,
            date: new Date().toLocaleString()
          };
          savedList.unshift(newRecord);
          localStorage.setItem('neurovision_saved', JSON.stringify(savedList));
        } catch (e) {
          console.error("Local save failed", e);
        }
      } catch (err) {
        updateItemStatus(item.id, { status: 'error', error: err.message || "Inference failed." });
        errors++;
        setErrorCount(errors);
      } finally {
        completed++;
        setBatchProgress(Math.round((completed / pendingItems.length) * 100));
      }
    };

    try {
      if (concurrency === 'sequential') {
        for (const item of pendingItems) {
          await processItem(item);
        }
      } else {
        // Parallel processing
        await Promise.all(pendingItems.map(item => processItem(item)));
      }
    } catch (err) {
      const parsed = parseError(err, "Batch MRI Analysis");
      parsed.technicalMessage = err.stack || err.message || String(err);
      setApiError(parsed);
      setError(parsed.message);
    } finally {
      setIsBatchAnalyzing(false);
    }

    if (errors === 0 && successes > 0) {
      toast.success(`Batch analysis completed! Successfully analyzed ${successes} scans.`);
    } else if (successes === 0 && errors > 0) {
      toast.error(`Batch analysis failed. All ${errors} scans failed to process.`);
    } else if (successes > 0 && errors > 0) {
      toast.success(`Batch completed. Success: ${successes}, Failed: ${errors}.`);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    batchItems.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setSaveSuccess(false);

    // Batch states
    setBatchItems([]);
    setSelectedBatchIndex(null);
    setIsBatchAnalyzing(false);
    setBatchProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
  };

  // Generic retry handler
  const handleRetry = () => {
    setApiError(null);
    setError(null);
    if (lastActionRef.current) {
      if (lastActionRef.current.type === 'analyze') {
        handleAnalyze();
      } else if (lastActionRef.current.type === 'analyze_batch') {
        handleAnalyzeBatch();
      } else if (lastActionRef.current.type === 'export_pdf') {
        handleExportPDF();
      } else if (lastActionRef.current.type === 'export_batch_pdf') {
        handleExportBatchPDF();
      }
    }
  };

  // Compile and download single report
  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    setApiError(null);
    setError(null);
    lastActionRef.current = { type: 'export_pdf' };

    const toastId = toast.loading("Generating clinical PDF report...");
    try {
      const heatmapBase64 = result.heatmaps[selectedColormap] || result.gradcam_heatmap;
      const payload = {
        result: {
          tumor_type: result.tumor_type,
          severity_class: result.severity_class,
          risk_level: result.risk_level,
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
      toast.success("PDF report downloaded successfully!", { id: toastId });
    } catch (err) {
      const parsed = parseError(err, "PDF Generation");
      parsed.technicalMessage = err.stack || err.message || String(err);
      setApiError(parsed);
      setError(parsed.message);
      toast.error(parsed.message, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Compile and download unified multi-page PDF batch report
  const handleExportBatchPDF = async () => {
    const successfulItems = batchItems.filter(item => item.status === 'success' && item.result);
    if (successfulItems.length === 0) return;
    setIsExporting(true);
    setApiError(null);
    setError(null);
    lastActionRef.current = { type: 'export_batch_pdf' };

    const toastId = toast.loading("Generating unified PDF batch report...");
    try {
      const casesPayload = successfulItems.map(item => {
        const res = item.result;
        const heatmapBase64 = res.heatmaps[selectedColormap] || res.gradcam_heatmap;
        return {
          result: {
            tumor_type: res.tumor_type,
            severity_class: res.severity_class,
            risk_level: res.risk_level,
            risk_label: res.risk_label,
            stage1_top_pct: res.stage1_top_pct,
            modality: res.modality,
            stage1_confidences: res.stage1_confidences,
            stage2_confidences: res.stage2_confidences
          },
          original_image: res.original_image,
          gradcam_heatmap: heatmapBase64,
          patient_name: item.patientId || 'Pending',
          ref_id: `CASE-${Date.now().toString().slice(-6)}-${item.patientId}`
        };
      });

      const payload = {
        cases: casesPayload,
        physician: physician,
        notes: notes,
        signature: physician
      };

      const pdfBlob = await generateBatchPDFReport(payload);
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `neurovision_batch_report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();
      toast.success("Unified batch PDF downloaded!", { id: toastId });
    } catch (err) {
      const parsed = parseError(err, "Batch PDF Generation");
      parsed.technicalMessage = err.stack || err.message || String(err);
      setApiError(parsed);
      setError(parsed.message);
      toast.error(parsed.message, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Export batch metadata to CSV
  const handleExportCSV = () => {
    const successfulItems = batchItems.filter(item => item.status === 'success' && item.result);
    if (successfulItems.length === 0) return;

    try {
      const headers = ['Patient ID', 'File Name', 'Modality', 'Prediction', 'Severity', 'Risk Level', 'Confidence (%)'];
      const rows = successfulItems.map(item => [
        item.patientId || 'Pending',
        item.file.name,
        item.result.modality,
        item.result.tumor_type,
        item.result.severity_class,
        item.result.risk_level,
        item.result.stage1_top_pct
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `neurovision_batch_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Batch metadata exported to CSV!");
    } catch (err) {
      toast.error(`CSV export failed: ${err.message}`);
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
      toast.success("Diagnostic findings saved successfully to local database records.");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError("Failed to save results locally.");
      toast.error("Failed to save results locally.");
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

  // Detail view renderer for batch item inspect
  const renderDetailView = (item) => {
    const itemResult = item.result;
    if (!itemResult) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              Spatial Interpretability Maps
            </h3>
            
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold text-slate-400 text-center font-mono">Original MRI Scan</div>
              <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden font-mono">
                <img 
                  src={itemResult.original_image} 
                  alt="Original MRI" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold text-slate-400 text-center font-mono font-bold">GradCAM Heatmap ({selectedColormap.toUpperCase()})</div>
              <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden font-mono">
                <img 
                  src={itemResult.heatmaps[selectedColormap] || itemResult.gradcam_heatmap} 
                  alt="GradCAM Overlay" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display font-bold">
              Clinician Observations (Case Specific)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 font-mono">
                <label className="text-[11px] text-slate-500 font-semibold font-bold">Patient ID</label>
                <input
                  type="text"
                  value={item.patientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBatchItems(prev => prev.map(bi => bi.id === item.id ? { ...bi, patientId: val } : bi));
                  }}
                  className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5 font-mono">
                <label className="text-[11px] text-slate-500 font-semibold font-bold">Referring Clinician</label>
                <input
                  type="text"
                  value={physician}
                  onChange={(e) => setPhysician(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2 font-mono">
                <label className="text-[11px] text-slate-500 font-semibold font-bold font-display">Clinical Recommendations</label>
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

        <div className="lg:col-span-5 flex flex-col gap-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
            Pipeline Diagnostics
          </h3>

          <div className={`border p-5 rounded-2xl shadow-md ${getRiskColor(itemResult.risk_level)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-xl font-bold text-white font-display">
                  {itemResult.tumor_type}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Grade: {itemResult.severity_class} • Modality: {itemResult.modality}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-md font-mono">
                {itemResult.risk_level.toUpperCase()}
              </span>
            </div>
            <p className="text-xs leading-relaxed border-t border-slate-800/40 pt-3 text-slate-350">
              {itemResult.description}
            </p>
            
            {itemResult.stage1_top_pct < confThreshold && (
              <div className="flex items-center gap-2 text-[10.5px] text-amber-400 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-lg mt-3">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Low Confidence Alert: Prediction score {itemResult.stage1_top_pct}% is below {confThreshold}% threshold.
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                Stage 1 Classifier Probability
              </h4>
              {Object.entries(itemResult.stage1_confidences).map(([cls, val]) => (
                <ConfidenceBar key={cls} label={cls.toUpperCase()} value={val} />
              ))}
            </div>

            {itemResult.tumor_type !== 'No Tumor' && (
              <div className="border-t border-slate-800/80 pt-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                  Stage 2 Severity Similarity
                </h4>
                {Object.entries(itemResult.stage2_confidences).map(([cls, val]) => (
                  <ConfidenceBar key={cls} label={cls.charAt(0).toUpperCase() + cls.slice(1)} value={val} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render loading/skeleton state for single scan inference ────
  if (showAnalyzing && !isBatchMode) {
    return (
      <SkeletonTheme baseColor="#161b22" highlightColor="#21262d">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Area (Side-by-side Images) - Col Span 7 */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
                Spatial Interpretability Maps
              </h3>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Colormap:</span>
                <Skeleton width={80} height={24} />
              </div>
            </div>

            {/* Side-by-side Images Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              {/* Original MRI Slice */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-400 text-center font-mono">Original MRI Scan</div>
                <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Original MRI Preview" 
                      className="w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <Skeleton height="100%" containerClassName="h-full block" />
                  )}
                </div>
              </div>

              {/* Pure GradCAM heatmap skeleton */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-400 text-center font-mono font-bold">GradCAM Heatmap (CALCULATING)</div>
                <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <span className="text-[11px] font-mono">Running GradCAM overlay...</span>
                  <div className="w-full mt-2">
                    <Skeleton height={8} count={2} className="my-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Clinician Observations & Approvals */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display font-bold">
                Clinician Observations & Approvals
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 font-mono">
                  <label className="text-[11px] text-slate-500 font-semibold font-bold">Patient ID</label>
                  <Skeleton height={32} />
                </div>
                <div className="flex flex-col gap-1.5 font-mono">
                  <label className="text-[11px] text-slate-500 font-semibold font-bold">Referring Clinician</label>
                  <Skeleton height={32} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 font-mono">
                  <label className="text-[11px] text-slate-500 font-semibold font-bold">Clinical Recommendations</label>
                  <Skeleton height={60} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Area (Classification & Metrics) - Col Span 5 */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              Pipeline Diagnostics
            </h3>

            {/* Main Result Card Skeleton */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="w-2/3">
                  <Skeleton height={24} width="80%" className="mb-2" />
                  <Skeleton height={14} width="50%" />
                </div>
                <Skeleton height={20} width={60} />
              </div>
              <div className="border-t border-slate-800/60 pt-3 mt-2">
                <Skeleton count={3} height={12} className="my-1.5" />
              </div>
            </div>

            {/* Confidence Tracks Skeletons */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">
                  Stage 1 Classifier Probability
                </h4>
                <div className="flex flex-col gap-3.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold">
                        <Skeleton width={60} />
                        <Skeleton width={30} />
                      </div>
                      <Skeleton height={8} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button disabled className="py-2.5 bg-slate-950/40 border border-slate-900 text-slate-650 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <RefreshCw size={14} />
                New Scan
              </button>
              <button disabled className="py-2.5 bg-violet-950/20 border border-violet-900/45 text-violet-400/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </button>
              <button disabled className="py-2.5 bg-slate-950/40 border border-slate-900 text-slate-650 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <Save size={14} />
                Save Results
              </button>
            </div>

          </div>

        </div>
      </SkeletonTheme>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-slate-200">
      
      {/* Fallback Offline UI Banner */}
      {!apiStatus && !isDemoMode && showDemoBanner && (
        <div className="bg-amber-950/40 border border-amber-800/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-white font-display">Offline Diagnostic Mode</h4>
              <p className="text-xs text-amber-350 mt-1 leading-relaxed">
                The NeuroVision AI core services are currently unreachable. You can continue testing using our simulated local pipeline (Demo Mode) or retry connection.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                toast.promise(checkApiHealth(), {
                  loading: 'Checking connection...',
                  success: (connected) => connected ? 'API Connected!' : 'API is still unreachable.',
                  error: 'Health check failed.'
                });
              }}
              className="flex-1 sm:flex-initial py-2 px-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check Again
            </button>
            <button
              onClick={() => {
                setIsDemoMode(true);
                setApiError(null);
                toast.success("Demo Mode activated. Running local pipeline simulation.");
              }}
              className="flex-1 sm:flex-initial py-2 px-3.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md hover:shadow-violet-600/20 transition-all font-bold"
            >
              <Brain className="w-3.5 h-3.5" />
              Demo Mode
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Banner Indicator */}
      {isDemoMode && (
        <div className="bg-violet-950/30 border border-violet-800/40 p-3.5 rounded-xl flex justify-between items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-violet-350">
            <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
            <span>Simulated Pipeline (Demo Mode Active)</span>
          </div>
          <button 
            onClick={() => {
              setIsDemoMode(false);
              toast.success("Switched back to Live API connection check.");
            }} 
            className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold uppercase tracking-wider transition-colors"
          >
            Exit Demo Mode
          </button>
        </div>
      )}

      {/* Clinician Friendly Error & Troubleshooting Dashboard */}
      {apiError && (
        <div className="bg-red-950/30 border border-red-900/40 p-5 rounded-2xl flex flex-col gap-4 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white font-display">System Diagnostics Alert</h4>
                <p className="text-xs text-red-300 mt-1 leading-relaxed">{apiError.message}</p>
              </div>
            </div>
            {lastActionRef.current && (
              <button
                onClick={handleRetry}
                className="py-1.5 px-3 bg-red-900/30 border border-red-800 hover:bg-red-900/50 text-red-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            )}
          </div>

          <div className="border-t border-red-900/20 pt-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider font-mono">Troubleshooting Suggestions:</span>
            <ul className="list-disc pl-4 text-xs text-slate-400 flex flex-col gap-1.5">
              {apiError.suggestions.map((s, idx) => (
                <li key={idx} className="leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-red-900/20 pt-3 flex flex-col gap-2">
            <button 
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="text-[10px] text-slate-500 hover:text-slate-400 text-left font-semibold uppercase tracking-wider transition-colors outline-none"
            >
              {showTechDetails ? "Hide Technical Trace Details" : "Show Technical Trace Details (For Support / IT)"}
            </button>
            {showTechDetails && (
              <pre className="bg-black/40 border border-slate-900 p-3.5 rounded-xl text-[10px] font-mono text-red-400/90 overflow-x-auto max-h-40 whitespace-pre-wrap leading-normal">
                {apiError.technicalMessage}
              </pre>
            )}
          </div>
        </div>
      )}

      {isBatchMode ? (
        /* ── Batch Mode View ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Batch Queue */}
          <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl h-[calc(100vh-220px)] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
                Batch Queue ({batchItems.length} Scans)
              </h3>
              {!isBatchAnalyzing && (
                <button 
                  onClick={handleReset}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {batchItems.map((item, index) => {
                const isSelected = selectedBatchIndex === index;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.status === 'success') {
                        setSelectedBatchIndex(index);
                      }
                    }}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-500/5'
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black border border-slate-800/80 flex-shrink-0">
                        <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-xs text-white font-medium truncate max-w-[130px]">{item.file.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 font-mono">{item.patientId}</span>
                          {item.status === 'success' && (
                            <span className="text-[9.5px] text-emerald-400 font-semibold truncate max-w-[90px]">
                              • {item.result.tumor_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      {item.status === 'queued' && (
                        <span className="text-[10px] text-slate-500 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded font-medium font-mono">
                          Queued
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-[10px] text-violet-400 bg-violet-950/40 border border-violet-800/40 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Running
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-850 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Done
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[10px] text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Console Details/Result Dashboard */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {selectedBatchIndex === null ? (
              /* Batch Dashboard Panel */
              <div className="flex flex-col gap-6 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-md">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-white font-display">Batch MRI Analysis Console</h3>
                  <p className="text-xs text-slate-400">
                    Configure batch execution settings and run neural network pipeline on all queued MRI files.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800/60 pt-6">
                  {/* Sequence Modality Select */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-slate-400 font-bold">Sequence Modality Override</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Auto-detect', 'T1', 'T1C+', 'T2'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setModality(m)}
                          aria-label={`Select modality override ${m}`}
                          aria-pressed={modality === m}
                          className={`py-2 px-1 border text-[11px] font-semibold rounded-lg transition-all duration-150 ${
                            modality === m
                              ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                              : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Execution Concurrency */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-slate-400 font-bold">Execution Concurrency</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'sequential', label: 'Sequential', desc: 'Safest (Prevents GPU OOM)' },
                        { value: 'parallel', label: 'Parallel', desc: 'Fastest (Concurrent calls)' }
                      ].map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setConcurrency(c.value)}
                          aria-label={`Set execution concurrency to ${c.label}`}
                          aria-pressed={concurrency === c.value}
                          className={`py-1.5 px-3 border text-xs font-semibold rounded-lg flex flex-col items-center justify-center transition-all duration-150 ${
                            concurrency === c.value
                              ? 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-inner'
                              : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-bold">{c.label}</span>
                          <span className="text-[8.5px] text-slate-500 font-normal mt-0.5">{c.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alert Threshold Slide */}
                <div className="flex flex-col gap-2.5 border-t border-slate-800/60 pt-6">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-400 font-bold">Confidence Alert Threshold</label>
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
                    aria-label="Confidence Alert Threshold"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={confThreshold}
                  />
                </div>

                {/* Progress Section */}
                {(isBatchAnalyzing || batchProgress > 0) && (
                  <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-6">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-semibold text-slate-300">
                        {isBatchAnalyzing ? 'Analyzing scans...' : 'Analysis Complete'}
                      </span>
                      <span className="font-bold text-violet-400">{batchProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${batchProgress}%` }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono mt-1 text-slate-450">
                      <span>Total Queue: {batchItems.length}</span>
                      <span className="text-emerald-450">Success: {successCount}</span>
                      <span className="text-red-400">Error: {errorCount}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-800/60 pt-6">
                  <button
                    onClick={handleAnalyzeBatch}
                    disabled={isBatchAnalyzing}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-750 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 transition-all duration-200 text-xs flex items-center justify-center gap-2 disabled:opacity-50 font-bold font-display"
                  >
                    {isBatchAnalyzing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Running Batch Inference...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        Analyze Batch
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={successCount === 0 || isBatchAnalyzing}
                    className="py-3 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30 font-bold"
                  >
                    Export CSV
                  </button>

                  <button
                    onClick={handleExportBatchPDF}
                    disabled={successCount === 0 || isBatchAnalyzing || isExporting}
                    className="py-3 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30 font-bold"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        Unified PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Case details popup inspector */
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-400">Inspecting Case:</span>
                    <span className="text-xs font-semibold text-white font-mono">{batchItems[selectedBatchIndex].patientId}</span>
                    <span className="text-[11px] text-slate-500">({batchItems[selectedBatchIndex].file.name})</span>
                  </div>
                  <button
                    onClick={() => setSelectedBatchIndex(null)}
                    className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    Back to Batch Console
                  </button>
                </div>

                {/* Render the full analysis view for the selected item */}
                {renderDetailView(batchItems[selectedBatchIndex])}
              </div>
            )}
          </div>
        </div>
      ) : !result ? (
        /* ── 1 & 2. Upload and Settings Panel Layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left panel: File Uploader */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              MRI File Upload
            </h3>

            <div
              role="button"
              tabIndex={0}
              aria-label="Upload Brain MRI Scan slice or batch of slices. Press Enter or Space to select files, or drag and drop image files."
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current.click();
                }
              }}
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
                multiple
              />

              {!previewUrl ? (
                <>
                  <Upload className="w-10 h-10 text-violet-400 animate-pulse" />
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-white">
                      Drag & Drop MRI scan slice(s)
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports multiple JPEG, PNG, or WEBP files (Max 10 MB each)
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
                disabled={showAnalyzing}
                className="w-full py-3 bg-violet-600 hover:bg-violet-750 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 transition-all duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing Scan...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="animate-spin-slow" />
                    Analyze Scan
                  </>
                )}
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
              <label className="text-xs font-semibold text-slate-400 font-bold">
                Sequence Modality
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Auto-detect', 'T1', 'T1C+', 'T2'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModality(m)}
                    aria-label={`Select modality ${m}`}
                    aria-pressed={modality === m}
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
                <label className="font-semibold text-slate-400 font-bold">
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
                aria-label="Confidence Alert Threshold"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={confThreshold}
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Class predictions falling below this score will trigger low-confidence validation alerts.
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* ── Single Results and Evaluation Layout ── */
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
                <div className="text-xs font-bold text-slate-400 text-center font-mono font-bold">GradCAM Heatmap ({selectedColormap.toUpperCase()})</div>
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
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display font-bold">
                Clinician Observations & Approvals
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 font-mono">
                  <label htmlFor="patient-id-input" className="text-[11px] text-slate-500 font-semibold font-bold">Patient ID</label>
                  <input
                    id="patient-id-input"
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none"
                    aria-label="Patient ID"
                  />
                </div>
                <div className="flex flex-col gap-1.5 font-mono">
                  <label htmlFor="physician-input" className="text-[11px] text-slate-500 font-semibold font-bold">Referring Clinician</label>
                  <input
                    id="physician-input"
                    type="text"
                    value={physician}
                    onChange={(e) => setPhysician(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none"
                    aria-label="Referring Clinician"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 font-mono">
                  <label htmlFor="notes-input" className="text-[11px] text-slate-500 font-semibold font-bold">Clinical Recommendations</label>
                  <textarea
                    id="notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-lg p-2 text-xs text-white outline-none resize-none"
                    aria-label="Clinical Recommendations"
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
                <span className="text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-md font-mono">
                  {result.risk_level.toUpperCase()} Risk
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

            {/* Save success toast banner placeholder */}

            {/* Action buttons panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleReset}
                className="py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all font-bold"
              >
                <RefreshCw size={14} />
                New Scan
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="py-2.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-violet-600/20 disabled:opacity-50 transition-all font-bold"
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
                className="py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all font-bold"
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
