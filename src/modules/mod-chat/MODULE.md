# `mod-chat` — Chat

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-chat`, rutas `[/chat/[id], /buscar, /sugerencias]`
- **Depende de:** todos los módulos de negocio (orquestador)
- **Contrato:** `/chat/conversaciones*` (REST + SSE)

## Responsabilidad

Conversación, historial, stream SSE del turno, render de bloques, sidebar de conversaciones y sugerencias. Es el único módulo que puede depender de todos; ningún módulo depende de `chat`.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `ChatPage`, `Sidebar`, `SearchChatsPage`, `SugerenciasPage`, `MessageBubble`, `ChatWindow`, `useChat`, `crearConversacionUseCase`, `MENSAJE_MAX_CARACTERES` y tipos de chat/stream |

El store de sesión (`useChatStore`) vive en `shared/auth/chatStore` porque lo usan todas las pantallas.

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/chat/[id]` | Historial y turno en vivo |
| GET | `/buscar?q=` | Búsqueda de conversaciones por título y mensajes |
| GET | `/sugerencias` | Formulario de sugerencias |

## Endpoints

`GET|POST /chat/conversaciones`, `GET /chat/conversaciones/buscar`, `POST /chat/conversaciones/{conversacionId}/mensajes` (REST y `text/event-stream`), `POST /chat/conversaciones/{conversacionId}/adjuntos`, `DELETE /chat/conversaciones/{conversacionId}/adjuntos/{adjuntoId}`, `GET /chat/adjuntos/{adjuntoId}`.

### Retroalimentación (SPEC-24)

- `POST /mensajes/{mensajeId}/reaccion`: pulgares por mensaje con estado optimista y reintento silencioso. Copiar no llama al backend.
- `POST /sugerencias`: formulario de `/sugerencias` conectado, con captura JPG/PNG opcional y `Idempotency-Key`; muestra el código de seguimiento que devuelve el backend.

### Adjuntos (SPEC-23)

El compositor acepta hasta 3 imágenes JPG/PNG/WebP de 5 MB (`validateImageFile`), muestra el aviso de privacidad una vez por dispositivo, sube cada imagen con progreso y permite quitarla o reintentarla. El mensaje viaja con `adjuntoIds` y el historial muestra miniaturas con las URLs firmadas del backend; si una URL caduca se pide una nueva y, si falla, se muestra "Imagen no disponible". PDF queda fuera del alcance de SPEC-23.

## Dependencias externas

`mod-catalog`, `mod-cart`, `mod-checkout`, `mod-orders` y `mod-postventa` para renderizar sus bloques dentro de la conversación, siempre por `public.ts`. `mod-auth`, `mod-shipping` y `mod-postventa` están declarados para futuros bloques.

### Bloques de pedidos y postventa (delta M5)

`MessageBubble` renderiza `LISTA_PEDIDOS`, `ESTADO_PEDIDO`, `LISTA_RECLAMOS`, `ESTADO_RECLAMO`,
`CONSTANCIA_RECLAMO`, `LISTA_DEVOLUCIONES`, `ESTADO_DEVOLUCION` y `CONSTANCIA_DEVOLUCION` con los
componentes publicados por `mod-orders` y `mod-postventa`. `FORMULARIO/LOGIN` abre el `AuthModal`
global y `FORMULARIO/REENVIO_VERIFICACION` reutiliza `ReenviarVerificacionForm` de `mod-auth`.

Las acciones de cliente `IR_A_CHECKOUT`, `CERRAR_SESION`, `NUEVO_CHAT` y `BUSCAR_CHATS` se
interceptan en `ChatPage` antes de `ejecutarAccionChatUseCase`: una sola vez por turno, nunca al
rehidratar el historial. `/buscar` recibe el término en `payload.q`.

## Pruebas

- Unitarias: `tests/unit/mod_chat/` (31 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
