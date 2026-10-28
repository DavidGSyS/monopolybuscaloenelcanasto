import test from "node:test";
import assert from "node:assert/strict";
import { formatMoney, cn } from "../src/lib/utils";

/**
 * Pruebas unitarias con el test runner nativo de Node.js (cero dependencias externas)
 */
test("formatea correctamente las cantidades monetarias con símbolo por defecto", () => {
  const formatted = formatMoney(1500);
  assert.ok(formatted.includes("1.500"));
  assert.ok(formatted.includes("₵"));
});

test("combina correctamente clases condicionales", () => {
  const result = cn("base-class", true && "active", false && "hidden", undefined);
  assert.strictEqual(result, "base-class active");
});
