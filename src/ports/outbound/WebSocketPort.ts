export type WsEvento =
  | { kind: "token"; texto: string }
  | { kind: "bloque"; bloqueId: string; tipo: string; payload: unknown }
  | { kind: "fin"; mensajeId: string }
  | { kind: "error"; code: string; detail?: string };

/**
 * Contrato WS: handshake JWT, reconexión, 2 reintentos luego polling 2s.
 * SPEC-05 Req.4
 */
export interface WebSocketPort {
  conectar(conversacionId: string, onEvento: (e: WsEvento) => void): void;
  desconectar(): void;
}
