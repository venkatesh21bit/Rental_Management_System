const API_URL = "https://rentalmanagementsystem-production.up.railway.app/api";

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("access_token");
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("refresh_token");
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token");
      if (typeof window !== 'undefined') {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      return null;
    }

    const data = await response.json();
    if (data.access) {
      if (typeof window !== 'undefined') {
        localStorage.setItem("access_token", data.access);
      }
      return data.access;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }

  return null;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAuthToken();
  if (!token) throw new Error("Authentication token not found. Please log in again.");

  // Prepare headers - only set Content-Type if body is not FormData
  const headers: Record<string, string> = {
    ...(options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    token = await refreshAccessToken();
    // Prepare headers for retry - only set Content-Type if body is not FormData
    const retryHeaders: Record<string, string> = {
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : options.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    };

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
      retryHeaders['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  }

  return response;
};

export { API_URL, getAuthToken, refreshAccessToken, fetchWithAuth };