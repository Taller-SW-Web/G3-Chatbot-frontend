"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "@/shared/ui/icons";
import { useChatStore } from "@/shared/auth/chatStore";
import { container } from "@/shared/di/container";
import {
  BUSQUEDA_MAX_CARACTERES,
  buscarConversacionesUseCase,
  normalizarBusqueda,
} from "@/modules/mod-chat/application/buscarConversacionesUseCase";

/**
 * `/buscar?q=...`: búsqueda de conversaciones por título y mensajes (SPEC-05 Req. 1).
 * La abre la acción de cliente `BUSCAR_CHATS` con `payload.q` precargado.
 */
export function SearchChatsPage({ qInicial = "" }: { qInicial?: string }) {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const dueno = cliente?.correo ?? "anonimo";
  const [texto, setTexto] = useState(qInicial);
  const [termino, setTermino] = useState(normalizarBusqueda(qInicial));

  const resultados = useQuery({
    queryKey: ["conversaciones", dueno, "buscar", termino],
    queryFn: async () =>
      (await buscarConversacionesUseCase(container.chat, termino)) ?? [],
    enabled: termino !== "",
  });

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = normalizarBusqueda(texto);
    setTermino(limpio);
    router.replace(limpio ? `/buscar?q=${encodeURIComponent(limpio)}` : "/buscar");
  }

  const items = resultados.data ?? [];

  return (
    <div className="p-4 flex flex-col gap-3" data-testid="buscar-chats">
      <form onSubmit={buscar} className="flex items-center gap-2" role="search">
        <label htmlFor="buscar-chats-q" className="sr-only">Buscar conversaciones</label>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <SearchIcon size={16} />
          </span>
          <input
            id="buscar-chats-q"
            value={texto}
            maxLength={BUSQUEDA_MAX_CARACTERES}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Busca por tema o mensaje…"
            className="wf-input w-full pl-9 pr-3 py-2.5 text-sm outline-none border border-border-default rounded-sm bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={normalizarBusqueda(texto) === ""}
          className="wf-btn px-4 py-2.5 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60"
        >
          BUSCAR
        </button>
      </form>

      {termino === "" ? (
        <p className="text-[14px] text-text-secondary bg-white border border-border-default rounded-md p-4 text-center">
          Escribe un término para buscar en tus conversaciones.
        </p>
      ) : resultados.isLoading ? (
        <p role="status" className="text-[14px] text-text-secondary text-center py-6">
          Buscando conversaciones…
        </p>
      ) : resultados.isError ? (
        <p role="alert" className="text-[14px] text-error-default bg-white border border-border-default rounded-md p-4 text-center">
          No pudimos buscar tus conversaciones. Inténtalo de nuevo.
        </p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-text-secondary bg-white border border-border-default rounded-md p-4 text-center">
          No encontramos conversaciones con “{termino}”.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/chat/${encodeURIComponent(c.id)}`)}
              className="text-left rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 hover:border-accent-signal"
            >
              <span className="text-[14px] font-bold text-text-primary">{c.titulo || "Conversación"}</span>
              <span className="text-[13px] text-text-secondary line-clamp-2">{c.preview}</span>
              <span className="text-[11px] text-text-secondary">{c.ultimoMensajeEn}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
