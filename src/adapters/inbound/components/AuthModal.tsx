"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon, MailIcon } from "./icons";
import { BrandLogo } from "./BrandLogo";
import { LoginForm } from "./forms/LoginForm";
import { RegistroForm } from "./forms/RegistroForm";
import { useChatStore } from "@/application/state/chatStore";
import { DEMO_CLIENTE } from "@/adapters/outbound/mockData";

/**
 * Modal global de autenticación (AppShell). Login / crear cuenta con
 * formularios RHF+Zod; la demo entra con correo ya verificado.
 * Al entrar continúa a la acción pendiente (pagar, historial, CTA del chat).
 */
export function AuthModal() {
  const router = useRouter();
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const setToken = useChatStore((s) => s.setToken);
  const setCliente = useChatStore((s) => s.setCliente);
  const accionPendiente = useChatStore((s) => s.accionPendiente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [verificando, setVerificando] = useState(false);

  function cerrar() {
    setAuthOpen(false);
    setVerificando(false);
  }

  function entrarDemo() {
    setToken("demo-token");
    setCliente({ ...DEMO_CLIENTE });
    const destino = accionPendiente;
    setAccionPendiente(null);
    cerrar();
    if (destino) router.push(destino);
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={cerrar}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        {!verificando ? (
          <>
            <div className="flex justify-center pt-1">
              <BrandLogo variant="negro" className="h-16 w-auto" />
            </div>
            <div className="flex items-center justify-between">
              <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">
                {tab === "login" ? "Inicia sesión" : "Crea tu cuenta"}
              </p>
              <button aria-label="Cerrar" onClick={cerrar}
                className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse">
                <XIcon size={20} />
              </button>
            </div>
            <p className="text-[12px] text-text-secondary">Necesitas una cuenta para pagar y ver tu historial. Como invitado puedes chatear y ver ofertas.</p>
            <div className="grid grid-cols-2 gap-2 rounded-md bg-surface-cloud-subtle p-1">
              <button onClick={() => setTab("login")} className={`wf-btn py-2.5 text-[12px] font-bold ${tab === "login" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>INICIAR SESIÓN</button>
              <button onClick={() => setTab("registro")} className={`wf-btn py-2.5 text-[12px] font-bold ${tab === "registro" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>CREAR CUENTA</button>
            </div>
            {tab === "login" ? (
              <>
                <LoginForm onOk={() => entrarDemo()} />
                <button className="text-[12px] font-semibold underline text-text-secondary text-left">¿Olvidaste tu contraseña?</button>
              </>
            ) : (
              <RegistroForm onOk={() => setVerificando(true)} />
            )}
            <p className="text-[12px] text-text-secondary text-center">Simulado: la demo entra con correo ya verificado.</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center p-2">
            <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-accent-signal-soft text-accent-signal"><MailIcon size={24} /></div>
            <h2 className="font-heading text-[20px]">¡REVISA TU CORREO!</h2>
            <p className="text-[14px] text-text-secondary">Te enviamos un enlace a m****a@correo.com para activar tu cuenta. Vence en 24 horas.</p>
            <button onClick={entrarDemo} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">YA VERIFIQUÉ, INICIAR SESIÓN</button>
            <button className="text-[12px] font-semibold underline text-text-secondary">Reenviar correo</button>
          </div>
        )}
      </div>
    </div>
  );
}
