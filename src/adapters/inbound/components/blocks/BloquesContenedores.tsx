"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BloqueCarrito } from "./BloqueCarrito";
import { FormularioGenerico } from "./FormularioGenerico";
import { SelectorVariante } from "./SelectorVariante";
import { useChatStore } from "@/application/state/chatStore";
import { verDetalleProductoUseCase } from "@/application/use_cases/verDetalleProductoUseCase";
import { container } from "@/infrastructure/di/container";
import type { DatosCarritoBloque } from "@/domain/entities/Bloque";
import {
  accionAgregarVariante,
  opcionesDeAtributo,
  type AccionDirecta,
} from "@/domain/utils/bloquesChat";

/** Container: CARRITO block with navigation (cart page, checkout behind the account rule). */
export function CarritoChat({ datos }: { datos: DatosCarritoBloque }) {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);

  function pagar() {
    if (!cliente) {
      setAccionPendiente("/checkout");
      setAuthOpen(true);
      return;
    }
    // Phone verification lives in the account page, same rule as the cart page.
    router.push(cliente.celularVerificado ? "/checkout" : "/cuenta");
  }

  return (
    <BloqueCarrito datos={datos} onVerCarrito={() => router.push("/carrito")} onPagar={pagar} />
  );
}

const ETIQUETA_ATRIBUTO: Record<string, string> = { talla: "Talla", color: "Color" };

/**
 * Container: SELECTOR_VARIANTE. The block only names the missing attributes, so the
 * options come from the product detail. Once every attribute is chosen, the add action
 * is sent once.
 */
export function SelectorVarianteChat({
  productId,
  faltantes,
  onAccion,
}: {
  productId: string;
  faltantes: string[];
  onAccion?: (accion: AccionDirecta) => void;
}) {
  const [seleccion, setSeleccion] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const detalle = useQuery({
    queryKey: ["catalogo", "detalle", productId],
    queryFn: () => verDetalleProductoUseCase(container.api, productId),
  });

  if (detalle.isPending) {
    return <p role="status" className="text-[13px] text-text-secondary">Cargando opciones…</p>;
  }
  if (detalle.isError || !detalle.data) {
    return (
      <p role="alert" className="text-[13px] text-error-default">
        No pudimos cargar las opciones de este producto.
      </p>
    );
  }
  const producto = detalle.data;
  const atributos = faltantes.filter((f) => f === "talla" || f === "color");

  function elegir(atributo: string, valor: string) {
    if (enviado || !onAccion) return;
    const siguiente = { ...seleccion, [atributo]: valor };
    setSeleccion(siguiente);
    if (atributos.every((a) => siguiente[a])) {
      setEnviado(true);
      onAccion(accionAgregarVariante(productId, siguiente));
    }
  }

  return (
    <div
      data-testid="bloque-selector-variante"
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-3"
    >
      {atributos.map((atributo) => (
        <SelectorVariante
          key={atributo}
          atributo={ETIQUETA_ATRIBUTO[atributo] ?? atributo}
          opciones={opcionesDeAtributo(producto, atributo, seleccion)}
          valor={seleccion[atributo] ?? "Elige"}
          onChange={(v) => elegir(atributo, v)}
        />
      ))}
    </div>
  );
}

/** Container: FORMULARIO REGISTRO opens the global auth modal on its sign-up tab. */
export function FormularioRegistroChat() {
  const cliente = useChatStore((s) => s.cliente);
  const abrirRegistro = useChatStore((s) => s.abrirRegistro);
  if (cliente) return null;
  return (
    <div data-testid="bloque-formulario-registro">
      <FormularioGenerico titulo="Crea tu cuenta" etiqueta="CREAR CUENTA" onSubmit={abrirRegistro}>
        <p className="text-[13px] text-text-secondary">
          Necesitas una cuenta para comprar. El registro toma un minuto.
        </p>
      </FormularioGenerico>
    </div>
  );
}
