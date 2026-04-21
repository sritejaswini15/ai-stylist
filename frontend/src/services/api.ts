// Centralized API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Utility to build full API URLs. 
 * If VITE_API_URL is empty, it returns relative paths (works with Vite proxy).
 * If VITE_API_URL is set, it returns absolute paths.
 */
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
