/**
 * API Client utility for making consistent fetch requests to the backend through the proxy
 */

interface ApiClientOptions extends RequestInit {
  withCredentials?: boolean;
}

/**
 * Makes an API request to the backend through the Vite proxy
 * 
 * @param endpoint - The API endpoint (with or without /api prefix)
 * @param options - Fetch options
 * @returns Promise with the response
 */
export async function apiRequest<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
  // Handle endpoint path
  let url: string;
  if (endpoint.startsWith('/api/')) {
    // If the endpoint already has /api, don't add it again
    url = endpoint;
  } else if (endpoint.startsWith('/')) {
    // If the endpoint starts with / but not /api, add /api
    url = `/api${endpoint}`;
  } else {
    // If the endpoint doesn't start with /, add /api/
    url = `/api/${endpoint}`;
  }
  
  // Create fetch options
  const fetchOptions: RequestInit = {
    ...options,
    credentials: options?.withCredentials ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    }
  };
  
  try {
    console.log(`Making ${options?.method || 'GET'} request to: ${url}`);
    const response = await fetch(url, fetchOptions);
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      if (isJson) {
        // Try to get error details from JSON response
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.message || response.statusText}`);
      } else {
        // Non-JSON error response
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
    }
    
    // For successful responses
    if (isJson) {
      return await response.json() as T;
    } else {
      // Handle non-JSON successful responses (rare, but possible)
      const text = await response.text();
      console.warn('Expected JSON response but got:', text);
      try {
        // Try to parse it anyway in case content-type is wrong
        return JSON.parse(text);
      } catch {
        // Return empty object if not parseable JSON
        return {} as T;
      }
    }
  } catch (error) {
    console.error(`API request to ${url} failed:`, error);
    throw error;
  }
}

/**
 * GET request helper
 */
export function get<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function post<T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export function put<T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function del<T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
} 