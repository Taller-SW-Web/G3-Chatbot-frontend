/** LISTA_PEDIDOS elegir entre varios. SPEC-17 */
export function ListaPedidos({
  pedidos,
}: {
  pedidos: { id: string; direccion: string; fecha: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {pedidos.map((p) => (
        <div key={p.id} className="rounded-md bg-white border border-border-default p-3 text-[14px]">
          <div className="flex justify-between"><span className="text-text-secondary">Pedido</span><span className="font-bold">{p.id}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Entrega</span><span className="text-right">{p.direccion}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Fecha</span><span>{p.fecha}</span></div>
        </div>
      ))}
    </div>
  );
}
