/** LISTA_PROMOCIONES canal CHATBOT. SPEC-08 */
export function ListaPromociones({
  promos,
}: {
  promos: { titulo: string; vigencia: string }[];
}) {
  return (
    <div className="rounded-md bg-surface-ink text-text-inverse p-3 flex flex-col gap-2">
      <p className="font-heading text-[15px] uppercase text-accent-volt">Promos chatbot</p>
      {promos.map((p) => (
        <div key={p.titulo} className="flex justify-between gap-2 text-[13px]">
          <span>{p.titulo}</span><span className="text-text-inverse-soft shrink-0">{p.vigencia}</span>
        </div>
      ))}
    </div>
  );
}
