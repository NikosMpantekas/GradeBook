/**
 * CORS Helper Utility
 * Provides specialized functions to handle cross-origin requests
 * when standard approaches fail with Network Error
 */

import { API_URL } from '../config/appConfig';

/**
 * Makes a cross-origin PUT request using various techniques to avoid CORS issues
 * @param {string} endpoint - The endpoint to call (without base URL)
 * @param {object} data - The data to send
 * @param {string} token - Authentication token
 * @returns {Promise<object>} Response data
 */
export const makeCrossDomainPutRequest = async (endpoint, data, token) => {
  console.log('🔄 CORS HELPER: Starting cross-domain PUT request');
  console.log('🔄 CORS HELPER: Target URL:', `${API_URL}${endpoint}`);
  
  // Try different approaches in sequence
  const methods = [
    tryFetchWithCredentials,
    tryFetchWithoutCredentials,
    tryFetchWithJsonpPolyfill,
    tryPostWithFormDataWrapper
  ];
  
  let lastError = null;
  
  // Try each method until one succeeds
  for (const method of methods) {
    try {
      console.log(`🔄 CORS HELPER: Trying method: ${method.name}`);
      const result = await method(endpoint, data, token);
      console.log('✅ CORS HELPER: Success with method:', method.name);
      return result;
    } catch (error) {
      console.log(`❌ CORS HELPER: Method ${method.name} failed:`, error.message);
      lastError = error;
    }
  }
  
  // All methods failed, throw the last error
  console.error('❌ CORS HELPER: All methods failed');
  throw lastError;
};

/**
 * Attempt 1: Use fetch with credentials
 */
async function tryFetchWithCredentials(endpoint, data, token) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.trim()}`
    },
    body: JSON.stringify(data),
    credentials: 'include',
    mode: 'cors'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Attempt 2: Use fetch without credentials
 */
async function tryFetchWithoutCredentials(endpoint, data, token) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.trim()}`
    },
    body: JSON.stringify(data),
    mode: 'cors'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Attempt 3: Use a JSONP-like approach for PUT requests
 * This creates a temporary form that submits to an iframe
 */
async function tryFetchWithJsonpPolyfill(endpoint, data, token) {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique callback name
      const callbackName = 'corsCallback_' + Math.random().toString(36).substring(2, 15);
      
      // Add the callback to window
      window[callbackName] = function(response) {
        // Clean up
        delete window[callbackName];
        document.body.removeChild(iframe);
        
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      };
      
      // Create an invisible iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Create a form in the iframe
      const html = `
        <form id="corsForm" action="${API_URL}${endpoint}?callback=${callbackName}" method="POST">
          <input type="hidden" name="_method" value="PUT">
          <input type="hidden" name="data" value='${JSON.stringify(data)}'>
          <input type="hidden" name="token" value="${token}">
        </form>
        <script>document.getElementById('corsForm').submit();</script>
      `;
      
      // Write to iframe and submit form
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Set a timeout
      setTimeout(() => {
        reject(new Error('JSONP request timed out'));
        if (window[callbackName]) {
          delete window[callbackName];
        }
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Attempt 4: Use POST with form data and method override
 * Many servers accept this as a workaround for PUT requests
 */
async function tryPostWithFormDataWrapper(endpoint, data, token) {
  // Create form data with _method=PUT to simulate PUT request
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('data', JSON.stringify(data));
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST', // Using POST but signaling PUT via _method
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token.trim()}`
      // No Content-Type header - FormData sets it automatically
    },
    body: formData,
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Diagnostic function to check for CORS support
 */
export const checkCorsSupport = async () => {
  console.log('🔍 CORS DIAGNOSTICS: Checking browser CORS support');
  
  const diagnostics = {
    browserSupport: 'fetch' in window && 'Headers' in window,
    corsMode: true,
    credentialsMode: true,
    originsMatch: window.location.origin === new URL(API_URL).origin
  };
  
  console.log('🔍 CORS DIAGNOSTICS:', diagnostics);
  return diagnostics;
};

export default {
  makeCrossDomainPutRequest,
  checkCorsSupport
};
