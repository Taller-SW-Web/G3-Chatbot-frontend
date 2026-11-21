# `mod-auth` — Autenticación y cuenta

- **Owner:** @Ankarmin
- **Frontend:** carpeta `mod-auth`, rutas `[/cuenta, /verificar-correo]`
- **Depende de:** ninguno
- **Contrato:** `/sesion/*` y `/contacto/celular/verificar-otp`

## Responsabilidad

Sesión del cliente, registro, MFA, verificación de correo y datos de cuenta. No incluye el store de sesión ni el guard: ambos viven en `shared/auth` porque los usa toda la app.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `AuthModal`, `MiCuentaPage`, `VerificarCorreoPage`, `validarContactoUseCase`, tipos de sesión |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/cuenta` | Ver datos, verificar celular con OTP |
| GET | `/verificar-correo` | Canjear el enlace del correo |

## Endpoints

`POST /sesion/login`, `POST /sesion/registro`, `GET /sesion/politica-contrasena`, `POST /sesion/verificar-correo`, `POST /sesion/verificar-correo/reenviar`, `POST /sesion/mfa/solicitar`, `POST /sesion/mfa/verificar`, `POST /sesion/refresh`, `POST /sesion/logout`, `GET /sesion/perfil`, `POST /contacto/celular/verificar-otp`.

## Dependencias externas

Ninguna. Consume `shared/api`, `shared/auth`, `shared/ui` y su propio árbol.

## Pruebas

- Unitarias: `tests/unit/mod_auth/` (8 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
