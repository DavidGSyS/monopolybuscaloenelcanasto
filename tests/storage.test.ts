import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  loadStorageData,
  saveStorageData,
  migrateStorageData,
  isStorageAvailable,
  STORAGE_KEYS,
  CURRENT_STORAGE_VERSION,
} from "../src/lib/storage";
import { createGameSession } from "../src/lib/gameEngine";
import { CanastoStorageData } from "../src/types";

/**
 * Mock de Storage para pruebas de aislamiento sin depender de navegadores
 */
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  public simulateQuotaError = false;
  public simulateSecurityError = false;

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    if (this.simulateSecurityError) {
      throw new DOMException("Access is denied", "SecurityError");
    }
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.items.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    if (this.simulateSecurityError) {
      throw new DOMException("Access is denied", "SecurityError");
    }
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.simulateSecurityError) {
      throw new DOMException("Access is denied", "SecurityError");
    }
    if (this.simulateQuotaError) {
      const quotaErr = new DOMException(
        "The quota has been exceeded.",
        "QuotaExceededError"
      );
      Object.defineProperty(quotaErr, "code", { value: 22 });
      throw quotaErr;
    }
    this.items.set(key, value);
  }

  // Utilidad para inspeccionar las claves en los tests
  hasKeyStartingWith(prefix: string): boolean {
    return Array.from(this.items.keys()).some((k) => k.startsWith(prefix));
  }
}

