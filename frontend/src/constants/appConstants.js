/**
 * API Routing Paths for the NeuroVision backend uvicorn service
 */
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  PREDICT: '/predict',
  METRICS: '/performance-metrics',
  INFO: '/models/info',
  PDF: '/generate-pdf',
  HISTORY: '/history'
};

/**
 * Stage 1 Classification Labels
 */
export const TUMOR_CLASSES = ['glioma', 'meningioma', 'notumor', 'pituitary'];

/**
 * Stage 2 Classification Labels
 */
export const SEVERITY_CLASSES = ['glioma', 'meningioma', 'neurocitoma', 'normal', 'outros', 'schwannoma'];

/**
 * Physician Friendly Labels
 */
export const CLASS_LABELS_MAP = {
  'glioma': 'Glioma',
  'meningioma': 'Meningioma',
  'neurocitoma': 'Neurocytoma',
  'schwannoma': 'Schwannoma',
  'outros': 'Other Lesion',
  'normal': 'Normal',
  'notumor': 'No Tumor',
  'pituitary': 'Pituitary'
};

/**
 * Risk level metadata details
 */
export const RISK_LEVEL_MAPPINGS = {
  high: {
    label: "High Risk",
    icon: "🔴",
    description: "Indicates aggressive anomalies requiring immediate clinical correlation and potential biopsy."
  },
  medium: {
    label: "Medium Risk",
    icon: "🟠",
    description: "Indicates intermediate lesion attributes. Clinical re-evaluation and follow-up is advised."
  },
  low: {
    label: "Low Risk",
    icon: "🟢",
    description: "Indicates benign attributes. Edema levels are typically low and slow-growing."
  },
  none: {
    label: "No Risk",
    icon: "✅",
    description: "No significant anomalous spatial localization identified."
  }
};

/**
 * Hex Color Schemes for Chart Lines and Segment Cells
 */
export const CHART_COLORS = {
  primary: '#7c3aed',     // Violet
  primaryAccent: '#a78bfa', // Light Violet
  sky: '#38bdf8',         // Light Blue
  orange: '#fb923c',      // Orange
  red: '#f87171',         // Red
  green: '#4ade80',       // Green
  slateGrid: '#1f2937',   // Gray
  colorPalette: [
    '#7c3aed',
    '#a78bfa',
    '#38bdf8',
    '#fb923c',
    '#f87171',
    '#4ade80'
  ]
};

/**
 * Allowed image extensions for validation
 */
export const FILE_UPLOADER_CONFIG = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};
