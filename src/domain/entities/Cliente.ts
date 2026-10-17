/** Cliente / sesión visible en UI. Sin secretos. */
export type TipoDocumento = "DNI" | "RUC" | "CE" | "PASAPORTE";

/** Documento enmascarado (solo últimos 4 dígitos) del último checkout (SPEC-03 Req. 3). */
export type DocumentoEnmascarado = { tipo?: string; numeroEnmascarado: string };

export type Cliente = {
  id?: string;
  nombreCompleto: string;
  correo: string;
  correoEnmascarado?: string;
  celular?: string;
  celularEnmascarado?: string;
  celularVerificado: boolean;
  tipoDocumento?: TipoDocumento;
  documentoEnmascarado?: string;
  ultimoDocumento?: DocumentoEnmascarado | null;
};
