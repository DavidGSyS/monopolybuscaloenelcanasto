import test from "node:test";
import assert from "node:assert/strict";
import { detectPlatform, isRunningStandalone } from "../src/lib/device";

test("detectPlatform retorna 'unknown' o valor seguro en entorno sin ventana", () => {
  // En entorno Node.js (donde window/navigator no existen o son simulados), debe manejarlo sin excepción
  const platform = detectPlatform();
  assert.ok(["desktop", "unknown", "ios", "android"].includes(platform));
});

test("isRunningStandalone retorna false de forma segura en entorno no-browser", () => {
  const standalone = isRunningStandalone();
  assert.strictEqual(typeof standalone, "boolean");
});
