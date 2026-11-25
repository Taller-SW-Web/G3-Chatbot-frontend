/**
 * Superficie pública de mod-chat.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { ChatPage } from "./ui/ChatPage";
export { SearchChatsPage } from "./ui/SearchChatsPage";
export { Sidebar } from "./ui/Sidebar";
export { SugerenciasPage } from "./ui/SugerenciasPage";
export { MessageBubble, renderChatText, renderBloque } from "./ui/MessageBubble";
export { ChatWindow } from "./ui/ChatWindow";
export type { AccionRapidaChat } from "./ui/ChatWindow";
export { mensajePorCodigo } from "./ui/chatPresentacion";

export { useChat } from "./application/useChat";
export { crearConversacionUseCase } from "./application/crearConversacionUseCase";
export { ejecutarAccionChatUseCase } from "./application/ejecutarAccionChatUseCase";
export { MENSAJE_MAX_CARACTERES } from "./application/enviarMensajeUseCase";
export { enviarReaccionUseCase } from "./application/enviarReaccionUseCase";
export { enviarSugerenciaUseCase } from "./application/enviarSugerenciaUseCase";
export { useReaccion } from "./application/useReaccion";
export { useAdjuntosChat } from "./application/useAdjuntosChat";
export type { AdjuntoPendiente, EstadoAdjuntoPendiente } from "./application/useAdjuntosChat";

export type {
  AccionChat,
  ChatApiPort,
  ConversacionResumen,
  NuevaSugerenciaInput,
  ReaccionMensaje,
  ResultadoAccionChat,
  SegmentoResaltado,
  SugerenciaCreada,
} from "./ports/chatApiPort";
export type { ChatStreamEvento, ChatStreamPort } from "./ports/chatStreamPort";
