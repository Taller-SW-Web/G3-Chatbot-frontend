/** Usuario y perfil que viajan en las respuestas de sesión (`/sesion/*`). */

export type UsuarioSesion = {
  id?: string;
  nombreCompleto?: string;
  correo?: string;
};

export type PerfilCliente = UsuarioSesion & {
  celular?: string;
  celularVerificado: boolean;
  ultimoDocumento: { tipo?: string; numeroEnmascarado: string } | null;
};

/** Respuesta de `POST /contacto/celular/solicitar-otp` (SPEC-04 Req. 2). */
export type SolicitudOtpCelular = {
  ok: boolean;
  celularEnmascarado?: string;
  expiraEnSegundos?: number;
  reenviosRestantes?: number;
  /** Solo en entornos de prueba (`MODO_QA`), nunca en producción. */
  codigoQa?: string;
};

/** Respuesta de `POST /contacto/celular/verificar-otp` (SPEC-04 Req. 2). */
export type VerificacionOtpCelular = {
  verificado: boolean;
  celular?: string;
  /** Acción que el backend ejecutó al verificar (`INICIAR_CHECKOUT`, …). */
  accionPendiente?: string | null;
};
