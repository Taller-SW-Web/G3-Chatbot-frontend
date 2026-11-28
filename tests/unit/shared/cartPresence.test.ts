// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  CART_PRESENCE_COOKIE,
  syncCartPresenceCookie,
} from "@/shared/auth/cartPresence";
import { useChatStore } from "@/shared/auth/chatStore";

function cookieValue(name: string): string | null {
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function clearCookie(): void {
  document.cookie = `${CART_PRESENCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

describe("cart presence cookie (#164)", () => {
  beforeEach(() => {
    clearCookie();
    useChatStore.setState({ carrito: { lineas: [], subtotal: 0, count: 0 } });
  });

  it("marca la cookie cuando hay líneas y la borra al vaciar", () => {
    syncCartPresenceCookie(true);
    expect(cookieValue(CART_PRESENCE_COOKIE)).toBe("1");

    syncCartPresenceCookie(false);
    expect(cookieValue(CART_PRESENCE_COOKIE)).toBeNull();
  });

  it("sincroniza la cookie desde setCarrito y logout", () => {
    useChatStore.getState().setCarrito({
      lineas: [
        {
          producto: {
            sku: "SKU-1",
            nombre: "Zapatilla",
            categoria: "",
            talla: "",
            color: "",
            precio: 100,
          },
          cantidad: 1,
        },
      ],
      subtotal: 100,
      count: 1,
    });
    expect(cookieValue(CART_PRESENCE_COOKIE)).toBe("1");

    useChatStore.getState().setCarrito({ lineas: [], subtotal: 0, count: 0 });
    expect(cookieValue(CART_PRESENCE_COOKIE)).toBeNull();

    useChatStore.getState().setCarrito({
      lineas: [
        {
          producto: {
            sku: "SKU-1",
            nombre: "Zapatilla",
            categoria: "",
            talla: "",
            color: "",
            precio: 100,
          },
          cantidad: 1,
        },
      ],
      subtotal: 100,
      count: 1,
    });
    useChatStore.getState().logout();
    expect(cookieValue(CART_PRESENCE_COOKIE)).toBeNull();
  });
});
