// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthModal } from "@/adapters/inbound/components/AuthModal";
import { useChatStore } from "@/application/state/chatStore";
import { POLITICA_POR_DEFECTO } from "@/domain/utils/passwordPolicy";

const api = vi.hoisted(() => ({
  login: vi.fn(),
  registrar: vi.fn(),
  obtenerPoliticaContrasena: vi.fn(),
  reenviarVerificacion: vi.fn(),
  requestMfaCode: vi.fn(),
  verifyMfaCode: vi.fn(),
  fetchProfile: vi.fn(),
}));
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/infrastructure/di/container", () => ({ container: { api } }));

const sesion = {
  accessToken: "jwt-123",
  expiresIn: 900,
  usuario: { id: "u1", nombreCompleto: "Ana Torres", correo: "ana@ejemplo.pe" },
};

const perfil = {
  id: "u1",
  nombreCompleto: "Ana Torres",
  correo: "ana@ejemplo.pe",
  celularVerificado: true,
  ultimoDocumento: null,
};

function resetStore() {
  useChatStore.setState({
    accessToken: null,
    expiraEn: null,
    cliente: null,
    accionPendiente: null,
    authOpen: true,
    authVista: "login",
  });
  localStorage.clear();
}

function errorCon(code: string, status: number, extra: Record<string, unknown> = {}) {
  return { response: { status, data: { code, ...extra } } };
}

/** El texto del aviso se parte en varios nodos: se compara sobre el párrafo completo. */
function parrafo(regex: RegExp): HTMLElement {
  return screen.getByText(
    (_, el) => el?.tagName === "P" && regex.test(el.textContent ?? "")
  ) as HTMLElement;
}

function login(correo = "ana@ejemplo.pe", password = "Segura123") {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "ENTRAR" }));
}

