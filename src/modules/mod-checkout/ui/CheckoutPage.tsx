"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { useChatStore } from "@/shared/auth/chatStore";
import { container } from "@/shared/di/container";
import { DireccionForm } from "@/modules/mod-checkout/ui/forms/DireccionForm";
import { PagoForm } from "@/modules/mod-checkout/ui/forms/PagoForm";
import type { DireccionInput } from "@/modules/mod-checkout/domain/schemas/direccion.schema";
import type { PagoInput } from "@/modules/mod-checkout/domain/schemas/pago.schema";
import type { CheckoutSesionData, LineaDesactualizada } from "@/modules/mod-checkout/ports/checkoutPort";
import { useCarrito } from "@/modules/mod-cart/public";
import { CotizacionEnvio, useCotizacionEnvio } from "@/modules/mod-shipping/public";
import { OtpCelularFlow } from "@/shared/auth/OtpCelularFlow";

type ProblemShape = {
  code?: string;
  detail?: string;
  intentosRestantes?: number;
  motivo?: string;
  summary?: ResumenServidor;
  /** Número enmascarado que devuelve el 403 CELULAR_NO_VERIFICADO. */
  celularEnmascarado?: string;
  /** Detalle por línea del 409 CARRITO_DESACTUALIZADO (convención pendiente de backend). */
  lineas?: unknown;
  detalle?: unknown;
};

const MOTIVOS_STOCK: Record<string, string> = {
  AGOTADO: "se agotó mientras elegías",
  SIN_STOCK: "se agotó mientras elegías",
  STOCK_INSUFICIENTE: "ya no tiene stock suficiente",
  INSUFICIENTE: "ya no tiene stock suficiente",
  PRECIO_CAMBIADO: "cambió de precio",
  NO_DISPONIBLE: "ya no está disponible",
};

/** Normaliza el detalle por línea sin confiar en la forma exacta del backend. */
function lineasDesactualizadas(data: ProblemShape | undefined): LineaDesactualizada[] {
  const raw = Array.isArray(data?.lineas)
    ? data.lineas
    : Array.isArray(data?.detalle)
      ? data.detalle
      : [];
  return raw.filter(
    (linea): linea is LineaDesactualizada =>
      typeof linea === "object" && linea !== null && typeof (linea as { sku?: unknown }).sku === "string"
  );
}

function textoLinea(linea: LineaDesactualizada): string {
  const nombre = linea.nombre ?? linea.sku;
  if (linea.motivo && MOTIVOS_STOCK[linea.motivo]) return `${nombre} ${MOTIVOS_STOCK[linea.motivo]}`;
  return linea.mensaje ? `${nombre}: ${linea.mensaje}` : `${nombre} cambió mientras elegías`;
}

type ResumenServidor = {
  lineas?: Array<{ sku: string; cantidad: number; precioUnitario: number }>;
  subtotal?: number;
  descuento?: number;
  costoEnvio?: number;
  total?: number;
};

