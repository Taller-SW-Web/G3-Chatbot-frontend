import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/shared/security/safeInternalPath";

describe("safeInternalPath", () => {
  it.each(["/", "/pedidos", "/pedidos?x=1", "/pedidos/reclamos?a=1&b=2#top", "/chat/abc-123"])(
    "acepta la ruta interna %s",
    (p) => expect(safeInternalPath(p)).toBe(p),
  );

  it.each([
    "//evil.com",
    "//evil.com/path",
    "/\\evil.com",
    "\\\\evil.com",
    "\\/evil.com",
    "https://evil.example",
    "http://evil.example/x",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>",
    "evil.com",
    "pedidos",
    "",
    "   ",
    "/\t/evil.com",
    "/\n/evil.com",
    " //evil.com",
    "/%2F/evil.com/../..",
    "/ok\\path",
  ])("rechaza %j", (p) => expect(safeInternalPath(p)).toBeNull());

  it("rechaza valores no string", () => {
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
  });
});
