"use client";

/**
 * src/providers/query-provider.tsx — TanStack Query Provider
 *
 * Configures and exposes the QueryClient for all server state management.
 * The client is created once per browser session with production-appropriate
 * defaults. ReactQueryDevtools is included only in development builds.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // useState ensures a new QueryClient is created per request in SSR,
  // and per session on the client — preventing state leakage between users.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 60 seconds before a background refetch
            staleTime: 60 * 1000,
            // Retain inactive query data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once before surfacing an error
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
