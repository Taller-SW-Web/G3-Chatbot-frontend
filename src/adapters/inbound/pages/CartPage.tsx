"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrashIcon, MinusIcon, PlusIcon } from "../components/icons";
import { AvisoCelularModal } from "../components/AvisoCelularModal";
import { BloqueError } from "../components/blocks/BloqueError";
import { useChatStore } from "@/application/state/chatStore";
import { useCarrito } from "@/application/hooks/useCarrito";
import { conversacionParaCarrito } from "@/domain/utils/carrito";
import { container } from "@/infrastructure/di/container";
import { problemCode, problemField } from "@/domain/utils/httpError";
import { mensajeCarrito } from "@/application/errors/carritoMensajes";
import { mensajeCupon } from "@/application/errors/cuponMensajes";
import { actualizarCantidadCarritoUseCase } from "@/application/use_cases/actualizarCantidadCarritoUseCase";
import { quitarDelCarritoUseCase } from "@/application/use_cases/quitarDelCarritoUseCase";
import { vaciarCarritoUseCase } from "@/application/use_cases/vaciarCarritoUseCase";
import { agregarProductoAlCarritoUseCase } from "@/application/use_cases/agregarProductoAlCarritoUseCase";
import { aplicarCuponUseCase } from "@/application/use_cases/aplicarCuponUseCase";
import { quitarCuponUseCase } from "@/application/use_cases/quitarCuponUseCase";
import type { CarritoBackend } from "@/ports/outbound/ChatbotApiPort";
import { sanitize } from "@/domain/utils/sanitize";

/**
 * `/carrito`: líneas con datos reales del backend (SPEC-10, SPEC-11).
 * Fuente de verdad: `GET /carrito` (precios, stock y totales recalculados).
 * El badge del header lo sincroniza `useCarrito` (count/subtotal), compartido.
 */
