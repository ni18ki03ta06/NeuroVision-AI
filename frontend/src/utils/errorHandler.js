/**
 * Clinician-friendly Error Handler for NeuroVision AI
 */

export function parseError(err, context = "Inference Pipeline") {
  // Detailed logging for debugging
  console.group(`%c[NeuroVision AI Error] %c${context}`, 'color: #ef4444; font-weight: bold;', 'color: #a78bfa;');
  console.error("Original Error Object:", err);
  console.error("Error Message:", err.message || err);
  console.error("Error Name:", err.name || "Unknown");
  console.error("Stack Trace:", err.stack || "N/A");
  console.error("Timestamp:", new Date().toISOString());
  console.groupEnd();

  const msg = (err.message || String(err)).toLowerCase();
  
  // 1. Network / CORS / Backend Offline
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network error") || msg.includes("err_connection_refused")) {
    return {
      message: "Unable to establish connection with the NeuroVision AI core services.",
      suggestions: [
        "Verify your workstation's local network connection.",
        "Check that the backend server is running (port 8000).",
        "Ensure no local firewall or proxy is blocking port 8000.",
        "Verify the server status by checking the API status indicator in the top navbar."
      ],
      type: "network"
    };
  }

  // 2. File size or format validation failures
  if (msg.includes("invalid file type") || msg.includes("limit") || msg.includes("size") || msg.includes("10 mb")) {
    return {
      message: "The uploaded file could not be parsed by the image preprocessing block.",
      suggestions: [
        "Confirm the scan slice is in JPEG, PNG, or WEBP format.",
        "Ensure the file size is under 10 MB per image.",
        "Try re-saving or exporting the scan slice from your PACS viewer."
      ],
      type: "validation"
    };
  }

  // 3. API-specific responses (like 422, 500, etc.)
  if (msg.includes("422") || msg.includes("unprocessable entity")) {
    return {
      message: "The inference server received invalid modality parameters.",
      suggestions: [
        "Check if you selected a specific scan sequence modality override.",
        "Verify if you are running sequential vs parallel batch processing.",
        "Try changing modality to 'Auto-detect' and re-run."
      ],
      type: "api_params"
    };
  }

  if (msg.includes("500") || msg.includes("internal server error") || msg.includes("server error")) {
    return {
      message: "An internal processing crash occurred in the 2-Stage neural network pipeline.",
      suggestions: [
        "Check backend console logs to see if PyTorch ran out of VRAM.",
        "Ensure the trained model weights reside in the backend/models folder.",
        "Restart the FastAPI backend server process."
      ],
      type: "server"
    };
  }

  // 4. Fallback default error
  return {
    message: err.message || "An unexpected pipeline anomaly occurred during analysis.",
    suggestions: [
      "Click the 'Retry' button to re-submit the scan to the model.",
      "Check the browser console logs (F12) for detailed trace details.",
      "If the issue persists, contact the system administrator."
    ],
    type: "unknown"
  };
}
