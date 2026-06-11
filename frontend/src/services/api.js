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

/**
 * Fetches the entire prediction history list.
 * @returns {Promise<Array>} Prediction history array
 */
export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn("API history fetch failed, falling back to localStorage", err);
    return JSON.parse(localStorage.getItem("neurovision_saved") || "[]");
  }
}

/**
 * Deletes a prediction history record by ID.
 * @param {number} id - Record ID to delete
 * @returns {Promise<Object>} Status response
 */
export async function deleteHistoryItem(id) {
  try {
    const response = await fetch(`${API_BASE}/history/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete prediction record: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn("API history delete failed, falling back to localStorage", err);
    const saved = JSON.parse(localStorage.getItem("neurovision_saved") || "[]");
    const filtered = saved.filter(item => item.id !== id);
    localStorage.setItem("neurovision_saved", JSON.stringify(filtered));
    return { status: "success", message: "Deleted from local storage" };
  }
}

/**
 * Uploads multiple MRI files in a single batch request.
 * @param {Array<File>} files - MRI files array
 * @param {string} modality - Selected modality
 * @returns {Promise<Array>} List of predictions
 */
export async function uploadMRIList(files, modality = "Auto-detect") {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  formData.append("modality", modality);

  const response = await fetch(`${API_BASE}/predict/batch`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Batch upload failed with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Sends physician metadata and case list to compile a multi-page PDF batch report.
 * @param {Object} payload - Report payload details containing multiple cases
 * @returns {Promise<Blob>} Batch PDF document binary blob
 */
export async function generateBatchPDFReport(payload) {
  const response = await fetch(`${API_BASE}/generate-pdf/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Batch report compilation failed with status ${response.status}`);
  }

  return await response.blob();
}
