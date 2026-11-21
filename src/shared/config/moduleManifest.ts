/** Contrato de los manifiestos de módulo del frontend (ADR-0024). */

export type ModuleRoute = {
  /** Ruta Next tal como la sirve `app/` (p. ej. `/pedidos/[tab]`). */
  path: string;
  description: string;
};

export type ModuleNav = {
  href: string;
  label: string;
};

export type ModuleManifest = {
  id: string;
  name: string;
  owner: string;
  routes: readonly ModuleRoute[];
  nav: readonly ModuleNav[];
  /** Endpoints REST/SSE que implementa el adapter del módulo. */
  endpoints: readonly string[];
  /** Debe coincidir con `modules.manifest.json`. */
  dependsOn: readonly string[];
};