describe("Persistencia Local y Almacenamiento (Storage Engine)", () => {
  let mockStorage: MemoryStorage;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
  });

  it("detecta correctamente si el almacenamiento está disponible", () => {
    assert.strictEqual(isStorageAvailable(mockStorage), true);

    mockStorage.simulateSecurityError = true;
    assert.strictEqual(isStorageAvailable(mockStorage), false);
  });

  it("retorna estructura vacía segura cuando no hay datos guardados", () => {
    const result = loadStorageData(mockStorage);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data?.version, CURRENT_STORAGE_VERSION);
    assert.deepStrictEqual(result.data?.sessions, {});
    assert.strictEqual(result.data?.activeSessionId, null);
  });

  it("guarda y recupera partidas con esquema versionado", () => {
    const session1 = createGameSession({
      name: "Partida Alpha",
      players: ["David", "Laura"],
      startingBalance: 1500,
    });

    const session2 = createGameSession({
      name: "Partida Beta",
      players: ["Carlos", "Elena", "Mario"],
      startingBalance: 2000,
    });

    const storagePayload: CanastoStorageData = {
      version: CURRENT_STORAGE_VERSION,
      sessions: {
        [session1.id]: session1,
        [session2.id]: session2,
      },
      activeSessionId: session1.id,
      lastUpdated: Date.now(),
    };

    const saveResult = saveStorageData(storagePayload, mockStorage);
    assert.strictEqual(saveResult.success, true);

    const loadResult = loadStorageData(mockStorage);
    assert.strictEqual(loadResult.success, true);
    assert.strictEqual(loadResult.data?.version, CURRENT_STORAGE_VERSION);
    assert.strictEqual(loadResult.data?.activeSessionId, session1.id);

    // Ambas partidas deben estar intactas y aisladas
    assert.strictEqual(Object.keys(loadResult.data?.sessions || {}).length, 2);
    assert.strictEqual(loadResult.data?.sessions[session1.id].name, "Partida Alpha");
    assert.strictEqual(loadResult.data?.sessions[session2.id].name, "Partida Beta");
    assert.strictEqual(loadResult.data?.sessions[session1.id].players[0].balance, 1500);
    assert.strictEqual(loadResult.data?.sessions[session2.id].players[0].balance, 2000);
  });

  it("maneja JSON corrupto creando respaldo sin borrar datos silenciosamente", () => {
    // Inyectar datos malformados directamente en el almacenamiento
    mockStorage.setItem(STORAGE_KEYS.PRIMARY, "{ malformed: json -- corrupt");

    const loadResult = loadStorageData(mockStorage);

    // Debe notificar el error de corrupción estructurado
    assert.strictEqual(loadResult.success, false);
    assert.strictEqual(loadResult.error?.kind, "corrupted_data");

    // Debe haber generado un respaldo con el prefijo seguro
    assert.strictEqual(
      mockStorage.hasKeyStartingWith(STORAGE_KEYS.CORRUPTED_BACKUP_PREFIX),
      true,
      "Debe existir una copia de seguridad del contenido corrupto"
    );

    // Debe proveer un estado limpio por defecto para no romper la app
    assert.deepStrictEqual(loadResult.data?.sessions, {});
  });

  it("filtra partidas corruptas conservando las partidas válidas existentes", () => {
    const validSession = createGameSession({
      name: "Partida Válida",
      players: ["Jugador 1", "Jugador 2"],
    });

    const corruptedData = {
      version: CURRENT_STORAGE_VERSION,
      sessions: {
        [validSession.id]: validSession,
        corrupted_1: { id: "corrupted_1", name: "" }, // Falta estructura de players
      },
      activeSessionId: validSession.id,
      lastUpdated: Date.now(),
    };

    mockStorage.setItem(STORAGE_KEYS.PRIMARY, JSON.stringify(corruptedData));

    const loadResult = loadStorageData(mockStorage);

    // Debe conservar la partida válida
    assert.strictEqual(loadResult.success, true);
    assert.ok(loadResult.data?.sessions[validSession.id]);
    assert.strictEqual(Object.keys(loadResult.data?.sessions || {}).length, 1);

    // Debe reportar el aviso de corrupción parcial
    assert.strictEqual(loadResult.error?.kind, "corrupted_data");
    assert.strictEqual(
      mockStorage.hasKeyStartingWith(STORAGE_KEYS.CORRUPTED_BACKUP_PREFIX),
      true
    );
  });

  it("detecta y comunica el error de cuota llena (QuotaExceededError)", () => {
    mockStorage.simulateQuotaError = true;

    const session = createGameSession({
      name: "Partida de Cuota",
      players: ["P1", "P2"],
    });

    const payload: CanastoStorageData = {
      version: CURRENT_STORAGE_VERSION,
      sessions: { [session.id]: session },
      activeSessionId: session.id,
      lastUpdated: Date.now(),
    };

    const saveResult = saveStorageData(payload, mockStorage);

    assert.strictEqual(saveResult.success, false);
    assert.strictEqual(saveResult.error?.kind, "quota_exceeded");
    assert.ok(saveResult.error?.message.includes("Espacio de almacenamiento"));
  });

  it("detecta y comunica errores de acceso denegado (modo incógnito estricto)", () => {
    mockStorage.simulateSecurityError = true;

    const loadResult = loadStorageData(mockStorage);
    assert.strictEqual(loadResult.success, false);
    assert.strictEqual(loadResult.error?.kind, "access_denied");
  });

  it("migra esquemas heredados de versiones anteriores sin perder sesiones", () => {
    const legacySession = {
      id: "legacy_123",
      name: "Partida Antigua v0",
      players: [
        { id: "p1", name: "Jugador Antiguo", balance: 1500, color: "purple" },
        { id: "p2", name: "Jugador 2", balance: 1500, color: "yellow" },
      ],
      transactions: [],
    };

    const legacyPayload = {
      // sin version explícita o version 0
      sessions: {
        legacy_123: legacySession,
      },
      activeSessionId: "legacy_123",
    };

    const migrated = migrateStorageData(legacyPayload);

    assert.strictEqual(migrated.version, CURRENT_STORAGE_VERSION);
    assert.strictEqual(migrated.sessions.legacy_123.name, "Partida Antigua v0");
    assert.strictEqual(migrated.sessions.legacy_123.status, "active");
    assert.strictEqual(migrated.sessions.legacy_123.settings.startingBalance, 1500);
  });

  it("garantiza aislamiento e integridad al actualizar o eliminar partidas individuales", () => {
    const s1 = createGameSession({ name: "Partida 1", players: ["A", "B"] });
    const s2 = createGameSession({ name: "Partida 2", players: ["C", "D"] });

    // Guardar ambas
    saveStorageData(
      {
        version: CURRENT_STORAGE_VERSION,
        sessions: { [s1.id]: s1, [s2.id]: s2 },
        activeSessionId: s1.id,
        lastUpdated: Date.now(),
      },
      mockStorage
    );

    // Eliminar solo s1
    const current = loadStorageData(mockStorage).data!;
    delete current.sessions[s1.id];
    current.activeSessionId = s2.id;
    saveStorageData(current, mockStorage);

    // Verificar que s2 permanece intacta
    const reloaded = loadStorageData(mockStorage).data!;
    assert.strictEqual(reloaded.sessions[s1.id], undefined);
    assert.strictEqual(reloaded.sessions[s2.id].name, "Partida 2");
    assert.strictEqual(reloaded.activeSessionId, s2.id);
  });
});
