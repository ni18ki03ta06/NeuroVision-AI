import { useState, useEffect } from 'react';

/**
 * Custom hook for handling image uploads, validating file properties,
 * generating object previews, and encoding images to Base64 data strings.
 */
export default function useImageUpload(maxSizeMb = 10) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [error, setError] = useState(null);

  // Clean up Object URL when file changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const convertToBase64 = (imgFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imgFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFile = async (selectedFile) => {
    setError(null);

    if (!selectedFile) {
      return false;
    }

    // Validate MIME type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(selectedFile.type)) {
      setError("Invalid file format. Please upload a JPEG, PNG, or WEBP scan slice.");
      return false;
    }

    // Validate Size (Max 10MB default)
    const sizeLimitBytes = maxSizeMb * 1024 * 1024;
    if (selectedFile.size > sizeLimitBytes) {
      setError(`File size exceeds the ${maxSizeMb} MB limit.`);
      return false;
    }

    try {
      setFile(selectedFile);
      
      // Generate object URL for immediate rendering
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);

      // Generate base64 string
      const base64Str = await convertToBase64(selectedFile);
      setBase64(base64Str);
      
      return true;
    } catch (err) {
      setError("Failed to process image file.");
      return false;
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setBase64(null);
    setError(null);
  };

  return {
    file,
    preview,
    base64,
    error,
    setError,
    handleFile,
    reset
  };
}
