import { cookies } from "next/headers";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { CartPage } from "@/modules/mod-cart/public";
import { CART_PRESENCE_COOKIE } from "@/shared/auth/cartPresence";

/**
 * `/carrito` necesita saber en el servidor si hay un carrito para pintar el
 * estado vacío en el primer HTML (#164). La cookie la mantiene `chatStore`
 * cuando el carrito tiene líneas; el contenido real siempre viene del backend.
 */
export default async function CarritoRoute() {
  const cookieStore = await cookies();
  const initialVacio = cookieStore.get(CART_PRESENCE_COOKIE)?.value !== "1";
  console.log(
    "carrito initialVacio",
    initialVacio,
    "cookie",
    cookieStore.get(CART_PRESENCE_COOKIE)?.value ?? "none",
  );

  return (
    <AppShell initialScreen="carrito">
      <CartPage initialVacio={initialVacio} />
    </AppShell>
  );
}
