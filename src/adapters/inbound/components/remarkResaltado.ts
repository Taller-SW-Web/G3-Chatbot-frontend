import { dividirResaltado } from "./resaltadoChat";

/* Forma mínima de un nodo mdast; evita depender de @types/mdast. */
type NodoMdast = { type: string; value?: string; children?: NodoMdast[] };

/* Contenido donde el resaltado corrompería el significado (código, URLs) o duplicaría negrita. */
const TIPOS_OMITIDOS = new Set(["code", "inlineCode", "link", "linkReference", "strong", "html"]);

function resaltarHijos(hijos: NodoMdast[]): NodoMdast[] {
  return hijos.flatMap((nodo): NodoMdast[] => {
    if (TIPOS_OMITIDOS.has(nodo.type)) return [nodo];
    if (nodo.type === "text" && typeof nodo.value === "string") {
      const segmentos = dividirResaltado(nodo.value);
      if (!segmentos.some((s) => s.resaltado)) return [nodo];
      return segmentos.map((s): NodoMdast =>
        s.resaltado
          ? { type: "strong", children: [{ type: "text", value: s.texto }] }
          : { type: "text", value: s.texto }
      );
    }
    if (nodo.children) nodo.children = resaltarHijos(nodo.children);
    return [nodo];
  });
}

/** Plugin remark: envuelve en `strong` los códigos y promociones de los nodos de texto. */
export function remarkResaltado() {
  return (arbol: NodoMdast) => {
    if (arbol.children) arbol.children = resaltarHijos(arbol.children);
  };
}
