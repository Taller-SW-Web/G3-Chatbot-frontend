# `mod-auth` — Autenticación y cuenta

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-auth`, rutas `[/cuenta, /verificar-correo]`
- **Depende de:** ninguno
- **Contrato:** `/sesion/*`, `/contacto/celular/solicitar-otp` y `/contacto/celular/verificar-otp`

## Responsabilidad

Sesión del cliente, registro, MFA, verificación de correo, datos de cuenta y política de contraseña evaluable (reglas + caché). No incluye el store de sesión ni el guard: ambos viven en `shared/auth` porque los usa toda la app.

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

`POST /sesion/login`, `POST /sesion/registro`, `GET /sesion/politica-contrasena`, `POST /sesion/verificar-correo`, `POST /sesion/verificar-correo/reenviar`, `POST /sesion/mfa/solicitar`, `POST /sesion/mfa/verificar`, `POST /sesion/refresh`, `POST /sesion/logout`, `GET /sesion/perfil`, `POST /contacto/celular/solicitar-otp`, `POST /contacto/celular/verificar-otp`.

El OTP del celular (SPEC-04) es local del chatbot: el flujo completo vive en `shared/auth/OtpCelularFlow` (reutilizado por checkout) y reutiliza la primitiva `shared/ui/OtpInput`. La vigencia de 5 minutos, los 3 intentos y el temporizador de reenvío se manejan del lado del cliente; el backend sigue siendo la autoridad.

## Dependencias externas

Ninguna. Consume `shared/api`, `shared/auth`, `shared/ui` y su propio árbol.

## Pruebas

- Unitarias: `tests/unit/mod_auth/` (8 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
