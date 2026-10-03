/** Cliente / sesión visible en UI. Sin secretos. */
export type Cliente = {
  nombreCompleto: string;
  correo: string;
  correoEnmascarado: string;
  celular: string;
  celularEnmascarado: string;
  celularVerificado: boolean;
  tipoDocumento: "DNI" | "RUC" | "CE" | "PASAPORTE";
  documentoEnmascarado: string;
};
