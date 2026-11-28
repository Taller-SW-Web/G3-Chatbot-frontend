/**
 * Límites del contrato del canal conversacional que comparten la home y el chat.
 *
 * El valor es la verdad del backend (SPEC-05: 1 a 1000 caracteres). Vive en el
 * kernel para que el compositor de la home pueda validar sin cargar el grafo de
 * UI de `mod-chat`; el módulo lo reexporta como parte de su contrato público.
 */
export const MENSAJE_MAX_CARACTERES = 1000;
