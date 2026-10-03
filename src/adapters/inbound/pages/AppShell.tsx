"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Menu2Icon, ShoppingCartIcon, XIcon } from "../components/icons";
import { BrandLogo } from "../components/BrandLogo";
import { AuthModal } from "../components/AuthModal";
import { useChatStore } from "@/application/state/chatStore";
import { Sidebar } from "./Sidebar";

export type ScreenKind =
  | "home" | "chat" | "carrito" | "checkout" | "exito"
  | "pedidos" | "seguimiento" | "reclamo" | "devolucion"
  | "cuenta" | "sugerencias";

/** Layout raíz único (decisión: no duplicar layout.tsx). Orquesta UI. */
export function AppShell({
  initialScreen,
  conversationId,
  children,
}: {
  initialScreen: ScreenKind;
  conversationId?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [sidebar, setSidebar] = useState(false);
  const carrito = useChatStore((s) => s.carrito);
  const authOpen = useChatStore((s) => s.authOpen);

  const titulo =
    initialScreen === "carrito" ? "CARRITO" :
    initialScreen === "checkout" ? "CHECKOUT" :
    initialScreen === "exito" ? "PEDIDO" :
    initialScreen === "pedidos" ? "HISTORIAL DE PEDIDOS" :
    initialScreen === "seguimiento" ? "SEGUIMIENTO" :
    initialScreen === "reclamo" ? "RECLAMO" :
    initialScreen === "devolucion" ? "DEVOLUCIÓN" :
    initialScreen === "cuenta" ? "MI CUENTA" :
    initialScreen === "sugerencias" ? "SUGERENCIAS" : "LOGO";

  const esHomeChat = initialScreen === "home" || initialScreen === "chat";

  return (
    <div className="wf-phone">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border-inverse bg-surface-ink text-text-inverse sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {esHomeChat ? (
            <button aria-label="Abrir menú" onClick={() => setSidebar(true)}
              className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse text-lg leading-none hover:bg-surface-ink">
              <Menu2Icon size={20} />
            </button>
          ) : (
            <button aria-label="Volver" onClick={() => router.push("/")}
              className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse text-lg leading-none hover:bg-surface-ink">
              <ArrowLeftIcon size={20} />
            </button>
          )}
        </div>
        {esHomeChat ? (
          <button onClick={() => router.push("/")} aria-label="Ir a inicio" className="flex items-center justify-center rounded-sm px-1 py-1">
            <BrandLogo variant="volt" className="h-11 w-auto" />
          </button>
        ) : (
          <p className="font-heading uppercase tracking-[0.08em] text-[16px]">{titulo}</p>
        )}
        <div className="relative">
          <button aria-label="Ver carrito" onClick={() => router.push("/carrito")}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse text-lg leading-none hover:bg-surface-ink">
            <ShoppingCartIcon size={20} />
          </button>
          {carrito.count > 0 && (
            <span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent-volt text-surface-ink text-[11px] font-bold flex items-center justify-center border border-surface-ink">
              {carrito.count}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 bg-surface-cloud overflow-y-auto no-scrollbar">
        {children}
      </main>

      {sidebar && (
        <Sidebar
          onClose={() => setSidebar(false)}
          onNavigate={(href) => { setSidebar(false); router.push(href); }}
          conversacionActual={conversationId}
        />
      )}

      {authOpen && <AuthModal />}
    </div>
  );
}

export function IconBtn({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return (
    <button aria-label={label} onClick={onClick}
      className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse text-lg leading-none hover:bg-surface-ink">
      {children}
    </button>
  );
}

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <IconBtn label="Cerrar" onClick={onClick}><XIcon size={20} /></IconBtn>
  );
}
