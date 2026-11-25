/**
 * Superficie pública de mod-auth.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { AuthModal } from "./ui/AuthModal";
export { MiCuentaPage } from "./ui/MiCuentaPage";
export { VerificarCorreoPage } from "./ui/VerificarCorreoPage";
export { TerminosPage } from "./ui/TerminosPage";
export { validarContactoUseCase } from "./application/validarContactoUseCase";
export {
  solicitarOtpCelularUseCase,
  verificarOtpCelularUseCase,
} from "./application/otpCelularUseCases";
export type { RegistroInput } from "./domain/schemas/registro.schema";

export type {
  AuthPort,
  MfaChallenge,
  PerfilCliente,
  PoliticaContrasena,
  RegistroClienteInput,
  RegistroResultado,
  SessionOpened,
  SolicitudOtpCelular,
  UsuarioSesion,
  VerificacionOtpCelular,
} from "./ports/authPort";
