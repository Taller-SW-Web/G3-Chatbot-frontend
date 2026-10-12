<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Reglas del producto

- **Enfoque mobile-first:** la app es web, de pantalla completa y de uso mobile-first (patrón tipo ChatGPT / WhatsApp Web). Todo componente se diseña primero para móvil y luego se adapta a escritorio.
- **Cuenta:** se puede navegar sin cuenta (conversar, buscar productos, ver ofertas) con sesión anónima. La cuenta es obligatoria para comprar (del carrito al checkout) y para consultar pedidos, reclamos y devoluciones. No existe un flujo de compra como invitado.