const newKey = (prefix: string) =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}`;

const money = (n: number | undefined) => `S/ ${Number(n ?? 0).toFixed(2)}`;

/**
 * `/checkout`: 2 pasos (dirección → tarjeta) con formularios RHF+Zod,
 * temporizador de 15 min, control de hasta 3 intentos, y simulación de pago. SPEC-12, 14.
 */
export function CheckoutPage() {
  const router = useRouter();
  const carrito = useChatStore((s) => s.carrito);
  const cliente = useChatStore((s) => s.cliente);
  const setUltimoPedido = useChatStore((s) => s.setUltimoPedido);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [dir, setDir] = useState<DireccionInput | null>(null);
  const [pago, setPago] = useState<PagoInput | null>(null);
  const [guardarDireccion, setGuardarDireccion] = useState(false);
  // SPEC-04: el backend bloquea el checkout con 403 CELULAR_NO_VERIFICADO (modo legado).
  const [otpRequerido, setOtpRequerido] = useState(false);
  const [celularOtp, setCelularOtp] = useState<string | undefined>();
  // El correo es el contacto verificado por defecto: si el backend no lo puede
  // confirmar, se ofrece revisar la cuenta en lugar de abrir el OTP del celular.
  const [contactoNoVerificado, setContactoNoVerificado] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [creandoCheckout, setCreandoCheckout] = useState(false);

  const [checkoutSesion, setCheckoutSesion] = useState<CheckoutSesionData | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number>(3);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(15 * 60);
  const [expirado, setExpirado] = useState(false);
  const [avisoDireccion, setAvisoDireccion] = useState<string | null>(null);

  // Clave de idempotencia única por intento de pago (conservada en reintentos del mismo intento)
  const [idempotencyKeyPago, setIdempotencyKeyPago] = useState<string>(() => newKey("pay"));

  // Summary returned with 409 CARRITO_DESACTUALIZADO: the server-side amounts the user must re-confirm.
  const [resumenActualizado, setResumenActualizado] = useState<ResumenServidor | null>(null);
  // SPEC-10: detalle por línea cuando el stock cambió desde que se agregó.
  const [lineasCambiadas, setLineasCambiadas] = useState<LineaDesactualizada[]>([]);
  // Idempotency-Key of the checkout attempt: reused while the submitted body is unchanged.
  const checkoutKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const { query: carritoQuery } = useCarrito();
  const total = carritoQuery.data?.total ?? 0;
  const totalDisponible = resumenActualizado?.total != null || carritoQuery.data?.total != null;
  // El envío sale de Despacho (SPEC-12); sin cotización no se puede confirmar.
  const { cotizacion, cotizando, error: errorCotizacion, reintentar } = useCotizacionEnvio(dir);
  const envio = cotizacion?.costoEnvio ?? 0;
  const totalEstimado = resumenActualizado?.total ?? total + envio;

  // Importes calculados y confirmados por el backend en la sesión de checkout
  const totalServidor = checkoutSesion?.total ?? totalEstimado;
  const costoEnvioServidor = Number(checkoutSesion?.summary?.costoEnvio ?? envio);

  // SPEC-05 · delta M5: `IR_A_CHECKOUT` llega con #direccion. El AuthGuard monta el
  // formulario después del primer render, así que el scroll del hash inicial no basta.
  useEffect(() => {
    if (paso !== 1 || typeof window === "undefined" || window.location.hash !== "#direccion") return;
    const timer = window.setTimeout(() => {
      document.getElementById("direccion")?.scrollIntoView({ block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [paso]);

  // Temporizador regresivo de 15 minutos
  useEffect(() => {
    if (paso !== 2 || expirado) return;
    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setExpirado(true);
          setErrorPago("El checkout ha expirado. Por favor, vuelve a iniciar el proceso.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paso, expirado]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

  async function confirmarDireccion() {
    if (!dir) return;
    setCreandoCheckout(true);
    setErrorPago(null);
    setContactoNoVerificado(false);

    try {
      const customerEmail = typeof cliente?.correo === "string" ? cliente.correo.trim() : "";
      const payload = {
        direccion: {
          direccionExacta: dir.direccion,
          distrito: dir.distrito,
          referencia: dir.referencia,
        },
        contacto: {
          nombreCompleto: dir.nombre,
          tipoDocumento: dir.docTipo,
          numeroDocumento: dir.docNum,
          ...(customerEmail ? { email: customerEmail } : {}),
        },
        ...(guardarDireccion ? { guardarDireccion: true } : {}),
      };
      const fingerprint = JSON.stringify(payload);
      if (checkoutKeyRef.current?.fingerprint !== fingerprint) {
        checkoutKeyRef.current = { fingerprint, key: newKey("chk") };
      }
      const sesion = await container.checkout.iniciarCheckout(payload, checkoutKeyRef.current.key);
      checkoutKeyRef.current = null;
      setResumenActualizado(null);
      setLineasCambiadas([]);
      setOtpRequerido(false);
      setContactoNoVerificado(false);
      setAccionPendiente(null);

      setCheckoutSesion(sesion);
      if (sesion.avisoDireccion) {
        setAvisoDireccion(sesion.avisoDireccion);
      }
      setIntentosRestantes(sesion.intentosRestantes ?? 3);
      setExpirado(false);
      if (sesion.expiresAt) {
        const diffSegundos = Math.max(0, Math.floor((new Date(sesion.expiresAt).getTime() - Date.now()) / 1000));
        setSegundosRestantes(diffSegundos || 15 * 60);
      }
      setPaso(2);
    } catch (err: unknown) {
      // Bloquear avance al paso 2 y mostrar el error visible
      const errorAxios = err as AxiosError<ProblemShape>;
      const status = errorAxios?.response?.status;
      const data = errorAxios?.response?.data;

      if (status === 403 && data?.code === "CONTACTO_NO_VERIFICADO") {
        // El correo de la cuenta es el contacto verificado: no se pide OTP de celular.
        checkoutKeyRef.current = null;
        setOtpRequerido(false);
        setAccionPendiente(null);
        setContactoNoVerificado(true);
        setErrorPago(
          data?.motivo === "SEGURIDAD_NO_DISPONIBLE"
            ? "No pudimos confirmar tu contacto ahora. Inténtalo de nuevo en unos minutos."
            : "No pudimos confirmar tu correo. Revisa tu cuenta o inténtalo de nuevo."
        );
      } else if (status === 403 && data?.code === "CELULAR_NO_VERIFICADO") {
        // SPEC-04: se ofrece la verificación en ese momento y se recuerda la acción pendiente.
        checkoutKeyRef.current = null;
        setAccionPendiente("INICIAR_CHECKOUT");
        setCelularOtp(data?.celularEnmascarado);
        setOtpRequerido(true);
        setErrorPago(null);
      } else if (status === 409 && data?.code === "CARRITO_DESACTUALIZADO") {
        // The cart changed: new attempt, new key, and the user confirms the updated summary.
        checkoutKeyRef.current = null;
        setResumenActualizado(data.summary ?? null);
        setLineasCambiadas(lineasDesactualizadas(data));
        setErrorPago("El carrito cambió en el servidor. Revisa el resumen actualizado y confirma nuevamente.");
      } else if (status === 409) {
        setErrorPago(data?.detail ?? "No se pudo crear el checkout con el carrito actual. Revisa tu carrito.");
      } else if (status === 422 && data?.code === "SIN_COBERTURA") {
        setErrorPago("No tenemos cobertura de envío para el distrito elegido. Prueba con otra dirección.");
      } else if (status === 400) {
        setErrorPago(data?.detail ?? "Revisa los datos de dirección y contacto e inténtalo de nuevo.");
      } else {
        setErrorPago(data?.detail ?? "No se pudo iniciar el checkout en el servidor. Inténtalo de nuevo.");
      }
      setCheckoutSesion(null);
    } finally {
      setCreandoCheckout(false);
    }
  }

  async function reintentarCheckout() {
    setExpirado(false);
    setErrorPago(null);
    setSegundosRestantes(15 * 60);
    setCheckoutSesion(null);
    checkoutKeyRef.current = null;
    setIdempotencyKeyPago(newKey("pay"));
    await confirmarDireccion();
  }

  async function pagar() {
    if (!dir || !pago || !checkoutSesion?.id || pagando || expirado || intentosRestantes <= 0) return;
    setPagando(true);
    setErrorPago(null);

    try {
      const checkoutId = checkoutSesion.id;
      const res = await container.checkout.pagarCheckout(
        checkoutId,
        {
          numeroTarjeta: pago.tarjetaNum,
          titular: pago.titular || (cliente?.nombreCompleto || "Cliente"),
          vencimiento: pago.vencimiento,
          cvv: pago.cvv,
        },
        idempotencyKeyPago
      );

      const orderId = res.orderId || checkoutSesion.orderId;
      if (!orderId) {
        setErrorPago("No se pudo obtener el identificador del pedido confirmado.");
        return;
      }

      if (res.avisoDireccion) {
        setAvisoDireccion(res.avisoDireccion);
      }

      setUltimoPedido({
        orderId,
        total: res.monto || totalServidor,
        subtotal: Number(checkoutSesion.summary?.subtotal ?? carrito.subtotal),
        costoEnvio: costoEnvioServidor,
        lineas: (checkoutSesion.summary?.lineas && Array.isArray(checkoutSesion.summary.lineas) && checkoutSesion.summary.lineas.length > 0)
          ? (checkoutSesion.summary.lineas as Array<{ sku?: string; nombre?: string; cantidad: number; precioUnitario?: number; precio?: number }>).map((l) => ({
              nombre: l.nombre || l.sku || "Producto",
              cantidad: l.cantidad,
              precio: l.precioUnitario ?? l.precio ?? 0,
            }))
          : carrito.lineas.map((l) => ({
              nombre: l.producto.nombre,
              cantidad: l.cantidad,
              precio: l.producto.precio,
            })),
        direccion: dir.direccion,
        distrito: dir.distrito,
        nombre: dir.nombre,
        tarjetaMarca: res.marca || "Tarjeta",
        tarjetaLast4: res.ultimos4 || pago.tarjetaNum.replace(/\D/g, "").slice(-4) || "••••",
        correoEnmascarado: res.correoEnmascarado,
        mensajeConfirmacion: res.mensaje,
      });

      router.push("/exito");
    } catch (err: unknown) {
      const errorAxios = err as AxiosError<ProblemShape>;
      const status = errorAxios?.response?.status;
      const data = errorAxios?.response?.data;

      if (status === 402) {
        // En caso de rechazo de tarjeta, generar nueva clave para el siguiente intento con otra tarjeta
        setIdempotencyKeyPago(newKey("pay"));
        const restantes = typeof data?.intentosRestantes === "number" ? data.intentosRestantes : intentosRestantes - 1;
        setIntentosRestantes(restantes);
        setErrorPago(
          data?.detail ??
            (data?.motivo === "FONDOS_INSUFICIENTES"
              ? "Tu tarjeta fue rechazada por fondos insuficientes. Puedes intentar con otra tarjeta."
              : "Tu tarjeta fue rechazada. Puedes intentar con otra tarjeta.")
        );
      } else if (status === 410) {
        setExpirado(true);
        setErrorPago("El checkout ha vencido hace más de 15 minutos. Tu carrito sigue guardado.");
      } else if (status === 400) {
        setErrorPago(data?.detail ?? "Datos de tarjeta inválidos. Revisa e inténtalo de nuevo.");
      } else if (status === 401) {
        setErrorPago("Tu sesión ya no es válida. Por favor inicia sesión nuevamente.");
      } else if (status === 503) {
        // En caso de timeout o indisponibilidad temporal, conservar la misma clave de idempotencia
        setErrorPago("El servicio de pagos no responde. Puedes reintentar la operación.");
      } else {
        setErrorPago("Ocurrió un error al procesar el pago. Por favor intenta de nuevo.");
      }
    } finally {
      setPagando(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="rounded-md bg-white border border-border-default px-4 py-2.5 flex justify-between items-center text-[13px]">
        <span className="text-text-secondary">
          {paso === 2 ? `Quedan ${tiempoFormateado} · Intentos ${intentosRestantes}/3` : "Dirección de entrega"}
        </span>
        <span className="font-bold">Paso {paso} de 2</span>
      </div>

      <div className="rounded-md bg-surface-ink text-text-inverse px-4 py-3 flex justify-between items-center">
        <span className="text-[14px] font-semibold">Total a pagar:</span>
        <span className="font-heading text-[20px]">{paso === 1 && !totalDisponible ? carritoQuery.isError ? "Total no disponible" : "Calculando total…" : `S/ ${(paso === 2 ? totalServidor : totalEstimado).toFixed(2)}`}</span>
      </div>

      {paso === 1 ? (
        <>
          {otpRequerido && (
            <div data-testid="checkout-otp-celular">
              <p className="text-[13px] font-semibold text-text-primary">
                Para coordinar la entrega necesitamos confirmar tu celular{" "}
                {celularOtp ?? cliente?.celularEnmascarado ?? ""}
              </p>
              <OtpCelularFlow
                celularEnmascarado={celularOtp ?? cliente?.celularEnmascarado}
                onVerificado={() => {
                  setOtpRequerido(false);
                  setAccionPendiente(null);
                  void confirmarDireccion();
                }}
                onCancelar={() => {
                  setOtpRequerido(false);
                  setAccionPendiente(null);
                }}
              />
            </div>
          )}
          {errorPago && (
            <div
              role="alert"
              className="rounded-md bg-action-primary-soft text-ember-deep border border-border-default p-3 text-[13px] font-medium flex flex-col gap-2 items-start"
            >
              <span>{errorPago}</span>
              {contactoNoVerificado && (
                <button
                  type="button"
                  onClick={() => router.push("/cuenta")}
                  className="wf-btn px-4 py-2 text-[12px] font-bold bg-white border border-border-default"
                >
                  IR A MI CUENTA
                </button>
              )}
            </div>
          )}
          {!totalDisponible && carritoQuery.isError && (
            <p role="alert" className="text-[12px] text-error-default">
              No pudimos obtener el total del carrito. <button type="button" onClick={() => void carritoQuery.refetch()} className="underline font-semibold">Reintentar</button>
            </p>
          )}
          {resumenActualizado && (
            <div className="rounded-md bg-white border border-border-default p-3 text-[13px] flex flex-col gap-1" data-testid="resumen-actualizado">
              <p className="font-semibold">Resumen actualizado</p>
              {(resumenActualizado.lineas ?? []).map((l) => (
                <p key={l.sku}>
                  {l.cantidad} x {l.sku} · {money(l.precioUnitario)}
                </p>
              ))}
              <p>Subtotal: {money(resumenActualizado.subtotal)}</p>
              <p>Descuento: {money(resumenActualizado.descuento)}</p>
              <p>Envío: {money(resumenActualizado.costoEnvio)}</p>
              <p className="font-bold">Total: {money(resumenActualizado.total)}</p>
            </div>
          )}
          {lineasCambiadas.length > 0 && (
            <div
              data-testid="detalle-stock"
              role="alert"
              className="rounded-md bg-error-background border border-error-default p-3 text-[13px] flex flex-col gap-2"
            >
              <p className="font-semibold">El stock cambió mientras elegías</p>
              {lineasCambiadas.map((linea) => (
                <p key={linea.sku}>{textoLinea(linea)}</p>
              ))}
              <button
                type="button"
                onClick={() => router.push("/carrito")}
                className="wf-btn self-start px-4 py-2 text-[12px] font-bold bg-white border border-border-default"
              >
                VOLVER AL CARRITO
              </button>
            </div>
          )}
          {cliente?.correo && (
            <div
              data-testid="contacto-compra"
              className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 text-[13px]"
            >
              <p className="text-[12px] uppercase tracking-[0.08em] text-text-secondary font-semibold">
                Contacto de compra
              </p>
              <p className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                {cliente.correo}
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-volt-soft text-accent-volt-ink text-[10px] font-bold px-2 py-0.5">
                  Verificado
                </span>
              </p>
            </div>
          )}
          <DireccionForm
            onValid={setDir}
            guardarDireccion={guardarDireccion}
            onGuardarChange={setGuardarDireccion}
            direccionGuardada={checkoutSesion?.direccionGuardada}
            avisoDireccion={avisoDireccion}
          />
          <CotizacionEnvio
            cotizacion={cotizacion}
            cotizando={cotizando}
            error={errorCotizacion}
            onReintentar={reintentar}
          />
          <p className="text-[12px] text-text-secondary">
            El documento del comprobante puede ser distinto al de tu cuenta.
          </p>
          <button
            onClick={confirmarDireccion}
            disabled={!dir || !cotizacion || !totalDisponible || creandoCheckout}
            className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45"
          >
            {creandoCheckout ? "Confirmando resumen…" : totalDisponible ? `Continuar al pago · S/ ${totalEstimado.toFixed(2)}` : carritoQuery.isError ? "Continuar al pago · Total no disponible" : "Continuar al pago · Calculando total…"}
          </button>
          {!dir && <p className="text-[12px] text-text-secondary">Completa la dirección y el documento para continuar.</p>}
        </>
      ) : (
        <>
          <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
            <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">
              Tarjeta · Total a pagar: S/ {totalServidor.toFixed(2)}
            </p>
            <p className="text-[12px] rounded-md bg-warning-background text-warning-default p-2 font-medium">
              Pago simulado – entorno académico. No uses tarjetas reales.
            </p>
          </div>

          {errorPago && (
            <div
              role="alert"
              className="rounded-md bg-action-primary-soft text-ember-deep border border-border-default p-3 text-[13px] font-medium flex flex-col gap-2 items-start"
            >
              <span>{errorPago}</span>
              {expirado && (
                <button
                  type="button"
                  data-testid="btn-reintentar-checkout"
                  onClick={reintentarCheckout}
                  disabled={creandoCheckout}
                  className="wf-btn px-4 py-2 text-[12px] font-bold bg-white border border-border-default"
                >
                  {creandoCheckout ? "Iniciando checkout…" : "Volver a intentar"}
                </button>
              )}
            </div>
          )}

          <PagoForm onValid={setPago} disabled={pagando || expirado || intentosRestantes <= 0} />

          <p className="text-[12px] text-text-secondary">
            En este canal solo aceptamos tarjeta. Tienes 15 minutos y hasta 3 intentos para completar el pago.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setPaso(1);
                setExpirado(false);
                setErrorPago(null);
                setCheckoutSesion(null);
                checkoutKeyRef.current = null;
                setSegundosRestantes(15 * 60);
              }}
              disabled={pagando}
              className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default"
            >
              VOLVER
            </button>
            <button
              onClick={pagar}
              disabled={!pago || !checkoutSesion?.id || pagando || expirado || intentosRestantes <= 0}
              className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-45"
            >
              {pagando ? "PROCESANDO…" : `PAGAR S/ ${totalServidor.toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
