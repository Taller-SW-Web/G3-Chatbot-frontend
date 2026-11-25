"use client";

import { CheckIcon } from "@/shared/ui/icons";
import type { PoliticaContrasena } from "@/shared/auth/passwordPolicy";
import { evaluarPolitica } from "@/modules/mod-auth/domain/passwordPolicy";

/** SPEC-01 Req. 2: reglas de la política de Seguridad evaluadas en tiempo real. */
export function PasswordPolicyChecklist({
  politica,
  valor,
  id = "politica-contrasena",
}: {
  politica: PoliticaContrasena;
  valor: string;
  id?: string;
}) {
  const reglas = evaluarPolitica(politica, valor);
  return (
    <ul id={id} className="flex flex-col gap-1" aria-live="polite">
      {reglas.map((regla) => (
        <li key={regla.clave} className="flex items-center gap-1.5 text-[12px] transition-colors duration-150">
          <span className={`transition-all duration-200 ${regla.cumple ? "text-success-default scale-105" : "text-text-disabled scale-100"}`}>
            <CheckIcon size={16} />
          </span>
          <span className={`transition-colors duration-150 ${regla.cumple ? "text-success-default font-medium" : "text-text-secondary"}`}>
            {regla.etiqueta}
          </span>
          <span className="sr-only">{regla.cumple ? "cumplida" : "pendiente"}</span>
        </li>
      ))}
    </ul>
  );
}
