# `mod-chat` — Chat

- **Owner:** @Ankarmin
- **Frontend:** carpeta `mod-chat`, rutas `[/chat/[id], /sugerencias]`
- **Depende de:** todos los módulos de negocio (orquestador)
- **Contrato:** `/chat/conversaciones*` (REST + SSE)

## Responsabilidad

Conversación, historial, stream SSE del turno, render de bloques, sidebar de conversaciones y sugerencias. Es el único módulo que puede depender de todos; ningún módulo depende de `chat`.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `ChatPage`, `Sidebar`, `SugerenciasPage`, `MessageBubble`, `ChatWindow`, `useChat`, `crearConversacionUseCase`, `MENSAJE_MAX_CARACTERES` y tipos de chat/stream |

El store de sesión (`useChatStore`) vive en `shared/auth/chatStore` porque lo usan todas las pantallas.

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/chat/[id]` | Historial y turno en vivo |
| GET | `/sugerencias` | Formulario de sugerencias |

## Endpoints

`GET|POST /chat/conversaciones`, `GET /chat/conversaciones/buscar`, `POST /chat/conversaciones/{conversacionId}/mensajes` (REST y `text/event-stream`).

## Dependencias externas

`mod-catalog`, `mod-cart`, `mod-checkout`, `mod-orders` para renderizar sus bloques dentro de la conversación, siempre por `public.ts`. `mod-auth`, `mod-shipping` y `mod-postventa` están declarados para futuros bloques.

## Pruebas

- Unitarias: `tests/unit/mod_chat/` (19 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
