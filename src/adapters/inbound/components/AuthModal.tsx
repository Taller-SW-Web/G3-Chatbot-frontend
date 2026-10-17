"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { XIcon } from "./icons";
import { BrandLogo } from "./BrandLogo";
import { LoginForm } from "./forms/LoginForm";
import { OtpMfaForm } from "./forms/OtpMfaForm";
import { RegistroForm } from "./forms/RegistroForm";
import { ReenviarVerificacionForm } from "./forms/ReenviarVerificacionForm";
import { useChatStore } from "@/application/state/chatStore";
import { container } from "@/infrastructure/di/container";
import {
  buildLoginGreeting,
  clienteDesdePerfil,
  clienteDesdeUsuario,
  describeLoginFailure,
  describeMfaResendFailure,
  describeOtpFailure,
  describeRegistroFailure,
  describeReenvioFailure,
  REENVIO_NEUTRO,
} from "@/domain/utils/sesion";
import type { LoginInput } from "@/domain/schemas/login.schema";
import type { RegistroInput } from "@/domain/schemas/registro.schema";
import type { PoliticaContrasena } from "@/domain/utils/passwordPolicy";

type Paso = "login" | "mfa" | "verificar-correo" | "reenviar";
type Canal = "EMAIL" | "SMS";
type ErroresCampo = Partial<Record<keyof RegistroInput, string>>;

type ProblemShape = {
  code?: string;
  intentosRestantes?: number;
  errores?: Array<{ campo?: string; mensaje?: string }>;
};

function problemDe(error: unknown): {
  status?: number;
  code?: string;
  intentosRestantes?: number;
  errores?: ProblemShape["errores"];
} {
  const e = error as AxiosError<ProblemShape>;
  return {
    status: e?.response?.status,
    code: e?.response?.data?.code,
    intentosRestantes: e?.response?.data?.intentosRestantes,
    errores: e?.response?.data?.errores,
  };
}

/**
 * Global auth modal (AppShell). SPEC-01/02/03: registration, email
 * verification, login, MFA challenge and resume of the pending action. The
 * refresh token stays in its httpOnly cookie; only the short-lived access
 * token reaches the store.
 */
