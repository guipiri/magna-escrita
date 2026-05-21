import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// When a request uses responseType: 'blob', Axios returns error response bodies
// as Blobs too — which breaks JSON-based error parsing. This interceptor detects
// that case, reads the Blob as text, and replaces response.data with the parsed
// JSON so that getApiError() can extract the error key correctly.
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.data instanceof Blob &&
      error.response.data.type === 'application/json'
    ) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch {
        // If parsing fails, leave the original Blob — getApiError will fall back
        // to UNKNOWN_ERROR gracefully.
      }
    }

    return Promise.reject(error);
  },
);
