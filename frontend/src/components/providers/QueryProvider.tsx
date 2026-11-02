"use client";

import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 3, // 3 minutos de cache
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (
                axios.isAxiosError(error) &&
                error.response &&
                error.response.status >= 400 &&
                error.response.status < 500
              ) {
                return false;
              }

              return failureCount < 1;
            },
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
