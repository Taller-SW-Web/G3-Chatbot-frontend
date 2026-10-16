"use client";
import type { ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkResaltado } from "./remarkResaltado";

/*
 * Markdown de las respuestas del bot. Decisiones de seguridad:
 *  - Sin HTML crudo: no hay rehype-raw y `skipHtml` descarta el HTML embebido.
 *  - Sin imágenes: una URL de imagen en la salida del modelo podría filtrar datos.
 *  - Enlaces: solo http, https y mailto (sobre el filtrado por defecto de react-markdown).
 */
const PROTOCOLOS_PERMITIDOS = /^(https?:|mailto:)/i;

/** Solo conserva URLs absolutas con protocolo permitido; el resto queda vacío. */
export function transformarUrl(url: string): string {
  const segura = defaultUrlTransform(url);
  return PROTOCOLOS_PERMITIDOS.test(segura) ? segura : "";
}

const titulo = ({ children }: { children?: ReactNode }) => (
  <p className="my-2 font-bold first:mt-0 last:mb-0">{children}</p>
);

export const componentesMarkdown: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-5 first:mt-0 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5 first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  code: ({ children, className }) => (
    <code className={`rounded-xs bg-surface-cloud-subtle px-1 py-0.5 text-[13px] break-words ${className ?? ""}`}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xs bg-surface-cloud-subtle p-2 text-[13px] first:mt-0 last:mb-0 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-border-default pl-3 text-text-secondary first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-accent-signal-ink underline break-words"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-2 border-border-default" />,
  h1: titulo,
  h2: titulo,
  h3: titulo,
  h4: titulo,
  h5: titulo,
  h6: titulo,
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto first:mt-0 last:mb-0">
      <table className="border-collapse text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border-default bg-surface-cloud-subtle px-2 py-1 text-left font-bold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border-default px-2 py-1">{children}</td>,
  img: () => null,
};

/** Renderiza Markdown (GFM) del bot de forma segura; ver decisiones arriba. */
export function TextoMarkdown({ texto }: { texto: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkResaltado]}
      components={componentesMarkdown}
      urlTransform={transformarUrl}
      skipHtml
      disallowedElements={["img"]}
    >
      {texto}
    </ReactMarkdown>
  );
}
