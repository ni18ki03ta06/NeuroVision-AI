import apiClient from './apiClient';

/**
 * Uploads an MRI scan slice for 2-stage inference and GradCAM generation.
 * @param {File} imageFile - The raw image File object
 * @param {string} modality - Sequence configuration ('Auto-detect', 'T1', etc.)
 * @returns {Promise<Object>} The prediction metrics payload
 */
export async function uploadAndPredict(imageFile, modality = "Auto-detect") {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("modality", modality);

  // Axios automatically sets multipart headers when passing FormData
  return apiClient.post('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
}

/**
 * Fetches confusion matrices, loss curves, and ROC points.
 * @returns {Promise<Object>} Model evaluation coordinates
 */
export async function getPerformanceMetrics() {
  return apiClient.get('/performance-metrics');
}

/**
 * Fetches parameter scopes and backbone versions.
 * @returns {Promise<Object>} Models metadata
 */
export async function getModelInfo() {
  return apiClient.get('/models/info');
}

/**
 * Sends physician entries and base64 layers, returning a PDF report stream.
 * @param {Object} predictionData - Patient metadata and image assets
 * @returns {Promise<Blob>} Binary PDF Blob
 */
export async function generatePDF(predictionData) {
  // Override Axios client config to receive binary blob streams
  return apiClient.post('/generate-pdf', predictionData, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf',
    }
  });
}

/**
 * Fetches historical case logs saved in database.
 * @returns {Promise<Array>} List of historical predictions
 */
export async function getPredictionHistory() {
  // Try fetching from API history route, fallback to empty array if not fully implemented
  try {
    return await apiClient.get('/history');
  } catch (e) {
    // If route isn't active, fallback to localStorage history registry
    return JSON.parse(localStorage.getItem('neurovision_saved') || '[]');
  }
}

/**
 * Deletes a specific prediction from database history.
 * @param {number} id - The database record ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deletePredictionHistoryItem(id) {
  try {
    return await apiClient.delete(`/history/${id}`);
  } catch (e) {
    console.error("Failed to delete database history item, falling back", e);
    // Fallback for localStorage
    const saved = JSON.parse(localStorage.getItem('neurovision_saved') || '[]');
    const filtered = saved.filter(item => item.id !== id);
    localStorage.setItem('neurovision_saved', JSON.stringify(filtered));
    return { status: "success", message: "Deleted from local storage" };
  }
}

/**
 * Uploads multiple MRI scans for batch classification.
 * @param {FileList|Array} files - File objects list
 * @param {string} modality - Modal configuration
 * @returns {Promise<Array>} List of predictions
 */
export async function uploadAndPredictBatch(files, modality = "Auto-detect") {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  formData.append("modality", modality);
  
  return apiClient.post('/predict/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
}

/**
 * Compiles a batch of diagnostic results into a single multi-page PDF document.
 * @param {Object} batchPayload - The list of cases and signing physician metadata
 * @returns {Promise<Blob>} Binary PDF stream Blob
 */
export async function generateBatchPDF(batchPayload) {
  return apiClient.post('/generate-pdf/batch', batchPayload, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf',
    }
  });
}
