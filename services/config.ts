// API Configuration
export const API_CONFIG = {
  // IMPORTANT: Update this based on your testing environment
  
  // Current server IP from backend
  BASE_URL: 'http://10.142.215.170:5000/api',
  
  // Alternative URLs (uncomment if needed):
  // For Android Emulator:
  // BASE_URL: 'http://10.0.2.2:5000/api',
  
  // For iOS Simulator:
  // BASE_URL: 'http://localhost:5000/api',
  
  // For localhost testing:
  // BASE_URL: 'http://127.0.0.1:5000/api',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  
  // User
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  
  // Storage
  UPLOAD_FILE: '/storage/upload',
  UPLOAD_DATA: '/storage/upload-data',
  GET_FILES: '/storage/files',
  
  // Chat
  GET_MESSAGES: '/chat/messages',
  SEND_MESSAGE: '/chat/messages',
}

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
