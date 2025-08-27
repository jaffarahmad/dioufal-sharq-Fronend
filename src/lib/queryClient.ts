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
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const apiBaseUrl = getApiBaseUrl();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options?.headers || {}),
  };

  // Construct full URL with base URL
  const fullUrl = url.startsWith('/') 
    ? `${apiBaseUrl}${url}`
    : `${apiBaseUrl}/${url}`;

  const res = await fetch(fullUrl, {
    credentials: "include",
    ...options,
    headers,
  });

  return res; // Don't throw here, let caller handle errors
}

type UnauthorizedBehavior = "returnNull" | "throw";
// Get API base URL from environment variables
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
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
    const firstKey = queryKey[0] as string;
    const url = firstKey.startsWith('/') 
      ? `${apiBaseUrl}${queryKey.map(String).join('/')}`
      : `${apiBaseUrl}/${queryKey.map(String).join('/')}`; 

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
