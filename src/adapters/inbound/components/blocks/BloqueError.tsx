import { sanitize } from "@/domain/utils/sanitize";

/** ERROR + Reintentar, ramifica por code. contratos §2.8 */
export function BloqueError({
  code,
  mensaje,
  onRetry,
}: {
  code: string;
  mensaje: string;
  onRetry: () => void;
}) {
  const titulo =
    code === "REQUIERE_SESION" ? "Necesitas iniciar sesión" :
    code === "STOCK_INSUFICIENTE" ? "Stock insuficiente" :
    code === "CARRITO_DESACTUALIZADO" ? "El carrito cambió" :
    "Algo salió mal";

  return (
    <div className="rounded-md bg-error-background border border-error-default p-3 flex flex-col gap-2" role="alert">
      <p className="text-[14px] font-bold text-error-default">{titulo} · {code}</p>
      <p className="text-[13px] text-text-primary">{sanitize(mensaje)}</p>
      <button onClick={onRetry}
        className="wf-btn py-2.5 text-[12px] font-bold bg-white border border-border-default">REINTENTAR</button>
    </div>
  );
}
