# `mod-postventa` — Postventa

- **Owner:** @MathiasTL
- **Frontend:** carpeta `mod-postventa`, rutas `[/devolucion, /reclamo]`
- **Depende de:** `mod-orders`
- **Contrato:** `/devoluciones/*`, `/reclamos/*`, `/evidencias`

## Responsabilidad

Solicitudes de cambio/devolución con evidencias, Libro de Reclamaciones (reclamos y quejas), constancias y estados. No incluye el historial de pedidos: lo consume desde `mod-orders`.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `DevolucionPage`, `ReclamoPage`, formularios, constancias/estados y tipos del contrato |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/devolucion` | Registrar devolución/cambio con evidencia |
| GET | `/reclamo` | Registrar reclamo o queja |

## Endpoints

`POST /evidencias`, `POST /devoluciones`, `GET /devoluciones`, `GET /devoluciones/{devolucionId}`, `POST /reclamos`, `GET /reclamos`, `GET /reclamos/{codigoSeguimiento}`.

## Dependencias externas

`mod-orders` (declarada; hoy no hay imports cruzados).

## Pruebas

- Unitarias: `tests/unit/mod_postventa/` (6 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
