"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
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
  const expiraEn = useChatStore((s) => s.expiraEn);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);

  // Comprueba tanto presencia como vigencia real del token (H4-S5).
  // `Date.now()` no puede llamarse en el render y el efecto tampoco debe hacer
  // `setState` síncrono (reglas del React Compiler): la primera comprobación se
  // agenda en un timeout y luego se refresca cada 30 s. `lista` evita redirigir
  // antes de haber evaluado la vigencia.
  const [vigencia, setVigencia] = useState({ lista: false, expirado: true });

  useEffect(() => {
    const revisar = () =>
      setVigencia({
        lista: true,
        expirado: !accessToken || !expiraEn || Date.now() >= expiraEn,
      });
    const inicial = window.setTimeout(revisar, 0);
    const periodo = window.setInterval(revisar, 30_000);
    return () => {
      window.clearTimeout(inicial);
      window.clearInterval(periodo);
    };
  }, [accessToken, expiraEn]);

  const isAuthenticated =
    Boolean(accessToken) && vigencia.lista && !vigencia.expirado;

  useEffect(() => {
    if (!mounted || !vigencia.lista) return;

    if (!isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const fullPath = pathname ? `${pathname}${search}` : "/";

      setAccionPendiente(fullPath);
      setAuthOpen(true);
      router.replace(redirectTo);
    }
  }, [mounted, vigencia.lista, isAuthenticated, pathname, redirectTo, router, setAccionPendiente, setAuthOpen]);

  if (!mounted || !vigencia.lista || !isAuthenticated) {
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
