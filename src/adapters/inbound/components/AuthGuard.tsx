"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/application/state/chatStore";

export type AuthGuardProps = {
  children: ReactNode;
  /** Ruta a la que se redirige cuando no hay sesión. Por defecto: "/?abrirLogin=1". */
  redirectTo?: string;
  /** UI opcional mientras se valida la sesión o se realiza la redirección. */
  fallback?: ReactNode;
};

const emptySubscribe = () => () => {};

/**
 * Guard de rutas para pantallas que exigen sesión (H4-S5: cuenta, checkout, pedidos).
 * Protege contra accesos no autenticados en el cliente:
 * - Guarda la ruta solicitada (con query string) en `accionPendiente`.
 * - Abre el modal de inicio de sesión (`setAuthOpen(true)`).
 * - Redirige a la pantalla pública (`/?abrirLogin=1`).
 * Una vez autenticado el usuario, `AuthModal` reanuda la navegación a `accionPendiente`.
 */
export function AuthGuard({
  children,
  redirectTo = "/?abrirLogin=1",
  fallback = null,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const accessToken = useChatStore((s) => s.accessToken);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);

  const isAuthenticated = Boolean(accessToken);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const fullPath = pathname ? `${pathname}${search}` : "/";

      setAccionPendiente(fullPath);
      setAuthOpen(true);
      router.replace(redirectTo);
    }
  }, [mounted, isAuthenticated, pathname, redirectTo, router, setAccionPendiente, setAuthOpen]);

  if (!mounted || !isAuthenticated) {
    return (
      fallback ?? (
        <div
          role="status"
          aria-live="polite"
          data-testid="auth-guard-loading"
          className="p-8 flex flex-col items-center justify-center min-h-[200px] text-text-secondary"
        >
          <p className="text-[13px] font-semibold">Verificando sesión…</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
