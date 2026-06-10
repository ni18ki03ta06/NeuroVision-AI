import axios from 'axios';

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  timeout: Number(import.meta.env.REACT_APP_API_TIMEOUT) || 30000, // accommodate TTA inference runs
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request Interceptor (e.g., to attach auth tokens or request tracing)
apiClient.interceptors.request.use(
  (config) => {
    // Perform actions before request is sent
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (handles standard API errors globally)
apiClient.interceptors.response.use(
  (response) => {
    // Directly return the data payload for cleaner consumption
    return response.data;
  },
  (error) => {
    let errorMessage = "An unexpected network error occurred.";
    
    if (error.response) {
      // Server responded with non-2xx status code
      errorMessage = error.response.data?.detail || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request sent but no response received
      errorMessage = "No response received from diagnostic API. Verify the server is running.";
    } else {
      errorMessage = error.message;
    }

    console.error("[API Error Interceptor]:", errorMessage);
    
    // Normalize error rejection for React hooks to capture
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