export function CartPage({ conversacionId }: { conversacionId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cliente = useChatStore((s) => s.cliente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const setUltimaConversacionId = useChatStore((s) => s.setUltimaConversacionId);
  // La conversación la resuelve `useCarrito` (store); la prop es solo un override
  // opcional. Las mutaciones usan la MISMA conversación que el GET.
  const { query: carritoQuery, queryKey, conversacion } = useCarrito();
  const conv = conversacionParaCarrito(conversacionId) ?? conversacion;

  const [avisoCelular, setAvisoCelular] = useState(false);
  const [deshacer, setDeshacer] = useState<{ sku: string; cantidad: number; nombre: string } | null>(null);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [avisoCupon, setAvisoCupon] = useState<string | null>(null);
  const [reemplazo, setReemplazo] = useState<{ codigo: string; actual: string } | null>(null);

  const carrito: CarritoBackend | undefined = carritoQuery.data;

  // Si la ruta trae la conversación (UUID real), ubica el carrito anónimo.
  useEffect(() => {
    const id = conversacionParaCarrito(conversacionId);
    if (id) setUltimaConversacionId(id);
  }, [conversacionId, setUltimaConversacionId]);

  // Deshacer expira a los 10 s (SPEC-11).
  useEffect(() => {
    if (!deshacer) return;
    const t = setTimeout(() => setDeshacer(null), 10000);
    return () => clearTimeout(t);
  }, [deshacer]);

  function invalidar() {
    void queryClient.invalidateQueries({ queryKey: ["carrito"] });
  }

  const cambiarCantidad = useMutation({
    mutationFn: (input: { itemId: string; cantidad: number }) =>
      actualizarCantidadCarritoUseCase(container.api, { ...input, conversacionId: conv }),
    onSuccess: (data) => {
      setDeshacer(null);
      // La respuesta del PATCH ya trae el carrito recalculado: se usa de inmediato.
      queryClient.setQueryData(queryKey, data);
      invalidar();
    },
  });

  const quitar = useMutation({
    mutationFn: (input: { itemId: string; sku: string; cantidad: number; nombre: string }) =>
      quitarDelCarritoUseCase(container.api, { itemId: input.itemId, conversacionId: conv }).then((r) => ({
        ...r,
        borrada: input,
      })),
    onSuccess: ({ borrada }) => {
      setDeshacer({ sku: borrada.sku, cantidad: borrada.cantidad, nombre: borrada.nombre });
      invalidar();
    },
  });

  const vaciar = useMutation({
    mutationFn: () => vaciarCarritoUseCase(container.api, conv),
    onSuccess: () => {
      setConfirmarVaciar(false);
      invalidar();
    },
  });

  const reagregar = useMutation({
    mutationFn: (input: { sku: string; cantidad: number }) =>
      agregarProductoAlCarritoUseCase(container.api, { ...input, conversacionId: conv }),
    onSuccess: (data) => {
      setDeshacer(null);
      if (data.carrito) queryClient.setQueryData(queryKey, data.carrito);
      invalidar();
    },
  });

  const aplicarCupon = useMutation({
    mutationFn: (input: { codigo: string; confirmarReemplazo?: boolean }) =>
      aplicarCuponUseCase(container.api, input.codigo, input.confirmarReemplazo ?? false),
    onSuccess: (data) => {
      // La respuesta ya trae el carrito recalculado con el descuento.
      queryClient.setQueryData(queryKey, data.carrito);
      invalidar();
      setCodigoCupon("");
      setAvisoCupon(null);
      setReemplazo(null);
    },
    onError: (error, input) => {
      if (problemCode(error) === "REQUIERE_CONFIRMACION_REEMPLAZO") {
        setReemplazo({
          codigo: input.codigo,
          actual: problemField(error, "cuponActual") ?? "otro",
        });
        setAvisoCupon(null);
        return;
      }
      setAvisoCupon(mensajeCupon(error));
    },
  });

  const quitarCupon = useMutation({
    mutationFn: () => quitarCuponUseCase(container.api),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data.carrito);
      invalidar();
      setAvisoCupon(null);
      setReemplazo(null);
    },
    onError: (error) => setAvisoCupon(mensajeCupon(error)),
  });

  function irAPagar() {
    if (!cliente) {
      setAccionPendiente("/checkout");
      setAuthOpen(true);
      return;
    }
    if (!cliente.celularVerificado) {
      setAvisoCelular(true);
      return;
    }
    router.push("/checkout");
  }

  const errorCode =
    problemCode(carritoQuery.error) ??
    problemCode(cambiarCantidad.error) ??
    problemCode(quitar.error) ??
    problemCode(vaciar.error) ??
    problemCode(reagregar.error);
  const hayError = Boolean(
    carritoQuery.error || cambiarCantidad.error || quitar.error || vaciar.error || reagregar.error
  );
  const errorTexto = hayError ? mensajeCarrito(errorCode) : null;

  if (carritoQuery.isPending) {
    return <p className="text-sm text-text-secondary text-center py-8">Cargando carrito…</p>;
  }

  if (carritoQuery.isError && !carrito) {
    // "Vacío" solo cuando de verdad no hay carrito que mostrar; el resto es error.
    const sinCarrito = errorCode === "REQUIERE_SESION" || errorCode === "RECURSO_NO_ENCONTRADO";
    if (sinCarrito) {
      return (
        <div className="p-4">
          <p className="text-sm text-text-secondary text-center py-8">
            Tu carrito está vacío. Prueba con Ver ofertas o Buscar productos.
          </p>
        </div>
      );
    }
    return (
      <div className="p-4">
        <BloqueError
          code={errorCode ?? "ERROR"}
          mensaje={errorTexto ?? "No se pudo cargar el carrito."}
          onRetry={() => carritoQuery.refetch()}
        />
      </div>
    );
  }

  const lineas = carrito?.lineas ?? [];
  const pendientes = cambiarCantidad.isPending || quitar.isPending || vaciar.isPending || reagregar.isPending;
  const cuponAplicado = (carrito?.descuentos ?? []).find((d) =>
    d.nombre.startsWith("Cupón ")
  );

  return (
    <div className="flex flex-col min-h-full" data-testid="cart-page">
      <div className="p-4 flex flex-col gap-3 flex-1">
        {errorTexto && (
          <div role="alert" aria-live="assertive" className="rounded-md bg-error-soft border border-error-default px-3 py-2.5 text-[13px]">
            {errorTexto}{" "}
            <button onClick={() => { cambiarCantidad.reset(); quitar.reset(); vaciar.reset(); reagregar.reset(); carritoQuery.refetch(); }} className="underline font-bold">
              Reintentar
            </button>
          </div>
        )}
        {lineas.map((it) => (
          <div
            key={it.item_id}
            data-testid="linea-carrito"
            className="rounded-md bg-white border border-border-default p-3 flex gap-3 wf-card"
          >
            <div
              className="relative overflow-hidden w-20 h-20 shrink-0 rounded-md flex items-center justify-center text-[32px]"
              style={{ background: "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))" }}
              role="img"
              aria-label={it.nombre}
            >
              <span aria-hidden className="absolute top-0 right-0 w-10 h-10 bg-accent-volt" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
              <span aria-hidden>👟</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-[15px] uppercase leading-tight truncate text-text-primary">
                    {sanitize(it.nombre)}
                  </p>
                  {it.variante && <p className="text-[12px] text-text-secondary">{sanitize(it.variante)}</p>}
                  <p className="text-[13px] font-semibold text-text-secondary mt-1">S/ {it.precio.toFixed(2)}</p>
                  {!it.disponible && (
                    <p data-testid="linea-no-disponible" className="text-[12px] font-bold text-error-default">
                      Ya no disponible
                    </p>
                  )}
                  {it.nota && <p className="text-[12px] text-text-secondary">{sanitize(it.nota)}</p>}
                </div>
                <button
                  aria-label={`Quitar ${it.nombre}`}
                  data-testid={`btn-quitar-${it.item_id}`}
                  disabled={pendientes}
                  onClick={() => quitar.mutate({ itemId: it.item_id, sku: it.sku, cantidad: it.cantidad, nombre: it.nombre })}
                  className="w-8 h-8 shrink-0 wf-btn flex items-center justify-center bg-white border border-border-default text-text-secondary disabled:opacity-60"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  aria-label={`Disminuir cantidad de ${it.nombre}`}
                  disabled={pendientes}
                  onClick={() => {
                    if (it.cantidad <= 1) {
                      quitar.mutate({ itemId: it.item_id, sku: it.sku, cantidad: it.cantidad, nombre: it.nombre });
                    } else {
                      cambiarCantidad.mutate({ itemId: it.item_id, cantidad: it.cantidad - 1 });
                    }
                  }}
                  className="w-7 h-7 wf-btn flex items-center justify-center bg-surface-cloud border border-border-default disabled:opacity-60"
                >
                  <MinusIcon size={16} />
                </button>
                <span className="text-sm font-bold w-4 text-center tabular-nums" data-testid={`cantidad-${it.item_id}`}>
                  {it.cantidad}
                </span>
                <button
                  aria-label={`Aumentar cantidad de ${it.nombre}`}
                  disabled={pendientes || !it.disponible || it.cantidad >= 10}
                  onClick={() => cambiarCantidad.mutate({ itemId: it.item_id, cantidad: Math.min(10, it.cantidad + 1) })}
                  className="w-7 h-7 wf-btn flex items-center justify-center bg-surface-cloud border border-border-default disabled:opacity-60"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {lineas.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">
            Tu carrito está vacío. Prueba con Ver ofertas o Buscar productos.
          </p>
        )}
        {cliente && lineas.length > 0 && (
          <div
            className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2"
            data-testid="cupon-carrito"
          >
            <p className="font-heading text-[15px] uppercase">Cupón de descuento</p>
            {cuponAplicado ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] text-text-secondary">
                  Aplicado · ahorras S/ {cuponAplicado.monto.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => quitarCupon.mutate()}
                  disabled={quitarCupon.isPending || pendientes}
                  className="text-[12px] font-semibold underline disabled:opacity-60"
                >
                  {quitarCupon.isPending ? "Quitando…" : "Quitar cupón"}
                </button>
              </div>
            ) : reemplazo ? (
              <div
                role="alertdialog"
                aria-label="Confirmar reemplazo de cupón"
                className="flex flex-col gap-2"
              >
                <p className="text-[13px]">
                  Ya tienes el cupón {reemplazo.actual}. ¿Reemplazarlo por {reemplazo.codigo}?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReemplazo(null)}
                    className="wf-btn py-2 text-[12px] font-bold bg-white border border-border-default"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      aplicarCupon.mutate({
                        codigo: reemplazo.codigo,
                        confirmarReemplazo: true,
                      })
                    }
                    disabled={aplicarCupon.isPending}
                    className="wf-btn py-2 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60"
                  >
                    {aplicarCupon.isPending ? "REEMPLAZANDO…" : "REEMPLAZAR"}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const codigo = codigoCupon.trim();
                  if (codigo) aplicarCupon.mutate({ codigo });
                }}
                className="flex gap-2"
              >
                <input
                  value={codigoCupon}
                  onChange={(e) => setCodigoCupon(e.target.value)}
                  maxLength={40}
                  aria-label="Código de cupón"
                  placeholder="Código de cupón"
                  className="flex-1 wf-input px-3 py-2.5 text-sm uppercase outline-none"
                />
                <button
                  type="submit"
                  disabled={aplicarCupon.isPending || !codigoCupon.trim()}
                  className="wf-btn px-4 py-2.5 text-[12px] font-bold bg-surface-ink text-text-inverse disabled:opacity-60"
                >
                  {aplicarCupon.isPending ? "APLICANDO…" : "APLICAR"}
                </button>
              </form>
            )}
            {avisoCupon && (
              <p role="alert" className="text-[12px] text-error-default">
                {avisoCupon}
              </p>
            )}
          </div>
        )}
        {lineas.length > 0 && !confirmarVaciar && (
          <button
            onClick={() => setConfirmarVaciar(true)}
            data-testid="btn-vaciar"
            className="text-[12px] font-semibold underline text-text-secondary self-center"
          >
            Vaciar carrito
          </button>
        )}
        {confirmarVaciar && (
          <div role="alertdialog" aria-label="Confirmar vaciar carrito" className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
            <p className="text-[13px]">¿Vaciar todo el carrito? Esta acción no se puede deshacer.</p>
            <div className="grid grid-cols-2 gap-2">
              <button autoFocus onClick={() => setConfirmarVaciar(false)} className="wf-btn py-2 text-[12px] font-bold bg-white border border-border-default">
                CANCELAR
              </button>
              <button
                onClick={() => vaciar.mutate()}
                disabled={vaciar.isPending}
                data-testid="btn-confirmar-vaciar"
                className="wf-btn py-2 text-[12px] font-bold bg-error-default text-white disabled:opacity-60"
              >
                {vaciar.isPending ? "VACIANDO…" : "SÍ, VACIAR"}
              </button>
            </div>
          </div>
        )}
        {deshacer && (
          <div className="rounded-md bg-surface-ink text-text-inverse px-3 py-2.5 flex items-center justify-between text-[13px]" role="status">
            <span>Línea eliminada.</span>
            <button
              onClick={() => reagregar.mutate({ sku: deshacer.sku, cantidad: Math.min(10, deshacer.cantidad) })}
              className="font-bold underline"
              data-testid="btn-deshacer"
            >
              Deshacer
            </button>
          </div>
        )}
        {(carrito?.avisos ?? []).map((aviso, i) => (
          <p key={i} role="status" className="text-[12px] text-text-secondary">
            {sanitize(aviso)}
          </p>
        ))}
        {carrito && !carrito.promociones_ok && carrito.lineas.length > 0 && (
          <p role="status" className="text-[12px] text-warning-default">
            No pudimos calcular promociones en este momento. El checkout queda bloqueado hasta calcular promociones.
          </p>
        )}
        <p className="text-[12px] text-text-secondary">El máximo por producto es 10 unidades.</p>
      </div>
      <div className="border-t border-border-default p-4 flex flex-col gap-2 bg-white sticky bottom-0">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-semibold text-text-primary">S/ {(carrito?.subtotal ?? 0).toFixed(2)}</span>
        </div>
        {(carrito?.descuentos ?? []).map((d, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">{sanitize(d.nombre)}</span>
            <span className="font-bold text-success-default">- S/ {d.monto.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">Total</span>
          <span className="font-heading text-[20px] text-text-primary">S/ {(carrito?.total ?? 0).toFixed(2)}</span>
        </div>
        <button
          onClick={irAPagar}
          data-testid="btn-ir-a-pagar"
          className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover"
        >
          IR A PAGAR
        </button>
      </div>

      {avisoCelular && (
        <AvisoCelularModal
          onVerificar={() => {
            setAvisoCelular(false);
            router.push("/cuenta");
          }}
          onClose={() => setAvisoCelular(false)}
        />
      )}
    </div>
  );
}
