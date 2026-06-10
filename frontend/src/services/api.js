const API_BASE = import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

/**
 * Uploads an MRI file and receives stage 1/2 classification, metadata, and pre-rendered GradCAM maps.
 * @param {File} file - MRI image file
 * @param {string} modality - Selected modality option ('Auto-detect', 'T1', etc.)
 * @returns {Promise<Object>} API Prediction response
 */
export async function uploadMRI(file, modality = "Auto-detect") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("modality", modality);

  const response = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Upload failed with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Sends physician metadata, notes, signatures, and images to generate a clinical PDF.
 * @param {Object} payload - Report generation metadata and base64 assets
 * @returns {Promise<Blob>} PDF binary blob
 */
export async function generatePDFReport(payload) {
  const response = await fetch(`${API_BASE}/generate-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Report compilation failed with status ${response.status}`);
  }

  return await response.blob();
}
