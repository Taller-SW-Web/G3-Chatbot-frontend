# Auditoría de dependencias y excepciones

El job `Dependency audit` (job `security` en `.github/workflows/ci.yml`) es
**bloqueante**: corre `pnpm audit --audit-level=high` sobre el lockfile y, si
queda un advisory `high` o `critical`, el job falla y con él el status
requerido `check`.

- No hay `|| echo` ni `|| true`: el comando manda el código de salida.
- No se usa `--ignore-registry-errors`: si el registro no responde, el gate
  falla en vez de dar por buena una auditoría que no ocurrió. Se reintenta
  re-ejecutando el job.
- Los advisories `info`, `low` y `moderate` se imprimen pero no bloquean.

Reproducción local (misma salida que CI):

```bash
pnpm audit --audit-level=high
pnpm audit --json   # detalle por severidad y IDs GHSA
```

## Estado actual

Sin excepciones vigentes. Última verificación: **2026-11-25**, `pnpm audit
--audit-level=high` → `No known vulnerabilities found` (722 dependencias,
0 advisories en todas las severidades).

| GHSA | Paquete | Severidad | Motivo | Mitigación | Owner | Revisión |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

## Cómo se acepta una excepción

Una excepción es deuda de seguridad con dueño y fecha, no un silencio. Solo se
acepta si el advisory **no es explotable** en este frontend (por ejemplo, una
vulnerabilidad en una ruta de build que no se ejecuta en runtime, o una
dependencia transitiva cuyo código vulnerable nunca se invoca) y si no existe
versión parcheada compatible con el lockfile. Si hay parche, se sube la
dependencia (o un `overrides` puntual en `package.json`) en el mismo PR.

1. Agrega el ID GHSA que imprime `pnpm audit` (columna *More info*; el endpoint
   bulk del registro no devuelve CVE) al mecanismo soportado por pnpm 10.34.6,
   en `pnpm-workspace.yaml`:

   ```yaml
   auditConfig:
     ignoreGhsas:
       - GHSA-xxxx-xxxx-xxxx
   ```

   `auditConfig.ignoreCves` existe en pnpm 10, pero se prefiere GHSA porque es
   el identificador que devuelve el registro. No inventes flags: `pnpm audit
   --help` de la versión fijada expone `--audit-level`, `--prod`/`--dev`,
   `--optional`/`--no-optional`, `--json`, `--fix`, `--interactive` y
   `--ignore-registry-errors`; no hay flag para ignorar un advisory puntual.
   (pnpm 12 renombró la clave a `audit.ignore`, pero sigue leyendo
   `auditConfig.ignoreGhsas`.)

2. Registra la fila en la tabla de arriba con motivo, mitigación, owner y fecha
   de revisión (máximo 90 días). Sin fila, la excepción no existe aunque el
   YAML la silencie.

3. Reejecuta `pnpm audit --audit-level=high` y pega la salida en el PR: la
   excepción debe dejar el comando en verde y el resto de advisories intacto.

4. Al vencer la revisión, se corrige la dependencia o se renueva la
   justificación. Una excepción vencida bloquea el PR que la toque.