export function AuthModal() {
  const router = useRouter();
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const applySession = useChatStore((s) => s.applySession);
  const setCliente = useChatStore((s) => s.setCliente);
  const accionPendiente = useChatStore((s) => s.accionPendiente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setMensajePendiente = useChatStore((s) => s.setMensajePendiente);
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [paso, setPaso] = useState<Paso>("login");
  const [canal, setCanal] = useState<Canal>("EMAIL");
  const [contacto, setContacto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<ErroresCampo | undefined>();
  const [politica, setPolitica] = useState<PoliticaContrasena | undefined>();
  const [correoIngresado, setCorreoIngresado] = useState("");
  const [correoRegistrado, setCorreoRegistrado] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [reenvioEstado, setReenvioEstado] = useState<{ mensaje?: string; error?: string }>({});

  // Política de contraseña (SPEC-01 Req. 2): se pide una vez al abrir el registro.
  useEffect(() => {
    if (tab !== "registro" || politica) return;
    let activo = true;
    container.api
      .obtenerPoliticaContrasena()
      .then((p) => {
        if (activo) setPolitica(p);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [tab, politica]);

  function cerrar() {
    setAuthOpen(false);
    setPaso("login");
    setError(null);
  }

  function continuar() {
    const destino = accionPendiente;
    setAccionPendiente(null);
    cerrar();
    if (destino) router.push(destino);
  }

  function saludar(nombre?: string | null) {
    if (!accionPendiente) setMensajePendiente({ bot: buildLoginGreeting(nombre) });
  }

  async function hidratarPerfil(correoFallback: string) {
    try {
      const perfil = await container.api.fetchProfile();
      setCliente(clienteDesdePerfil(perfil, correoFallback));
    } catch {
      return;
    }
  }

  async function ingresar(d: LoginInput) {
    setCargando(true);
    setError(null);
    setCorreoIngresado(d.correo);
    try {
      const answer = await container.api.login(d.correo, d.password);
      if ("mfaRequerido" in answer) {
        setCanal(answer.canal);
        setContacto(d.correo);
        setPaso("mfa");
        return;
      }
      applySession(answer.accessToken, answer.expiresIn);
      setCliente(clienteDesdeUsuario(answer.usuario, d.correo));
      await hidratarPerfil(d.correo);
      saludar(answer.usuario?.nombreCompleto);
      continuar();
    } catch (error) {
      const { status, code } = problemDe(error);
      setError(describeLoginFailure(status, code).message);
    } finally {
      setCargando(false);
    }
  }

  async function registrar(d: RegistroInput) {
    setCargando(true);
    setError(null);
    setErroresCampo(undefined);
    try {
      const resultado = await container.api.registrar(d);
      setCorreoRegistrado(resultado.correoEnmascarado);
      setCorreoIngresado(d.correo);
      setReenvioEstado({});
      setPaso("verificar-correo");
    } catch (error) {
      const { status, code, errores } = problemDe(error);
      const fallo = describeRegistroFailure(status, code, errores);
      setError(fallo.message);
      setErroresCampo(fallo.erroresCampo);
    } finally {
      setCargando(false);
    }
  }

  async function reenviar(correo: string) {
    setReenviando(true);
    setReenvioEstado({});
    try {
      await container.api.reenviarVerificacion(correo);
      setReenvioEstado({ mensaje: REENVIO_NEUTRO });
    } catch (error) {
      const { status, code } = problemDe(error);
      setReenvioEstado({ error: describeReenvioFailure(status, code) });
    } finally {
      setReenviando(false);
    }
  }

  async function verificar(codigo: string) {
    setCargando(true);
    setError(null);
    try {
      const opened = await container.api.verifyMfaCode(codigo);
      applySession(opened.accessToken, opened.expiresIn);
      setCliente(clienteDesdeUsuario(opened.usuario, contacto));
      await hidratarPerfil(contacto);
      saludar(opened.usuario?.nombreCompleto);
      continuar();
    } catch (error) {
      const { status, code, intentosRestantes } = problemDe(error);
      const fallo = describeOtpFailure(status, code, intentosRestantes);
      setError(fallo.message);
      if (fallo.volverALogin) setPaso("login");
    } finally {
      setCargando(false);
    }
  }

  async function solicitarCodigo(next: Canal) {
    setError(null);
    try {
      await container.api.requestMfaCode(next);
    } catch (error) {
      const { status, code } = problemDe(error);
      const fallo = describeMfaResendFailure(status, code);
      setError(fallo.message);
      if (fallo.volverALogin) setPaso("login");
    }
  }

  function abrirReenvio() {
    setReenvioEstado({});
    setPaso("reenviar");
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={cerrar}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        {paso === "verificar-correo" ? (
          <div className="flex flex-col items-center gap-3 text-center p-2">
            <h2 className="font-heading text-[20px]">¡REVISA TU CORREO!</h2>
            <p className="text-[14px] text-text-secondary">
              Te enviamos un enlace a {correoRegistrado} para activar tu cuenta. Vence en 24 horas.
            </p>
            {reenvioEstado.mensaje && (
              <p role="status" className="text-[12px] text-success-default">{reenvioEstado.mensaje}</p>
            )}
            {reenvioEstado.error && (
              <p role="alert" className="text-[12px] text-error-default">{reenvioEstado.error}</p>
            )}
            <button onClick={() => { setPaso("login"); setTab("login"); }}
              className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">
              YA VERIFIQUÉ, INICIAR SESIÓN
            </button>
            <button onClick={() => void reenviar(correoIngresado)} disabled={reenviando}
              className="text-[12px] font-semibold underline text-text-secondary disabled:opacity-60">
              {reenviando ? "Enviando…" : "Reenviar correo"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center pt-1">
              <BrandLogo variant="negro" className="h-16 w-auto" />
            </div>
            <div className="flex items-center justify-between">
              <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">
                {paso === "mfa" ? "Verifica tu identidad"
                  : paso === "reenviar" ? "Reenviar verificación"
                  : tab === "login" ? "Inicia sesión" : "Crea tu cuenta"}
              </p>
              <button aria-label="Cerrar" onClick={cerrar}
                className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse">
                <XIcon size={20} />
              </button>
            </div>
            {paso === "mfa" ? (
              <OtpMfaForm
                canal={canal}
                contacto={contacto}
                onOk={verificar}
                onReenviar={() => void solicitarCodigo(canal)}
                onCambiarCanal={() => {
                  const next: Canal = canal === "EMAIL" ? "SMS" : "EMAIL";
                  setCanal(next);
                  void solicitarCodigo(next);
                }}
                error={error}
                cargando={cargando}
              />
            ) : paso === "reenviar" ? (
              <>
                <p className="text-[12px] text-text-secondary">
                  Si tu cuenta sigue sin verificar, te enviamos un enlace nuevo.
                </p>
                <ReenviarVerificacionForm
                  correoInicial={correoIngresado}
                  onEnviar={(correo) => void reenviar(correo)}
                  mensaje={reenvioEstado.mensaje}
                  error={reenvioEstado.error}
                  cargando={reenviando}
                />
                <button type="button" onClick={() => setPaso("login")}
                  className="text-[12px] font-semibold underline text-text-secondary">
                  Volver a iniciar sesión
                </button>
              </>
            ) : (
              <>
                <p className="text-[12px] text-text-secondary">Necesitas una cuenta para pagar y ver tu historial. Como invitado puedes chatear y ver ofertas.</p>
                <div className="grid grid-cols-2 gap-2 rounded-md bg-surface-cloud-subtle p-1">
                  <button onClick={() => { setTab("login"); setError(null); setErroresCampo(undefined); }} className={`wf-btn py-2.5 text-[12px] font-bold ${tab === "login" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>INICIAR SESIÓN</button>
                  <button onClick={() => { setTab("registro"); setError(null); }} className={`wf-btn py-2.5 text-[12px] font-bold ${tab === "registro" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>CREAR CUENTA</button>
                </div>
                {tab === "login" ? (
                  <LoginForm onOk={ingresar} onReenviar={abrirReenvio} error={error} cargando={cargando} />
                ) : (
                  <RegistroForm
                    onOk={registrar}
                    politica={politica}
                    error={error}
                    erroresCampo={erroresCampo}
                    cargando={cargando}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
