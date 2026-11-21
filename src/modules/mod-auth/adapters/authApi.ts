"use client";

import { http, refreshSessionOnce } from "@/shared/api/http";
import { useChatStore } from "@/shared/auth/chatStore";
import { normalizarPolitica } from "@/shared/auth/passwordPolicy";
import {
  getPoliticaContrasenaCache,
  setPoliticaContrasenaCache,
} from "@/modules/mod-auth/application/politicaContrasenaCache";
import type {
  AuthPort,
  MfaChallenge,
  PerfilCliente,
  PoliticaContrasena,
  RegistroClienteInput,
  RegistroResultado,
  SessionOpened,
} from "@/modules/mod-auth/ports/authPort";

/** Adapter REST de autenticación, cuenta y contacto (SPEC-01..04). */
export const authApi: AuthPort = {
  async login(email, password) {
    const { data } = await http.post("/sesion/login", { email, password });
    if (data?.mfaRequerido) return data as MfaChallenge;
    return data as SessionOpened;
  },
  // SPEC-01: sin fallback a mocks; los errores problem+json los ramifica la UI por `code`.
  async registrar(input: RegistroClienteInput): Promise<RegistroResultado> {
    const { data } = await http.post("/sesion/registro", {
      email: input.correo,
      password: input.contrasena,
      phone: input.celular,
      firstName: input.nombres,
      lastName: input.apellidos,
      acceptTerms: input.aceptaTerminos,
    });
    return data as RegistroResultado;
  },
  async obtenerPoliticaContrasena(): Promise<PoliticaContrasena> {
    const cache = getPoliticaContrasenaCache();
    if (cache) return cache;
    const { data } = await http.get("/sesion/politica-contrasena");
    const politica = normalizarPolitica(data as PoliticaContrasena);
    setPoliticaContrasenaCache(politica);
    return politica;
  },
  async verificarCorreo(token: string): Promise<void> {
    await http.post("/sesion/verificar-correo", { token });
  },
  async reenviarVerificacion(correo: string) {
    const { data } = await http.post("/sesion/verificar-correo/reenviar", {
      email: correo,
    });
    return data as { ok: true };
  },
  async requestMfaCode(canal) {
    const { data } = await http.post("/sesion/mfa/solicitar", { canal });
    return data as { ok: true };
  },
  async verifyMfaCode(code) {
    const { data } = await http.post("/sesion/mfa/verificar", { code });
    return data as SessionOpened;
  },
  async refreshSession() {
    return (await refreshSessionOnce()) as SessionOpened;
  },
  async logout() {
    try {
      const { data } = await http.post("/sesion/logout");
      return data as { ok: true };
    } finally {
      useChatStore.getState().logout();
    }
  },
  async fetchProfile() {
    const { data } = await http.get("/sesion/perfil");
    return data as PerfilCliente;
  },
  async validarContactoCelular(codigo) {
    const { data } = await http.post(`/contacto/celular/verificar-otp`, {
      codigo,
    });
    return data as { verificado: boolean };
  },
};
