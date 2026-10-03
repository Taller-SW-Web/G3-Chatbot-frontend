"use client";

import { QueryClientProvider } from "@/application/providers/queryProvider";
import { queryClient } from "@/application/providers/queryClient";

/**
 * Providers cliente bajo el layout servidor.
 * TanStack Query para listados + futuros providers.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
