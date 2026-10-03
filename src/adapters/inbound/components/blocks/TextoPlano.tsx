import { sanitize } from "@/domain/utils/sanitize";

/** Bloque TEXTO — contratos §2.1 */
export function TextoPlano({ texto }: { texto: string }) {
  return <p className="text-[14px] leading-5">{sanitize(texto)}</p>;
}
