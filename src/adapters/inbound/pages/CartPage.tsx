"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { TrashIcon, MinusIcon, PlusIcon } from "../components/icons";
import { AvisoCelularModal } from "../components/AvisoCelularModal";
import { BloqueError } from "../components/blocks/BloqueError";
import { useChatStore } from "@/application/state/chatStore";
import { container } from "@/infrastructure/di/container";
import { listarCarritoUseCase } from "@/application/use_cases/listarCarritoUseCase";
import { actualizarCantidadCarritoUseCase } from "@/application/use_cases/actualizarCantidadCarritoUseCase";
import { quitarDelCarritoUseCase } from "@/application/use_cases/quitarDelCarritoUseCase";
import { vaciarCarritoUseCase } from "@/application/use_cases/vaciarCarritoUseCase";
import { agregarProductoAlCarritoUseCase } from "@/application/use_cases/agregarProductoAlCarritoUseCase";
import type { CarritoBackend } from "@/ports/outbound/ChatbotApiPort";
import { sanitize } from "@/domain/utils/sanitize";

/** Códigos problem+json que la UI ramifica (nunca por texto). */
function codigoDe(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

function mensajePorCode(code: string | null): string | null {
  switch (code) {
    case "STOCK_INSUFICIENTE":
      return "No hay stock suficiente para esa cantidad. Prueba con menos.";
    case "SERVICIO_NO_DISPONIBLE":
      return "No puedo confirmar el stock ahora; intenta en unos segundos.";
    case "LIMITE_CANTIDAD":
      return "El máximo por producto es 10 unidades.";
    case "LINEA_AMBIGUA":
      return "¿Cuáles? Elige la línea exacta.";
    case "REQUIERE_SESION":
      return "Inicia sesión o abre un chat para ver tu carrito.";
    case "PRODUCTO_NO_DISPONIBLE":
      return "Ese producto ya no está disponible.";
    case "CARRITO_DESACTUALIZADO":
      return "Tu carrito cambió mientras elegías. Revisa las líneas marcadas.";
    default:
      return null;
  }
}

/**
 * `/carrito`: líneas con datos reales del backend (SPEC-10, SPEC-11).
 * Fuente de verdad: `GET /carrito` (precios, stock y totales recalculados).
 * El store solo se sincroniza (count/subtotal) para el badge del header.
 */
export function CartPage({ conversacionId }: { conversacionId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cliente = useChatStore((s) => s.cliente);
  const setCarrito = useChatStore((s) => s.setCarrito);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const ultimaConversacionId = useChatStore((s) => s.ultimaConversacionId);
  const conversacion = conversacionId ?? ultimaConversacionId ?? undefined;
  const dueno = cliente?.correo ?? "anonimo";

  const [cupon, setCupon] = useState("");
  const [avisoCelular, setAvisoCelular] = useState(false);
  const [deshacer, setDeshacer] = useState<{ sku: string; cantidad: number; nombre: string } | null>(null);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);

  const carritoQuery = useQuery({
    queryKey: ["carrito", dueno, conversacion ?? "cliente"],
    queryFn: () => listarCarritoUseCase(container.api, conversacion),
  });

  const carrito: CarritoBackend | undefined = carritoQuery.data;

  // Sincroniza el badge del header (store) con el servidor.
  useEffect(() => {
    if (!carrito) return;
    const count = carrito.lineas.reduce((a, l) => a + l.cantidad, 0);
    setCarrito({
      lineas: carrito.lineas.map((l) => ({
        producto: {
          sku: l.sku,
          nombre: l.nombre,
          categoria: "",
          talla: l.variante ?? "",
          color: "",
          precio: l.precio,
          stock: l.disponible ? 5 : 0,
        },
        cantidad: l.cantidad,
      })),
      subtotal: carrito.subtotal,
      count,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito?.subtotal, carrito?.lineas.length]);

  // Deshacer expira a los 10 s (SPEC-11).
  useEffect(() => {
    if (!deshacer) return;
    const t = setTimeout(() => setDeshacer(null), 10000);
    return () => clearTimeout(t);
  }, [deshacer]);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["carrito"] });
  }

  const cambiarCantidad = useMutation({
    mutationFn: (input: { itemId: string; cantidad: number }) =>
      actualizarCantidadCarritoUseCase(container.api, { ...input, conversacionId: conversacion }),
    onSuccess: () => {
      setDeshacer(null);
      invalidar();
    },
  });

  const quitar = useMutation({
    mutationFn: (input: { itemId: string; sku: string; cantidad: number; nombre: string }) =>
      quitarDelCarritoUseCase(container.api, { itemId: input.itemId, conversacionId: conversacion }).then((r) => ({
        ...r,
        borrada: input,
      })),
    onSuccess: ({ borrada }) => {
      setDeshacer({ sku: borrada.sku, cantidad: borrada.cantidad, nombre: borrada.nombre });
      invalidar();
    },
  });

  const vaciar = useMutation({
    mutationFn: () => vaciarCarritoUseCase(container.api, conversacion),
    onSuccess: () => {
      setConfirmarVaciar(false);
      invalidar();
    },
  });

  const reagregar = useMutation({
    mutationFn: (input: { sku: string; cantidad: number }) =>
      agregarProductoAlCarritoUseCase(container.api, { ...input, conversacionId: conversacion }),
    onSuccess: () => {
      setDeshacer(null);
      invalidar();
    },
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
    codigoDe(carritoQuery.error) ??
    codigoDe(cambiarCantidad.error) ??
    codigoDe(quitar.error) ??
    codigoDe(vaciar.error) ??
    codigoDe(reagregar.error);
  const errorTexto = mensajePorCode(errorCode);

  if (carritoQuery.isPending) {
    return <p className="text-sm text-text-secondary text-center py-8">Cargando carrito…</p>;
  }

  if (carritoQuery.isError && !carrito) {
    return (
      <div className="p-4 flex flex-col gap-3">
        {errorCode === "REQUIERE_SESION" || errorCode === null ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Tu carrito está vacío. Prueba con Ver ofertas o Buscar productos.
          </p>
        ) : (
          <div role="alert" className="text-center py-8 flex flex-col gap-2 items-center">
            <p className="text-sm text-text-secondary">{errorTexto ?? "No se pudo cargar el carrito."}</p>
            <button onClick={() => carritoQuery.refetch()} className="underline font-bold text-sm">
              Reintentar
            </button>
          </div>
        )}
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

  return (
    <div className="flex flex-col min-h-full" data-testid="cart-page">
      <div className="p-4 flex flex-col gap-3 flex-1">
        {errorTexto && (
          <div role="alert" className="rounded-md bg-error-soft border border-error-default px-3 py-2.5 text-[13px]">
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
                  aria-label="Disminuir"
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
                  aria-label="Aumentar"
                  disabled={pendientes || !it.disponible}
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
              <button onClick={() => setConfirmarVaciar(false)} className="wf-btn py-2 text-[12px] font-bold bg-white border border-border-default">
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
        <div className="flex gap-2">
          <input
            value={cupon}
            onChange={(e) => setCupon(e.target.value)}
            placeholder="Cupón de descuento"
            aria-label="Cupón de descuento"
            className="flex-1 wf-input px-3 py-2.5 text-[14px] outline-none"
          />
          <button
            onClick={() => setCupon((c) => c)}
            className="wf-btn px-4 py-2.5 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse"
          >
            APLICAR
          </button>
        </div>
        <p className="text-[11px] text-text-secondary">El cupón se valida al pagar (SPEC-13, fuera de este hito).</p>
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
