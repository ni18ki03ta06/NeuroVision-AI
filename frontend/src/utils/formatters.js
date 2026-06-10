/**
 * Rounds value to a specific precision and appends a percentage symbol.
 * @param {number} value - Numeric value
 * @param {number} precision - Decimal places (default 1)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, precision = 1) {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  return `${Number(value).toFixed(precision)}%`;
}

/**
 * Rounds a confidence score to 1 decimal place.
 * @param {number} score - Confidence score (0 to 100)
 * @returns {number} Rounded score
 */
export function formatConfidence(score) {
  if (score === undefined || score === null || isNaN(score)) {
    return 0.0;
  }
  return Math.round(Number(score) * 10) / 10;
}

/**
 * Maps risk strings to appropriate Tailwind class mappings and visual colors.
 * @param {string} riskLevel - Risk level string ('high', 'medium', 'low', 'none')
 * @returns {Object} Config containing label, badge tailwind styles, card border styles, and text color
 */
export function formatRiskLevel(riskLevel) {
  const normalized = (riskLevel || 'none').toLowerCase().trim();
  
  const mapping = {
    high: {
      label: 'High Risk',
      textClass: 'text-red-400',
      badgeClass: 'text-red-400 bg-red-950/40 border-red-800/60',
      cardClass: 'border-red-800/60 bg-red-950/10 shadow-red-950/20',
      colorGlow: '#f87171'
    },
    medium: {
      label: 'Medium Risk',
      textClass: 'text-amber-400',
      badgeClass: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      cardClass: 'border-amber-800/60 bg-amber-950/10 shadow-amber-950/20',
      colorGlow: '#fb923c'
    },
    low: {
      label: 'Low Risk',
      textClass: 'text-emerald-400',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
      cardClass: 'border-emerald-800/60 bg-emerald-950/10 shadow-emerald-950/20',
      colorGlow: '#4ade80'
    },
    none: {
      label: 'No Risk',
      textClass: 'text-emerald-400',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
      cardClass: 'border-emerald-800/60 bg-emerald-950/10 shadow-emerald-950/20',
      colorGlow: '#4ade80'
    }
  };

  return mapping[normalized] || mapping.none;
}

/**
 * Formats API response predictions dictionary into clinical view models.
 * @param {Object} data - Prediction response from FastAPI predict endpoint
 * @returns {Object} Formatted details
 */
export function formatPredictionResponse(data) {
  if (!data) return null;
  
  return {
    ...data,
    formattedAccuracy: formatPercentage(data.stage1_top_pct),
    riskDetails: formatRiskLevel(data.risk_level),
    tumorTypeLabel: data.tumor_type === 'No Tumor' ? 'No Tumor Detected' : `${data.tumor_type} Detected`,
  };
}
