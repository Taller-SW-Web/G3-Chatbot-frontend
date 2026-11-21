"use client";

import { QueryClientProvider } from "@/shared/ui/QueryProvider";
import { queryClient } from "@/shared/di/queryClient";

/**
 * Providers cliente bajo el layout servidor.
 * TanStack Query para listados + futuros providers.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
