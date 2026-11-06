"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { useChatStore } from "@/application/state/chatStore";
import { container } from "@/infrastructure/di/container";
import { DireccionForm } from "../components/forms/DireccionForm";
import { PagoForm } from "../components/forms/PagoForm";
import type { DireccionInput } from "@/domain/schemas/direccion.schema";
import type { PagoInput } from "@/domain/schemas/pago.schema";
import { totalesCarrito } from "@/domain/entities/CarritoUI";
import type { CheckoutSesionData } from "@/ports/outbound/ChatbotApiPort";
import { useCotizacionEnvio } from "@/application/hooks/useCotizacionEnvio";
import { mensajeCotizacion } from "@/application/errors/cotizacionMensajes";

type ProblemShape = {
  code?: string;
  detail?: string;
  intentosRestantes?: number;
  motivo?: string;
};

/**
 * `/checkout`: 2 pasos (dirección → tarjeta) con formularios RHF+Zod,
 * temporizador de 15 min, control de hasta 3 intentos, y simulación de pago. SPEC-12, 14.
 */
export function CheckoutPage() {
  const router = useRouter();
  const carrito = useChatStore((s) => s.carrito);
  const cliente = useChatStore((s) => s.cliente);
  const setUltimoPedido = useChatStore((s) => s.setUltimoPedido);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [dir, setDir] = useState<DireccionInput | null>(null);
  const [pago, setPago] = useState<PagoInput | null>(null);
  const [pagando, setPagando] = useState(false);
  const [creandoCheckout, setCreandoCheckout] = useState(false);

  const [checkoutSesion, setCheckoutSesion] = useState<CheckoutSesionData | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number>(3);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(15 * 60);
  const [expirado, setExpirado] = useState(false);

  // Clave de idempotencia única por intento de pago (conservada en reintentos del mismo intento)
  const [idempotencyKeyPago, setIdempotencyKeyPago] = useState<string>(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`
  );

  const { total } = totalesCarrito(carrito);
  // El envío sale de Despacho (SPEC-12); sin cotización no se puede confirmar.
  const { cotizacion, cotizando, error: errorCotizacion, reintentar } = useCotizacionEnvio(dir);
  const envio = cotizacion?.costoEnvio ?? 0;
  const totalEstimado = total + envio;

  // Importes calculados y confirmados por el backend en la sesión de checkout
  const totalServidor = checkoutSesion?.total ?? totalEstimado;
  const costoEnvioServidor = Number(checkoutSesion?.summary?.costoEnvio ?? envio);

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

    try {
      const sesion = await container.api.iniciarCheckout({
        direccion: {
          direccionExacta: dir.direccion,
          distrito: dir.distrito,
          referencia: dir.referencia,
        },
        contacto: {
          nombreCompleto: dir.nombre,
          tipoDocumento: dir.docTipo,
          numeroDocumento: dir.docNum,
        },
        lineas: carrito.lineas.map((l) => ({
          sku: l.producto.sku,
          nombre: l.producto.nombre,
          cantidad: l.cantidad,
          precio: l.producto.precio,
        })),
        subtotal: total,
        costoEnvio: envio,
        descuento: 0,
        total: totalEstimado,
      });

      setCheckoutSesion(sesion);
      setIntentosRestantes(sesion.intentosRestantes ?? 3);
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

      if (status === 409) {
        setErrorPago("Los importes del carrito cambiaron en el servidor. Revisa los datos y confirma nuevamente.");
      } else {
        setErrorPago(data?.detail ?? "No se pudo iniciar el checkout en el servidor. Inténtalo de nuevo.");
      }
      setCheckoutSesion(null);
    } finally {
      setCreandoCheckout(false);
    }
  }

  async function pagar() {
    if (!dir || !pago || !checkoutSesion?.id || pagando || expirado || intentosRestantes <= 0) return;
    setPagando(true);
    setErrorPago(null);

    try {
      const checkoutId = checkoutSesion.id;
      const res = await container.api.pagarCheckout(
        checkoutId,
        {
          numeroTarjeta: pago.tarjetaNum,
          titular: pago.titular || (cliente?.nombreCompleto || "Cliente"),
          vencimiento: pago.vencimiento,
          cvv: pago.cvv,
        },
        idempotencyKeyPago
      );

      setUltimoPedido({
        orderId: res.orderId || checkoutSesion.orderId || "PED-2026-00891",
        total: res.monto || totalServidor,
        subtotal: total,
        costoEnvio: costoEnvioServidor,
        lineas: carrito.lineas.map((l) => ({
          nombre: l.producto.nombre,
          cantidad: l.cantidad,
          precio: l.producto.precio,
        })),
        direccion: dir.direccion,
        distrito: dir.distrito,
        nombre: dir.nombre,
        tarjetaMarca: res.marca || "Visa",
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
        setIdempotencyKeyPago(
          typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`
        );
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
        <span className="font-heading text-[20px]">S/ {(paso === 2 ? totalServidor : totalEstimado).toFixed(2)}</span>
      </div>

      {paso === 1 ? (
        <>
          {errorPago && (
            <div
              role="alert"
              className="rounded-md bg-action-primary-soft text-ember-deep border border-border-default p-3 text-[13px] font-medium"
            >
              {errorPago}
            </div>
          )}
          <DireccionForm onValid={setDir} />
          <p
            className={`text-[12px] ${errorCotizacion ? "text-error-default" : "text-text-secondary"}`}
            role={errorCotizacion ? "alert" : undefined}
          >
            {cotizando
              ? "Calculando envío…"
              : cotizacion
                ? `Envío a ${cotizacion.distrito}: S/ ${cotizacion.costoEnvio.toFixed(2)} · ${cotizacion.plazoEstimadoDias} día(s) hábil(es)`
                : errorCotizacion
                  ? mensajeCotizacion(errorCotizacion)
                  : "Envío: se calcula al elegir la dirección"}
          </p>
          {errorCotizacion && (
            <button
              type="button"
              onClick={reintentar}
              className="wf-chip w-fit px-3 py-1.5 text-[12px] font-semibold text-text-primary"
            >
              Reintentar cotización
            </button>
          )}
          <p className="text-[12px] text-text-secondary">
            El documento del comprobante puede ser distinto al de tu cuenta.
          </p>
          <button
            onClick={confirmarDireccion}
            disabled={!dir || !cotizacion || creandoCheckout}
            className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45"
          >
            {creandoCheckout ? "CONFIRMANDO RESUMEN…" : `CONFIRMAR Y PAGAR S/ ${totalEstimado.toFixed(2)}`}
          </button>
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
              className="rounded-md bg-action-primary-soft text-ember-deep border border-border-default p-3 text-[13px] font-medium"
            >
              {errorPago}
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
                setErrorPago(null);
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
