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
