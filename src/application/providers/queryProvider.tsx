"use client";

import { QueryClientProvider as TanStackProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClient } from "./queryClient";

export function QueryClientProvider({
  client = queryClient,
  children,
}: {
  client?: QueryClient;
  children: ReactNode;
}) {
  return <TanStackProvider client={client}>{children}</TanStackProvider>;
}
