"use client";

import { useState } from "react";
import { SearchIcon, ChevronRightIcon, XIcon, MessagePlusIcon, HistoryIcon, SettingsIcon } from "../components/icons";
import { BrandLogo } from "../components/BrandLogo";
import { container } from "@/infrastructure/di/container";
import { MOCK_CONVERSACIONES } from "@/adapters/outbound/mockData";
import { useChatStore } from "@/application/state/chatStore";

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
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState(MOCK_CONVERSACIONES);
  const cliente = useChatStore((s) => s.cliente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);

  async function buscar(v: string) {
    setQ(v);
    if (!v.trim()) { setResultados(MOCK_CONVERSACIONES); return; }
    setResultados(await container.api.buscarConversaciones(v));
  }

  function irPrivado(href: string) {
    if (cliente) onNavigate(href);
    else {
      setAccionPendiente(href);
      setAuthOpen(true);
    }
  }

  if (buscando) {
    return (
      <div className="absolute inset-0 z-30 flex flex-row">
        <aside className="order-1 w-[85%] max-w-[340px] bg-surface-ink text-text-inverse h-full flex flex-col p-4 gap-3">
          <div className="wf-chip px-4 py-3 flex items-center gap-2 bg-white text-text-primary">
            <SearchIcon size={20} />
            <input autoFocus value={q} onChange={(e) => buscar(e.target.value)}
              placeholder="Buscar conversaciones" aria-label="Buscar conversaciones"
              className="flex-1 outline-none text-sm bg-transparent" />
            <button aria-label="Cerrar búsqueda" onClick={() => setBuscando(false)}><XIcon size={20} /></button>
          </div>
          <div className="rounded-md bg-white text-text-primary divide-y divide-surface-cloud-subtle overflow-hidden">
            {resultados.map((c) => (
              <button key={c.id} onClick={() => onNavigate(`/chat/${c.id}`)}
                className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left">
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold truncate">{c.titulo}</span>
                  <span className="block text-[12px] text-text-secondary truncate">{c.preview}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0"><ChevronRightIcon size={16} /></span>
              </button>
            ))}
            {resultados.length === 0 && <p className="text-[13px] text-text-secondary py-4 text-center">Sin resultados.</p>}
          </div>
        </aside>
        <div className="flex-1 bg-surface-ink/60 order-2" onClick={onClose} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-row">
      <aside className="order-1 w-[85%] max-w-[340px] bg-surface-ink text-text-inverse h-full flex flex-col side-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-inverse">
          <BrandLogo variant="volt" className="h-12 w-auto" />
          <button aria-label="Cerrar menú" onClick={onClose}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft border border-border-inverse"><XIcon size={20} /></button>
        </div>
        <button onClick={() => onNavigate("/")} className="flex items-center gap-3 px-4 py-3.5 border-b border-border-inverse text-sm font-bold text-left hover:bg-surface-ink-soft"><MessagePlusIcon size={20} />Nuevo chat</button>
        <button onClick={() => setBuscando(true)} className="flex items-center gap-3 px-4 py-3.5 border-b border-border-inverse text-sm text-left hover:bg-surface-ink-soft"><SearchIcon size={20} />Buscar chats</button>
        <button onClick={() => irPrivado("/pedidos")} className="flex items-center gap-3 px-4 py-3.5 border-b border-border-inverse text-sm text-left hover:bg-surface-ink-soft"><HistoryIcon size={20} />Historial de pedidos</button>
        <p className="px-4 pt-3 text-[11px] tracking-[0.2em] text-text-muted-dark font-bold">RECIENTES</p>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {MOCK_CONVERSACIONES.map((c) => (
            <button key={c.id} onClick={() => onNavigate(`/chat/${c.id}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-dashed border-border-inverse text-left hover:bg-surface-ink-soft ${conversacionActual === c.id ? "bg-surface-ink-soft" : ""}`}>
              <span className="w-2 h-2 rounded-full bg-accent-volt inline-block shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-bold truncate">{c.titulo}</span>
                <span className="block text-[12px] text-text-muted-dark truncate max-w-[220px]">{c.preview}</span>
              </span>
              <span className="ml-auto shrink-0 text-text-muted-dark"><ChevronRightIcon size={16} /></span>
            </button>
          ))}
        </div>
        <button onClick={() => irPrivado("/cuenta")}
          className="flex items-center gap-3 px-4 py-4 border-t border-border-inverse text-left hover:bg-surface-ink-soft">
          <span className="w-9 h-9 rounded-full bg-accent-volt text-surface-ink flex items-center justify-center font-bold text-sm shrink-0">
            {cliente ? cliente.nombreCompleto.charAt(0).toUpperCase() : "?"}
          </span>
          <span className="text-sm font-bold">{cliente?.nombreCompleto ?? "Iniciar sesión"}</span>
          <span className="ml-auto text-text-muted-dark"><SettingsIcon size={20} /></span>
        </button>
      </aside>
      <div className="flex-1 bg-surface-ink/60 order-2" onClick={onClose} />
    </div>
  );
}
