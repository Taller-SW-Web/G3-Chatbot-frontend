# Resumen

<!-- Una o dos líneas: qué cambia y por qué. -->

## Checklist

- [ ] El CI en verde (`check`).
- [ ] Un solo módulo (o `shared/` con label `cross-modulo`).
- [ ] Spec del módulo actualizada o cambio justificado en su `MODULE.md`.
- [ ] `pnpm modules:check` en verde (estructura, fronteras, registry y contrato).
- [ ] Sin imports profundos a otro módulo ni `container.api` en `src/modules/**`.
- [ ] Tests nuevos o ajustados para el cambio.
- [ ] Sin secretos ni credenciales en el diff (`.env`, tokens, claves).
- [ ] Sin dependencias nuevas sin justificar.
- [ ] Documentación o spec actualizada si cambia comportamiento.
