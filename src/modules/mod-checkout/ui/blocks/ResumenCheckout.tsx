/** RESUMEN_CHECKOUT + Confirmar y pagar. SPEC-14 */
export function ResumenCheckout({
  total,
  direccion,
  tarjetaLast4,
}: {
  total: number;
  direccion: string;
  tarjetaLast4: string;
}) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1">
      <p className="font-heading text-[15px] uppercase">Resumen</p>
      <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Entrega</span><span className="font-semibold text-right">{direccion}</span></div>
      <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Tarjeta</span><span className="font-semibold">•••• {tarjetaLast4}</span></div>
      <div className="flex justify-between text-[14px] border-t border-dashed border-border-default pt-2 mt-1">
        <span className="text-text-secondary">Total</span><span className="font-heading text-[20px]">S/ {total}.00</span>
      </div>
    </div>
  );
}
