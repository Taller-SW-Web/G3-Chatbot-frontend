"use client";

import { useQuery } from "@tanstack/react-query";
import { container } from "@/shared/di/container";

/**
 * Perfil del cliente autenticado (`GET /sesion/perfil`).
 *
 * Vive en `shared/auth` para que cualquier módulo lea el perfil sin declarar
 * una dependencia hacia `mod-auth`: `auth` se consume por el kernel, no por
 * aristas del DAG (ADR-0024).
 */
export function usePerfil() {
  return useQuery({
    queryKey: ["perfil"],
    queryFn: () => container.auth.fetchProfile(),
    retry: false,
  });
}
