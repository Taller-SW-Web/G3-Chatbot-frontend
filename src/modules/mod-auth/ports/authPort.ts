import type { PoliticaContrasena } from "@/shared/auth/passwordPolicy";
import type {
  PerfilCliente,
  SolicitudOtpCelular,
  UsuarioSesion,
  VerificacionOtpCelular,
} from "@/shared/auth/types";

export type {
  PoliticaContrasena,
  PerfilCliente,
  SolicitudOtpCelular,
  UsuarioSesion,
  VerificacionOtpCelular,
};

export type SessionOpened = {
  accessToken: string;
  expiresIn: number;
  usuario: UsuarioSesion;
  /** Fusión del carrito anónimo (SPEC-03 Req. 4); solo aparece cuando hubo carrito. */
  carritoFusionado?: boolean;
  avisoCarrito?: string | null;
  ajustesCarrito?: Array<{
    sku: string;
    solicitado: number;
    ajustado: number;
    motivo: string;
  }>;
};

export type MfaChallenge = {
  mfaRequerido: true;
  canal: "EMAIL" | "SMS";
};

/** Datos del formulario de registro (SPEC-01 Req. 1); el adapter los mapea al contrato del BFF. */
export type RegistroClienteInput = {
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  contrasena: string;
  aceptaTerminos: true;
};

/** Respuesta de `POST /sesion/registro`: la cuenta queda PENDIENTE_VERIFICACION, sin sesión. */
export type RegistroResultado = {
  estado: string;
  correoEnmascarado: string;
};

/** Contrato REST de autenticación, cuenta y contacto (SPEC-01..04). */
export interface AuthPort {
  login(email: string, password: string): Promise<SessionOpened | MfaChallenge>;
  /** SPEC-01: crea la cuenta y devuelve el correo enmascarado; nunca abre sesión. */
  registrar(input: RegistroClienteInput): Promise<RegistroResultado>;
  /** SPEC-01 Req. 2: política de contraseña cacheada durante la sesión del navegador. */
  obtenerPoliticaContrasena(): Promise<PoliticaContrasena>;
  /** SPEC-02 Req. 1: canjea el enlace de verificación (204) o falla con 410. */
  verificarCorreo(token: string): Promise<void>;
  /** SPEC-02 Req. 2: reenvío neutro del enlace (202). */
  reenviarVerificacion(correo: string): Promise<{ ok: true }>;
  requestMfaCode(canal: "EMAIL" | "SMS"): Promise<{ ok: true }>;
  verifyMfaCode(code: string): Promise<SessionOpened>;
  refreshSession(): Promise<SessionOpened>;
  logout(): Promise<{ ok: true }>;
  fetchProfile(): Promise<PerfilCliente>;
  /** SPEC-04 Req. 2: envía un OTP simulado al celular vigente del perfil. */
  solicitarOtpCelular(): Promise<SolicitudOtpCelular>;
  /** SPEC-04 Req. 2: valida el OTP y deja el celular verificado localmente. */
  verificarOtpCelular(codigo: string): Promise<VerificacionOtpCelular>;
  /** Compatibilidad con la pantalla anterior: mismo endpoint de verificación. */
  validarContactoCelular(codigo: string): Promise<{ verificado: boolean }>;
}
