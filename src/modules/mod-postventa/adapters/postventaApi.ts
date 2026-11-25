"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import { newIdempotencyKey } from "@/shared/api/idempotency";
import type {
  CrearDevolucionInput,
  CrearReclamoInput,
  DevolucionDetalle,
  EvidenciaSubida,
  PaginaDevoluciones,
  PaginaReclamos,
  PostventaPort,
  ReclamoDetalle,
} from "@/modules/mod-postventa/ports/postventaPort";

/** Adapter REST de devoluciones, reclamos y evidencias (SPEC-19..22). */
export const postventaApi: PostventaPort = {
  async subirEvidencia(file: File, conversacionId?: string): Promise<EvidenciaSubida> {
    const form = new FormData();
    form.append("file", file);
    if (conversacionId) form.append("conversacionId", conversacionId);
    const { data } = await http.post("/evidencias", form, {
      timeout: apiConfig.timeouts.postventa,
    });
    return data as EvidenciaSubida;
  },
  async crearDevolucion(input: CrearDevolucionInput, idempotencyKey?: string): Promise<DevolucionDetalle> {
    const { data } = await http.post("/devoluciones", input, {
      headers: { "Idempotency-Key": idempotencyKey || newIdempotencyKey() },
      timeout: apiConfig.timeouts.postventa,
    });
    return data as DevolucionDetalle;
  },
  async listarDevoluciones(input = {}): Promise<PaginaDevoluciones> {
    const { data } = await http.get("/devoluciones", {
      params: {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
        ...(input.estado ? { estado: input.estado } : {}),
        ...(input.tipo ? { tipo: input.tipo } : {}),
      },
      timeout: apiConfig.timeouts.postventa,
    });
    return data as PaginaDevoluciones;
  },
  async obtenerDevolucion(devolucionId: string): Promise<DevolucionDetalle> {
    const { data } = await http.get(`/devoluciones/${encodeURIComponent(devolucionId)}`, {
      timeout: apiConfig.timeouts.postventa,
    });
    return data as DevolucionDetalle;
  },
  async crearReclamo(input: CrearReclamoInput, idempotencyKey?: string): Promise<ReclamoDetalle> {
    const { data } = await http.post("/reclamos", input, {
      headers: { "Idempotency-Key": idempotencyKey || newIdempotencyKey() },
      timeout: apiConfig.timeouts.postventa,
    });
    return data as ReclamoDetalle;
  },
  async listarReclamos(input = {}): Promise<PaginaReclamos> {
    const { data } = await http.get("/reclamos", {
      params: {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
        ...(input.estado ? { estado: input.estado } : {}),
      },
      timeout: apiConfig.timeouts.postventa,
    });
    return data as PaginaReclamos;
  },
  async obtenerReclamo(codigoSeguimiento: string): Promise<ReclamoDetalle> {
    const { data } = await http.get(`/reclamos/${encodeURIComponent(codigoSeguimiento)}`, {
      timeout: apiConfig.timeouts.postventa,
    });
    return data as ReclamoDetalle;
  },
};
