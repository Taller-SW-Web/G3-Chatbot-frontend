import { afterEach, describe, expect, it, vi } from "vitest";
import { newIdempotencyKey } from "@/domain/utils/idempotency";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("newIdempotencyKey", () => {
  it("usa crypto.randomUUID cuando está disponible", () => {
    const randomUUID = vi.fn(() => "123e4567-e89b-42d3-a456-426614174000");
    vi.stubGlobal("crypto", { randomUUID });

    expect(newIdempotencyKey()).toBe("123e4567-e89b-42d3-a456-426614174000");
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("genera UUID v4 con getRandomValues cuando no hay randomUUID", () => {
    const values = new Uint8Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    vi.stubGlobal("crypto", {
      getRandomValues: (target: Uint8Array) => {
        target.set(values);
        return target;
      },
    });

    const key = newIdempotencyKey();

    expect(key).toMatch(UUID_V4);
    expect(key[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(key[19].toLowerCase());
  });

  it("mantiene la forma v4 con el fallback de Math.random", () => {
    vi.stubGlobal("crypto", undefined);
    let calls = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      calls += 1;
      return ((calls % 97) + 1) / 98;
    });

    const key = newIdempotencyKey();

    expect(key).toMatch(UUID_V4);
    expect(newIdempotencyKey()).not.toBe(key);
  });
});
