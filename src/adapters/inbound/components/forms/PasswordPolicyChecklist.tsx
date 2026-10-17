"use client";

import { CheckIcon } from "../icons";
import {
  evaluarPolitica,
  type PoliticaContrasena,
} from "@/domain/utils/passwordPolicy";

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
        <li key={regla.clave} className="flex items-center gap-1.5 text-[12px]">
          <span className={regla.cumple ? "text-success-default" : "text-text-disabled"}>
            <CheckIcon size={16} />
          </span>
          <span className={regla.cumple ? "text-success-default" : "text-text-secondary"}>
            {regla.etiqueta}
          </span>
          <span className="sr-only">{regla.cumple ? "cumplida" : "pendiente"}</span>
        </li>
      ))}
    </ul>
  );
}
