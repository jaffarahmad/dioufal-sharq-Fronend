import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  const token = localStorage.getItem("auth_token");
  const apiBaseUrl = getApiBaseUrl();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options?.headers || {}),
  };

  // Construct full URL with base URL
  // Remove /api prefix from url if it exists to avoid duplication
  const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;
  const fullUrl = cleanUrl.startsWith('/') 
    ? `${apiBaseUrl}${cleanUrl}`
    : `${apiBaseUrl}/${cleanUrl}`;

  console.log("Making API request:", {
    url: fullUrl,
    method: options?.method || 'GET',
    headers,
    body: options?.body
  });

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  console.log("API response:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const errorText = await res.text();
    console.error("API error response:", errorText);
    throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
  }

  const responseData = await res.json();
  console.log("API response data:", responseData);
  return responseData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
// Default to same-origin `/api` so Vite dev proxy and Vercel production use the same paths.
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const token = localStorage.getItem("auth_token");
    const apiBaseUrl = getApiBaseUrl();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Construct full URL with base URL
    // Remove /api prefix from firstKey if it exists to avoid duplication
    const firstKey = queryKey[0] as string;
    const cleanKey = firstKey.startsWith('/api/') ? firstKey.substring(4) : firstKey;
    const url = cleanKey.startsWith('/') 
      ? `${apiBaseUrl}${cleanKey}`
      : `${apiBaseUrl}/${cleanKey}`; 

    const res = await fetch(url, {
       credentials: "include",
       headers,
     });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
