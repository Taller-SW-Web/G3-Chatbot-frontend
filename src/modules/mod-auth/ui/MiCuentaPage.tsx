"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, LockIcon } from "@/shared/ui/icons";
import { OtpCelularFlow } from "@/shared/auth/OtpCelularFlow";
import { useChatStore } from "@/shared/auth/chatStore";
import { container } from "@/shared/di/container";
import { clienteDesdePerfil } from "@/shared/auth/sesion";

/**
 * `/cuenta`: datos de sesión, verificación de celular (SPEC-04),
 * accesos a pedidos/reclamos/sugerencias y cierre de sesión.
 * Paridad con Mockups-Wireframes.
 */
export function MiCuentaPage() {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const setCliente = useChatStore((s) => s.setCliente);
  const accessToken = useChatStore((s) => s.accessToken);
  const logout = useChatStore((s) => s.logout);
  const [otp, setOtp] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  // Reintenta consultar perfil sin cerrar la sesión ni borrar el token (SPEC-03)
  async function reintentarPerfil() {
    setCargando(true);
    setErrorPerfil(null);
    try {
      const perfil = await container.auth.fetchProfile();
      setCliente(clienteDesdePerfil(perfil, cliente?.correo ?? ""));
    } catch {
      setErrorPerfil("No pudimos cargar tus datos en este momento");
    } finally {
      setCargando(false);
    }
  }

  // El logout debe revocar la cookie de refresh en el backend; si falla, igual se limpia el estado local.
  async function cerrarSesion() {
    try {
      await container.auth.logout();
    } catch {
      // sin red o API caída: se limpia localmente de todos modos
    } finally {
      logout();
    }
    router.push("/");
  }

  // Visitante sin sesión
  if (!cliente && !accessToken) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center screen-enter">
        <p className="text-[14px] text-text-secondary">Inicia sesión para ver tu cuenta.</p>
        <button
          onClick={() => router.push("/")}
          className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-[0.98] transition-all shadow-sm"
        >
          VOLVER AL INICIO
        </button>
      </div>
    );
  }

  // Perfil no disponible (503 / fallo de red) manteniendo la sesión activa
  if (errorPerfil || (!cliente && accessToken)) {
    return (
      <div role="alert" className="p-6 flex flex-col items-center gap-3 text-center screen-enter">
        <p className="text-[14px] text-error-default font-medium">
          {errorPerfil || "No pudimos cargar tus datos en este momento"}
        </p>
        <button
          onClick={reintentarPerfil}
          disabled={cargando}
          className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
        >
          {cargando ? "CARGANDO…" : "REINTENTAR"}
        </button>
        <button
          onClick={cerrarSesion}
          className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-white border border-error-default/40 text-error-default hover:bg-error-background active:scale-[0.98] transition-all shadow-xs"
        >
          CERRAR SESIÓN
        </button>
      </div>
    );
  }

  const tieneDocumento = Boolean(cliente?.tipoDocumento && cliente?.documentoEnmascarado);
  const tieneCelular = Boolean(cliente?.celularEnmascarado);

  return (
    <div className="p-4 flex flex-col gap-4 screen-enter">
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Mi cuenta</p>
      <div className="rounded-md bg-white border border-border-default divide-y divide-surface-cloud-subtle wf-card shadow-xs">
        <div className="flex justify-between gap-2 px-3 py-2.5 text-[14px]">
          <span className="text-text-secondary">Nombre completo</span>
          <span className="font-bold text-right">{cliente?.nombreCompleto}</span>
        </div>
        <div className="flex justify-between items-center gap-2 px-3 py-2.5 text-[14px]">
          <span className="text-text-secondary">Correo</span>
          <span className="font-bold text-right">
            {cliente?.correo}{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-volt-soft text-accent-volt-ink text-[10px] font-bold px-2 py-0.5 ml-1">
              <CheckIcon size={16} />Verificado
            </span>
          </span>
        </div>
        <div className="flex justify-between items-center gap-2 px-3 py-2.5 text-[14px]">
          <span className="text-text-secondary">Celular (opcional)</span>
          <span className="font-bold text-right">
            {tieneCelular ? (
              <>
                {cliente?.celularEnmascarado}{" "}
                <span
                  className={`inline-flex items-center gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 ml-1 ${
                    cliente?.celularVerificado ? "bg-accent-volt-soft text-accent-volt-ink" : "bg-action-primary-soft text-ember-deep"
                  }`}
                >
                  {cliente?.celularVerificado ? "Celular verificado" : "Sin verificar"}
                </span>
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
        {tieneDocumento && (
          <div className="flex justify-between gap-2 px-3 py-2.5 text-[14px]">
            <span className="text-text-secondary">Documento</span>
            <span className="font-bold">{`${cliente?.tipoDocumento} ${cliente?.documentoEnmascarado}`}</span>
          </div>
        )}
      </div>

      {tieneCelular && !cliente?.celularVerificado && (
        !otp ? (
          <button
            onClick={() => setOtp(true)}
            className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse hover:bg-surface-ink-soft active:scale-[0.98] transition-all shadow-sm"
          >
            VERIFICAR CELULAR
          </button>
        ) : (
          <OtpCelularFlow
            celularEnmascarado={cliente?.celularEnmascarado}
            onVerificado={() => {
              if (cliente) {
                setCliente({ ...cliente, celularVerificado: true });
              }
              setOtp(false);
            }}
            onCancelar={() => setOtp(false)}
          />
        )
      )}

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => router.push("/pedidos")}
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-white border border-border-default text-text-primary hover:bg-surface-cloud active:scale-[0.98] transition-all shadow-xs"
        >
          MIS PEDIDOS
        </button>
        <button
          onClick={() => router.push("/pedidos/reclamos")}
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-white border border-border-default text-text-primary hover:bg-surface-cloud active:scale-[0.98] transition-all shadow-xs"
        >
          MIS RECLAMOS
        </button>
        <button
          onClick={() => router.push("/sugerencias")}
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse hover:bg-surface-ink-soft active:scale-[0.98] transition-all shadow-sm"
        >
          ENVIAR SUGERENCIA / REPORTAR BUG
        </button>
        <button
          onClick={cerrarSesion}
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-white border border-error-default/40 text-error-default hover:bg-error-background active:scale-[0.98] transition-all shadow-xs"
        >
          CERRAR SESIÓN
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] tracking-[0.18em] text-text-secondary font-bold">SE EDITA EN SEGURIDAD / MARKETPLACE</p>
        {["Nombre o correo", "Cambiar celular", "Contraseña y MFA", "Direcciones guardadas"].map((t) => (
          <div key={t} className="flex items-center justify-between bg-white border border-border-default rounded-sm px-3 py-2.5 text-[14px]">
            <span>{t}</span>
            <LockIcon size={16} />
          </div>
        ))}
      </div>
    </div>
  );
}