function registro() {
  fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Torres" } });
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@ejemplo.pe" } });
  fireEvent.change(screen.getByLabelText("Celular"), { target: { value: "987654321" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Segura123" } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "Segura123" } });
  fireEvent.click(screen.getByLabelText(/Acepto los/));
  fireEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
  api.obtenerPoliticaContrasena.mockResolvedValue(POLITICA_POR_DEFECTO);
  api.fetchProfile.mockResolvedValue(perfil);
  api.login.mockResolvedValue(sesion);
  api.registrar.mockResolvedValue({ estado: "PENDIENTE_VERIFICACION", correoEnmascarado: "a***@ejemplo.pe" });
  api.reenviarVerificacion.mockResolvedValue({ ok: true });
  api.requestMfaCode.mockResolvedValue({ ok: true });
  api.verifyMfaCode.mockResolvedValue(sesion);
});

afterEach(cleanup);

describe("AuthModal", () => {
  it("abre en la pestaña de login", () => {
    render(<AuthModal />);
    expect(screen.getByText("Inicia sesión")).toBeDefined();
    expect(screen.getByRole("button", { name: "ENTRAR" })).toBeDefined();
  });

  it("cambia a registro y pide la política de contraseña una sola vez", async () => {
    render(<AuthModal />);

    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    expect(screen.getByText("Crea tu cuenta")).toBeDefined();

    await waitFor(() => expect(api.obtenerPoliticaContrasena).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "INICIAR SESIÓN" }));
    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    expect(api.obtenerPoliticaContrasena).toHaveBeenCalledTimes(1);
  });

  it("inicia sesión, hidrata el perfil y retoma la acción pendiente", async () => {
    useChatStore.setState({ accionPendiente: "/checkout" });
    render(<AuthModal />);

    login();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/checkout"));

    expect(api.login).toHaveBeenCalledWith("ana@ejemplo.pe", "Segura123");
    expect(useChatStore.getState().accessToken).toBe("jwt-123");
    expect(useChatStore.getState().cliente?.correo).toBe("ana@ejemplo.pe");
    expect(useChatStore.getState().authOpen).toBe(false);
    expect(useChatStore.getState().accionPendiente).toBeNull();
  });

  it("cierra sin navegar cuando no hay acción pendiente", async () => {
    render(<AuthModal />);

    login();
    await waitFor(() => expect(useChatStore.getState().authOpen).toBe(false));
    expect(push).not.toHaveBeenCalled();
  });

  it("muestra el error de credenciales y no abre sesión", async () => {
    api.login.mockRejectedValue(errorCon("CREDENCIALES_INVALIDAS", 401));
    render(<AuthModal />);

    login();
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/Correo o contraseña incorrectos/)).toBeDefined();
    expect(useChatStore.getState().accessToken).toBeNull();
  });

  it("traduce el bloqueo por demasiados intentos", async () => {
    api.login.mockRejectedValue(errorCon("DEMASIADOS_INTENTOS", 429));
    render(<AuthModal />);

    login();
    expect(await screen.findByText(/Demasiados intentos/)).toBeDefined();
  });

  it("pide el código MFA y abre la sesión al verificarlo", async () => {
    api.login.mockResolvedValue({ mfaRequerido: true, canal: "EMAIL" });
    render(<AuthModal />);

    login();
    expect(await screen.findByText("Verifica tu identidad")).toBeDefined();
    expect(parrafo(/Enviamos un c.digo a/).textContent).toContain("a****@ejemplo.pe");

    fireEvent.change(screen.getByLabelText(/C.digo de verificaci.n/), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR MFA" }));

    await waitFor(() => expect(useChatStore.getState().accessToken).toBe("jwt-123"));
    expect(api.verifyMfaCode).toHaveBeenCalledWith("123456");
    expect(useChatStore.getState().cliente?.correo).toBe("ana@ejemplo.pe");
  });

  it("vuelve al login cuando se agotan los intentos del código", async () => {
    api.login.mockResolvedValue({ mfaRequerido: true, canal: "SMS" });
    api.verifyMfaCode.mockRejectedValue(errorCon("OTP_INTENTOS_AGOTADOS", 429));
    render(<AuthModal />);

    login();
    await screen.findByText("Verifica tu identidad");
    expect(parrafo(/Enviamos un c.digo a/)).toBeDefined();

    fireEvent.change(screen.getByLabelText(/C.digo de verificaci.n/), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR MFA" }));

    expect(await screen.findByText(/Agotaste los intentos/)).toBeDefined();
    expect(screen.getByRole("button", { name: "ENTRAR" })).toBeDefined();
  });

  it("reenvía el código y alterna el canal", async () => {
    api.login.mockResolvedValue({ mfaRequerido: true, canal: "EMAIL" });
    render(<AuthModal />);

    login();
    await screen.findByText("Verifica tu identidad");

    fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    await waitFor(() => expect(api.requestMfaCode).toHaveBeenCalledWith("EMAIL"));

    fireEvent.click(screen.getByRole("button", { name: "Enviar por SMS" }));
    await waitFor(() => expect(api.requestMfaCode).toHaveBeenCalledWith("SMS"));
    expect(screen.getByRole("button", { name: "Enviar por correo" })).toBeDefined();
  });

  it("registra la cuenta y muestra la verificación de correo", async () => {
    render(<AuthModal />);

    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    await waitFor(() => expect(api.obtenerPoliticaContrasena).toHaveBeenCalled());
    registro();

    expect(await screen.findByText(/REVISA TU CORREO/)).toBeDefined();
    expect(parrafo(/Te enviamos un enlace a/).textContent).toContain("a***@ejemplo.pe");
    expect(api.registrar).toHaveBeenCalledWith(expect.objectContaining({
      nombres: "Ana",
      apellidos: "Torres",
      correo: "ana@ejemplo.pe",
      celular: "+51987654321",
      contrasena: "Segura123",
      confirmar: "Segura123",
      aceptaTerminos: true,
    }));
    expect(useChatStore.getState().accessToken).toBeNull();
  });

  it("reenvía el enlace desde la pantalla de verificación", async () => {
    render(<AuthModal />);

    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    await waitFor(() => expect(api.obtenerPoliticaContrasena).toHaveBeenCalled());
    registro();
    await screen.findByText(/REVISA TU CORREO/);

    fireEvent.click(screen.getByRole("button", { name: "Reenviar correo" }));
    await waitFor(() => expect(api.reenviarVerificacion).toHaveBeenCalledWith("ana@ejemplo.pe"));
    expect(await screen.findByText(/Si hay una cuenta pendiente con ese correo/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "YA VERIFIQUÉ, INICIAR SESIÓN" }));
    expect(screen.getByRole("button", { name: "ENTRAR" })).toBeDefined();
  });

  it("ofrece iniciar sesión cuando el correo ya está registrado", async () => {
    api.registrar.mockRejectedValue(errorCon("CORREO_NO_DISPONIBLE", 409));
    render(<AuthModal />);

    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    await waitFor(() => expect(api.obtenerPoliticaContrasena).toHaveBeenCalled());
    registro();

    expect(await screen.findByText(/Si el correo es válido/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByRole("button", { name: "ENTRAR" })).toBeDefined();
  });

  it("marca los campos que rechaza el backend", async () => {
    api.registrar.mockRejectedValue(
      errorCon("VALIDACION", 400, { errores: [{ campo: "email", mensaje: "Ya está en uso" }] })
    );
    render(<AuthModal />);

    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    await waitFor(() => expect(api.obtenerPoliticaContrasena).toHaveBeenCalled());
    registro();

    expect(await screen.findByText("Ya está en uso")).toBeDefined();
    expect(screen.getByText("Revisa los campos marcados")).toBeDefined();
  });

  it("abre el reenvío desde el login y vuelve", async () => {
    render(<AuthModal />);

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@ejemplo.pe" } });
    fireEvent.click(screen.getByRole("button", { name: /No verificaste tu correo/ }));

    expect(screen.getByText("Reenviar verificación")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@ejemplo.pe" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIARME UN ENLACE NUEVO" }));

    await waitFor(() => expect(api.reenviarVerificacion).toHaveBeenCalledWith("ana@ejemplo.pe"));
    fireEvent.click(screen.getByRole("button", { name: "Volver a iniciar sesión" }));
    expect(screen.getByRole("button", { name: "ENTRAR" })).toBeDefined();
  });

  it("informa el fallo del reenvío sin filtrar si la cuenta existe", async () => {
    api.reenviarVerificacion.mockRejectedValue(errorCon("LIMITE_REENVIOS", 429));
    render(<AuthModal />);

    fireEvent.click(screen.getByRole("button", { name: /No verificaste tu correo/ }));
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@ejemplo.pe" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIARME UN ENLACE NUEVO" }));

    expect(await screen.findByText(/Ya enviamos varios enlaces/)).toBeDefined();
  });

  it("cierra con el botón del diálogo y deja el modal apagado", () => {
    render(<AuthModal />);

    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(useChatStore.getState().authOpen).toBe(false);
  });
});
