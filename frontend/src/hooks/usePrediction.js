import { useState, useRef } from 'react';
import { uploadAndPredict } from '../api/predictionAPI';

/**
 * Custom hook for managing prediction request states (loading, results, errors)
 * and caching output records to prevent redundant API queries.
 */
export default function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // In-memory cache key format: "filename_modality"
  const predictionCache = useRef({});

  const runPrediction = async (file, modality = "Auto-detect") => {
    if (!file) return null;
    
    const cacheKey = `${file.name}_${modality}`;
    
    // Check in-memory cache first
    if (predictionCache.current[cacheKey]) {
      const cachedResult = predictionCache.current[cacheKey];
      setResult(cachedResult);
      setError(null);
      return cachedResult;
    }

    setLoading(true);
    setError(null);
    
    try {
      const predictionResponse = await uploadAndPredict(file, modality);
      
      // Store output in cache
      predictionCache.current[cacheKey] = predictionResponse;
      
      setResult(predictionResponse);
      return predictionResponse;
    } catch (err) {
      const errMsg = err.message || "Diagnostic pipeline execution failed.";
      setError(errMsg);
      setResult(null);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearPrediction = () => {
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const clearCache = () => {
    predictionCache.current = {};
  };

  return {
    result,
    loading,
    error,
    setError,
    runPrediction,
    clearPrediction,
    clearCache
  };
}
