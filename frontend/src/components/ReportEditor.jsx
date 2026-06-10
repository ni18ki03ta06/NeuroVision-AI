import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, FileDown, AlertCircle } from 'lucide-react';

export default function ReportEditor({ 
  onExportReport, 
  isExporting, 
  activeCaseName 
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [patientId, setPatientId] = useState("P-1042");
  const [caseRef, setCaseRef] = useState("");
  const [physician, setPhysician] = useState("Dr. Sarah Jenkins");
  const [analysisDate, setAnalysisDate] = useState("");
  const [notes, setNotes] = useState("Lesion boundaries visible under TTA. Strong localization markers present in the feature block. Recommended correlation with biopsy.");
  const [isApproved, setIsApproved] = useState(false);
  const [signature, setSignature] = useState("");

  // Auto-generate case reference ID and date on load or case change
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    setCaseRef(`CASE-${dateStr}`);
    
    const timeStr = now.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setAnalysisDate(`${now.toISOString().slice(0, 10)} ${timeStr}`);
    setIsApproved(false);
    setSignature("");
  }, [activeCaseName]);

  const handleExport = () => {
    onExportReport({
      patient_name: patientId,
      ref_id: caseRef,
      physician: physician,
      notes: notes,
      signature: isApproved ? signature : ""
    });
  };

  return (
    <div className="expander">
      
      {/* Header toggler (Streamlit expander equivalent) */}
      <div className="expander-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="expander-title">
          📝 Report Details & Physician Approval
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isOpen && (
        <div className="expander-content">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Patient ID/Name</label>
              <input
                type="text"
                className="form-input"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Case Reference ID</label>
              <input
                type="text"
                className="form-input"
                value={caseRef}
                onChange={(e) => setCaseRef(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Referring Physician</label>
              <input
                type="text"
                className="form-input"
                value={physician}
                onChange={(e) => setPhysician(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Analysis Date</label>
              <input
                type="text"
                className="form-input"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Observations & Clinical Recommendations</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <hr className="divider" />

          {/* Sign-off validation */}
          <div style={{ margin: '14px 0' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={isApproved}
                onChange={(e) => {
                  setIsApproved(e.target.checked);
                  if (e.target.checked) setSignature(physician);
                  else setSignature("");
                }}
              />
              ✍️ Approve & Sign Case Report
            </label>
          </div>

          {isApproved && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Physician Signature (Digital Sign-off)</label>
              <input
                type="text"
                className="form-input"
                style={{ borderLeft: '3px solid var(--color-low)' }}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
            </div>
          )}

          {isApproved && signature && (
            <div className="signed-badge">
              <Check size={16} />
              <div>
                <strong>Case Approved & Signed</strong><br />
                This report is signed off by <strong>{signature}</strong> and ready for clinical distribution.
              </div>
            </div>
          )}

          {/* Export PDF Button inside compiler block */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleExport}
              disabled={isExporting || (isApproved && !signature)}
              className="primary-btn"
            >
              {isExporting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderLeftColor: '#fff' }} />
                  Compiling PDF...
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  Export Clinical PDF
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
