"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SearchIcon, ChevronRightIcon, XIcon, MessagePlusIcon, HistoryIcon, SettingsIcon } from "@/shared/ui/icons";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { container } from "@/shared/di/container";
import { useChatStore } from "@/shared/auth/chatStore";
import {
  listarConversacionesUseCase,
  siguientePaginaConversaciones,
} from "@/modules/mod-chat/application/listarConversacionesUseCase";
import {
  buscarConversacionesUseCase,
  normalizarBusqueda,
  BUSQUEDA_MAX_CARACTERES,
} from "@/modules/mod-chat/application/buscarConversacionesUseCase";
import { crearConversacionUseCase } from "@/modules/mod-chat/application/crearConversacionUseCase";
import type { ConversacionResumen, SegmentoResaltado } from "@/modules/mod-chat/ports/chatApiPort";
import { useDialogoModal } from "@/shared/ui/useDialogoModal";

/** Espera tras la última tecla antes de consultar `/buscar`. */
const BUSQUEDA_DEBOUNCE_MS = 300;

/** Overlay: Nuevo chat, Buscar, Historial recientes, perfil. SPEC-05 Req.1 */
export function Sidebar({
  onClose,
  onNavigate,
  conversacionActual,
}: {
  onClose: () => void;
  onNavigate: (href: string) => void;
  conversacionActual?: string;
}) {
  const [q, setQ] = useState("");
  const [termino, setTermino] = useState("");
  const [buscando, setBuscando] = useState(false);
  const busquedaRef = useRef<HTMLInputElement>(null);
  /** Swipe horizontal hacia la izquierda cierra el drawer (mobile-first). */
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchSwipeRef = useRef<{ x: number; y: number } | null>(null);
  const cliente = useChatStore((s) => s.cliente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const queryClient = useQueryClient();
  // Las conversaciones dependen de quién llama (cliente o cookie anónima).
  const dueno = cliente?.correo ?? "anonimo";
  // Drawer modal: foco atrapado, Escape cierra y el fondo queda inerte (frontend#190).
  const drawerRef = useDialogoModal<HTMLElement>(onClose, buscando);

  useEffect(() => {
    const t = setTimeout(() => setTermino(normalizarBusqueda(q)), BUSQUEDA_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  // Foco al abrir la busqueda: mismo efecto que autoFocus, sin el atributo (S9379).
  useEffect(() => {
    if (buscando) busquedaRef.current?.focus();
  }, [buscando]);

  const recientes = useInfiniteQuery({
    queryKey: ["conversaciones", dueno],
    queryFn: ({ pageParam }) => listarConversacionesUseCase(container.chat, pageParam),
    initialPageParam: 1,
    getNextPageParam: siguientePaginaConversaciones,
  });

  const resultados = useInfiniteQuery({
    queryKey: ["conversaciones", dueno, "buscar", termino],
    queryFn: async ({ pageParam }) =>
      (await buscarConversacionesUseCase(container.chat, termino, pageParam)) ?? [],
    initialPageParam: 1,
    getNextPageParam: siguientePaginaConversaciones,
    enabled: buscando && termino !== "",
  });

  const nuevoChat = useMutation({
    mutationFn: () => crearConversacionUseCase(container.chat),
    onSuccess: ({ conversacionId }) => {
      // Vacía no aparece en Recientes hasta su primer mensaje; se refresca al volver.
      queryClient.invalidateQueries({ queryKey: ["conversaciones"] });
      onNavigate(`/chat/${conversacionId}`);
    },
  });

  function irPrivado(href: string) {
    if (cliente) onNavigate(href);
    else {
      setAccionPendiente(href);
      // Cierra el drawer antes de montar AuthModal: dos diálogos apilados
      // comparten `document` y rompen Tab/Escape (frontend#190).
      onClose();
      setAuthOpen(true);
    }
  }

  function onSwipeStart(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse" && e.buttons !== 1) return;
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function onSwipeEnd(e: React.PointerEvent<HTMLElement>) {
    const inicio = swipeRef.current;
    swipeRef.current = null;
    if (!inicio || inicio.id !== e.pointerId) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) onClose();
  }

  const swipeProps = {
    onPointerDown: onSwipeStart,
    onPointerUp: onSwipeEnd,
    onPointerCancel: () => { swipeRef.current = null; },
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
      const t = e.changedTouches[0];
      if (t) touchSwipeRef.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent<HTMLElement>) => {
      const inicio = touchSwipeRef.current;
      touchSwipeRef.current = null;
      const t = e.changedTouches[0];
      if (!inicio || !t) return;
      const dx = t.clientX - inicio.x;
      const dy = t.clientY - inicio.y;
      if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) onClose();
    },
    style: { touchAction: "pan-y" as const },
  };

  if (buscando) {
    const consulta = termino ? resultados : recientes;
    const filas = consulta.data?.pages.flat() ?? [];
    return (
      <div data-capa-modal className="absolute inset-0 z-30 flex flex-row">
        <aside data-testid="sidebar-drawer" {...swipeProps} ref={drawerRef} tabIndex={-1}
          role="dialog" aria-modal="true" aria-label="Búsqueda de conversaciones"
          className="order-1 w-[85%] max-w-[340px] bg-surface-ink text-text-inverse h-full flex flex-col p-4 gap-3 outline-none">
          <div className="wf-chip px-4 py-3 flex items-center gap-2 bg-white text-text-primary">
            <SearchIcon size={20} />
            <input ref={busquedaRef} value={q} onChange={(e) => setQ(e.target.value)}
              maxLength={BUSQUEDA_MAX_CARACTERES}
              placeholder="Buscar conversaciones" aria-label="Buscar conversaciones"
              className="flex-1 outline-none text-sm bg-transparent" />
            <button aria-label="Cerrar búsqueda" onClick={() => { setBuscando(false); setQ(""); }}><XIcon size={20} /></button>
          </div>
          <div className="rounded-md bg-white text-text-primary divide-y divide-surface-cloud-subtle overflow-y-auto no-scrollbar">
            {filas.map((c) => (
              <button key={c.id} onClick={() => onNavigate(`/chat/${c.id}`)}
                className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left">
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold truncate">
                    <Resaltado segmentos={c.resaltado?.titulo} texto={c.titulo} />
                  </span>
                  <span className="block text-[12px] text-text-secondary truncate">
                    <Resaltado segmentos={c.resaltado?.fragmento} texto={c.preview} />
                  </span>
                </span>
                <span className="flex items-center gap-1 shrink-0"><ChevronRightIcon size={16} /></span>
              </button>
            ))}
            <EstadoListado consulta={consulta} vacio={termino ? "Sin resultados." : "Aún no tienes conversaciones."} claro />
          </div>
        </aside>
        <button type="button" tabIndex={-1} aria-hidden="true" className="flex-1 bg-surface-ink/60 order-2 fade-in" onClick={onClose} />
      </div>
    );
  }

  const filas = recientes.data?.pages.flat() ?? [];
  return (
    <div data-capa-modal className="absolute inset-0 z-30 flex flex-row">
      <aside data-testid="sidebar-drawer" {...swipeProps} ref={drawerRef} tabIndex={-1}
        role="dialog" aria-modal="true" aria-label="Menú"
        className="order-1 w-[85%] max-w-[340px] bg-surface-ink text-text-inverse h-full flex flex-col side-in outline-none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-inverse">
          <span style={{ filter: "hue-rotate(-48deg) saturate(1.35)" }} className="inline-flex">
            <BrandLogo variant="volt" className="h-12 w-auto" />
          </span>
          <button aria-label="Cerrar menú" onClick={onClose}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft border border-border-inverse"><XIcon size={20} /></button>
        </div>
        <button onClick={() => nuevoChat.mutate()} disabled={nuevoChat.isPending}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-border-inverse text-sm font-bold text-left hover:bg-surface-ink-soft disabled:opacity-60">
          <MessagePlusIcon size={20} />{nuevoChat.isPending ? "Creando chat…" : "Nuevo chat"}
        </button>
        {nuevoChat.isError && (
          <p role="alert" className="px-4 py-2 text-[12px] text-text-muted-dark border-b border-border-inverse">
            No se pudo crear el chat. Inténtalo de nuevo.
          </p>
        )}
        <button onClick={() => setBuscando(true)} className="flex items-center gap-3 px-4 py-3.5 border-b border-border-inverse text-sm text-left hover:bg-surface-ink-soft"><SearchIcon size={20} />Buscar chats</button>
        <button onClick={() => irPrivado("/pedidos")} className="flex items-center gap-3 px-4 py-3.5 border-b border-border-inverse text-sm text-left hover:bg-surface-ink-soft"><HistoryIcon size={20} />Historial de pedidos</button>
        <p className="px-4 pt-3 text-[11px] tracking-[0.2em] text-text-muted-dark font-bold">RECIENTES</p>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filas.map((c) => (
            <button key={c.id} onClick={() => onNavigate(`/chat/${c.id}`)}
              aria-current={conversacionActual === c.id ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-dashed border-border-inverse text-left hover:bg-surface-ink-soft ${conversacionActual === c.id ? "bg-surface-ink-soft" : ""}`}>
              <span className="w-2 h-2 rounded-full bg-action-primary inline-block shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-bold truncate">{c.titulo}</span>
                <span className="block text-[12px] text-text-muted-dark truncate max-w-[220px]">{c.preview}</span>
              </span>
              <span className="ml-auto shrink-0 text-text-muted-dark"><ChevronRightIcon size={16} /></span>
            </button>
          ))}
          <EstadoListado consulta={recientes} vacio="Aún no tienes conversaciones." />
        </div>
        <button onClick={() => irPrivado("/cuenta")}
          className="flex items-center gap-3 px-4 py-4 border-t border-border-inverse text-left hover:bg-surface-ink-soft">
          <span className="w-9 h-9 rounded-full bg-action-primary text-text-inverse flex items-center justify-center font-bold text-sm shrink-0">
            {cliente ? cliente.nombreCompleto.charAt(0).toUpperCase() : "?"}
          </span>
          <span className="text-sm font-bold">{cliente?.nombreCompleto ?? "Iniciar sesión"}</span>
          <span className="ml-auto text-text-muted-dark"><SettingsIcon size={20} /></span>
        </button>
      </aside>
      <button type="button" tabIndex={-1} aria-hidden="true" className="flex-1 bg-surface-ink/60 order-2 fade-in" onClick={onClose} />
    </div>
  );
}

/** Texto con la coincidencia marcada; sin segmentos muestra el texto tal cual. React escapa el contenido. */
function Resaltado({ segmentos, texto }: { segmentos?: SegmentoResaltado[] | null; texto: string }) {
  if (!segmentos?.length) return <>{texto}</>;
  return (
    <>
      {segmentos.map((s, i) =>
        s.coincide
          ? <mark key={i} className="bg-accent-volt-soft text-text-primary rounded-sm px-0.5">{s.texto}</mark>
          : <span key={i}>{s.texto}</span>
      )}
    </>
  );
}

type ConsultaConversaciones = {
  isPending: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  data?: { pages: ConversacionResumen[][] };
  refetch: () => unknown;
  fetchNextPage: () => unknown;
};

/** Carga, error con reintento, vacío y "Ver más" del listado o de la búsqueda. */
function EstadoListado({ consulta, vacio, claro = false }: { consulta: ConsultaConversaciones; vacio: string; claro?: boolean }) {
  const tono = claro ? "text-text-secondary" : "text-text-muted-dark";
  if (consulta.isPending) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <p className={`text-[13px] ${tono} text-center`}>Cargando…</p>
        <div className="flex flex-col gap-3 py-1 opacity-60" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-border-inverse shimmer" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3.5 w-3/5 rounded bg-surface-ink-soft shimmer" />
                <div className="h-2.5 w-4/5 rounded bg-surface-ink-soft shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (consulta.isError)
    return (
      <p role="alert" className={`text-[13px] ${tono} py-4 text-center`}>
        No se pudieron cargar las conversaciones.{" "}
        <button className="underline font-bold" onClick={() => consulta.refetch()}>Reintentar</button>
      </p>
    );
  if (!consulta.data?.pages.flat().length) return <p className={`text-[13px] ${tono} py-4 text-center`}>{vacio}</p>;
  if (!consulta.hasNextPage) return null;
  return (
    <button onClick={() => consulta.fetchNextPage()} disabled={consulta.isFetchingNextPage}
      className={`w-full py-3 text-[13px] font-bold ${tono} disabled:opacity-60`}>
      {consulta.isFetchingNextPage ? "Cargando…" : "Ver más"}
    </button>
  );
}
