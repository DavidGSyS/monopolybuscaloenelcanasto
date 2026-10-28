import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GameStore } from "../src/lib/gameStore";

class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  public simulateQuotaError = false;

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.items.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.simulateQuotaError) {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    }
    this.items.set(key, value);
  }
}

describe("GameStore (Motor de Estado Reactivo)", () => {
  let mockStorage: MemoryStorage;
  let store: GameStore;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
    store = new GameStore(mockStorage);
  });

  it("inicializa el snapshot y notifica a los suscriptores", () => {
    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications++;
    });

    store.init();
    const snapshot = store.getSnapshot();

    assert.strictEqual(snapshot.isHydrated, true);
    assert.deepStrictEqual(snapshot.sessions, {});
    assert.strictEqual(snapshot.activeSessionId, null);
    assert.ok(notifications > 0);

    unsubscribe();
  });

  it("crea partidas, las activa y persiste automáticamente", () => {
    store.init();

    const game = store.createGame({
      name: "Partida Amigos",
      players: ["Mateo", "Valentina"],
      startingBalance: 2000,
    });

    const snapshot = store.getSnapshot();
    assert.strictEqual(snapshot.activeSessionId, game.id);
    assert.strictEqual(snapshot.sessions[game.id].name, "Partida Amigos");
    assert.strictEqual(snapshot.sessions[game.id].players[0].balance, 2000);

    // Comprobar que se guardó en el almacenamiento subyacente
    const raw = mockStorage.getItem("canasto_bank_v1");
    assert.ok(raw);
    assert.ok(raw.includes("Partida Amigos"));
  });

  it("permite alternar entre múltiples partidas guardadas", () => {
    store.init();

    const g1 = store.createGame({ name: "Partida 1", players: ["A", "B"] });
    const g2 = store.createGame({ name: "Partida 2", players: ["C", "D"] });

    assert.strictEqual(store.getSnapshot().activeSessionId, g2.id);

    store.switchActiveGame(g1.id);
    assert.strictEqual(store.getSnapshot().activeSessionId, g1.id);

    store.switchActiveGame(g2.id);
    assert.strictEqual(store.getSnapshot().activeSessionId, g2.id);
  });

  it("finaliza una partida y permite reanudarla", () => {
    store.init();

    const g = store.createGame({ name: "Partida Torneo", players: ["P1", "P2"] });

    store.finishGame(g.id);
    assert.strictEqual(store.getSnapshot().sessions[g.id].status, "finished");
    assert.ok(typeof store.getSnapshot().sessions[g.id].finishedAt === "number");

    store.resumeGame(g.id);
    assert.strictEqual(store.getSnapshot().sessions[g.id].status, "active");
    assert.strictEqual(store.getSnapshot().sessions[g.id].finishedAt, undefined);
  });

  it("elimina una partida explícitamente y conmuta la activa a otra existente", () => {
    store.init();

    const g1 = store.createGame({ name: "Partida 1", players: ["A", "B"] });
    const g2 = store.createGame({ name: "Partida 2", players: ["C", "D"] });

    assert.strictEqual(store.getSnapshot().activeSessionId, g2.id);

    // Eliminar la partida actualmente activa (g2)
    store.deleteGame(g2.id);

    const snapshot = store.getSnapshot();
    assert.strictEqual(snapshot.sessions[g2.id], undefined);
    assert.strictEqual(snapshot.activeSessionId, g1.id); // Conmutó a g1
    assert.strictEqual(Object.keys(snapshot.sessions).length, 1);
  });

  it("captura errores de almacenamiento y permite limpiarlos", () => {
    store.init();
    mockStorage.simulateQuotaError = true;

    store.createGame({ name: "Partida con Error", players: ["A", "B"] });

    const snapshot = store.getSnapshot();
    assert.strictEqual(snapshot.storageError?.kind, "quota_exceeded");

    store.clearStorageError();
    assert.strictEqual(store.getSnapshot().storageError, null);
  });
});

