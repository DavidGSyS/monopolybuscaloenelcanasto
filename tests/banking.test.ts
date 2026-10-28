/**
 * FASE 3: Pruebas del Motor de Operaciones Bancarias
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createGameSession,
  executeBankToPlayer,
  executePlayerToBank,
  executePlayerTransfer,
  executePassGoSalary,
  executeBalanceAdjustment,
} from "../src/lib/gameEngine";
import {
  validateTransfer,
  validateBankToPlayer,
  validatePlayerToBank,
  validatePassGoSalary,
  GameValidationError,
} from "../src/lib/validation";
import { GameStore } from "../src/lib/gameStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(options?: { salaryPassGo?: number; startingBalance?: number }) {
  return createGameSession({
    name: "Test Mesa",
    players: [
      { name: "Ana", color: "purple", avatarSymbol: "🎩" },
      { name: "Bob", color: "yellow", avatarSymbol: "🚗" },
      { name: "Cam", color: "coral", avatarSymbol: "🐕" },
    ],
    startingBalance: options?.startingBalance ?? 1500,
    salaryPassGo: options?.salaryPassGo ?? 200,
  });
}

function makeMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  } as Storage;
}

// ---------------------------------------------------------------------------
// A. Banco → Jugador
// ---------------------------------------------------------------------------

describe("Banco → Jugador (executeBankToPlayer)", () => {
  it("incrementa el saldo del jugador con el importe exacto", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession, transaction } = executeBankToPlayer(session, ana.id, 300);

    const updatedAna = updatedSession.players.find((p) => p.id === ana.id)!;
    assert.equal(updatedAna.balance, 1500 + 300);
    assert.equal(transaction.type, "bank_to_player");
    assert.equal(transaction.amount, 300);
    assert.equal(transaction.fromPlayerId, "bank");
    assert.equal(transaction.toPlayerId, ana.id);
  });

  it("no modifica los saldos de otros jugadores", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession } = executeBankToPlayer(session, ana.id, 500);

    const bob = updatedSession.players.find((p) => p.name === "Bob")!;
    const cam = updatedSession.players.find((p) => p.name === "Cam")!;
    assert.equal(bob.balance, 1500);
    assert.equal(cam.balance, 1500);
  });

  it("la transacción aparece al inicio del historial", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession, transaction } = executeBankToPlayer(session, ana.id, 100);
    assert.equal(updatedSession.transactions[0].id, transaction.id);
  });

  it("rechaza importe cero", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executeBankToPlayer(session, ana.id, 0),
      (err: Error) => err instanceof GameValidationError
    );
  });

  it("rechaza importe negativo", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executeBankToPlayer(session, ana.id, -50),
      (err: Error) => err instanceof GameValidationError
    );
  });

  it("rechaza importe decimal", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executeBankToPlayer(session, ana.id, 10.5),
      (err: Error) => err instanceof GameValidationError
    );
  });

  it("rechaza operación en partida finalizada", () => {
    const session = makeSession();
    const ana = session.players[0];
    const finished = { ...session, status: "finished" as const };
    assert.throws(
      () => executeBankToPlayer(finished, ana.id, 100),
      (err: GameValidationError) => err.code === "GAME_FINISHED"
    );
  });

  it("rechaza jugador que no existe en la sesión", () => {
    const session = makeSession();
    assert.throws(
      () => executeBankToPlayer(session, "id_inexistente", 100),
      (err: GameValidationError) => err.code === "PLAYER_NOT_FOUND"
    );
  });
});

// ---------------------------------------------------------------------------
// B. Jugador → Banco
// ---------------------------------------------------------------------------

describe("Jugador → Banco (executePlayerToBank)", () => {
  it("reduce el saldo del jugador con el importe exacto", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession, transaction } = executePlayerToBank(session, ana.id, 400);

    const updatedAna = updatedSession.players.find((p) => p.id === ana.id)!;
    assert.equal(updatedAna.balance, 1500 - 400);
    assert.equal(transaction.type, "player_to_bank");
    assert.equal(transaction.amount, 400);
    assert.equal(transaction.fromPlayerId, ana.id);
    assert.equal(transaction.toPlayerId, "bank");
  });

  it("rechaza fondos insuficientes", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executePlayerToBank(session, ana.id, 2000),
      (err: GameValidationError) => err.code === "INSUFFICIENT_FUNDS"
    );
  });

  it("permite cobrar exactamente el saldo completo del jugador", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession } = executePlayerToBank(session, ana.id, 1500);
    const updatedAna = updatedSession.players.find((p) => p.id === ana.id)!;
    assert.equal(updatedAna.balance, 0);
  });

  it("rechaza operación en partida finalizada", () => {
    const session = makeSession();
    const ana = session.players[0];
    const finished = { ...session, status: "finished" as const };
    assert.throws(
      () => executePlayerToBank(finished, ana.id, 100),
      (err: GameValidationError) => err.code === "GAME_FINISHED"
    );
  });

  it("no altera saldos si el saldo es insuficiente (sin modificación parcial)", () => {
    const session = makeSession();
    const ana = session.players[0];
    let threw = false;
    try {
      executePlayerToBank(session, ana.id, 9_999_999);
    } catch {
      threw = true;
    }
    assert.ok(threw);
    // La sesión original no se mutó
    assert.equal(session.players[0].balance, 1500);
  });
});

// ---------------------------------------------------------------------------
// C. Transferencia Jugador → Jugador
// ---------------------------------------------------------------------------

describe("Transferencia entre jugadores (executePlayerTransfer)", () => {
  it("resta al emisor y suma al receptor el importe exacto", () => {
    const session = makeSession();
    const ana = session.players[0];
    const bob = session.players[1];
    const { updatedSession, transaction } = executePlayerTransfer(session, ana.id, bob.id, 300);

    const updAna = updatedSession.players.find((p) => p.id === ana.id)!;
    const updBob = updatedSession.players.find((p) => p.id === bob.id)!;
    assert.equal(updAna.balance, 1500 - 300);
    assert.equal(updBob.balance, 1500 + 300);
    assert.equal(transaction.type, "player_to_player");
    assert.equal(transaction.amount, 300);
    assert.equal(transaction.fromPlayerId, ana.id);
    assert.equal(transaction.toPlayerId, bob.id);
  });

  it("rechaza transferencia a sí mismo", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executePlayerTransfer(session, ana.id, ana.id, 100),
      (err: GameValidationError) => err.code === "SAME_PLAYER_TRANSFER"
    );
  });

  it("rechaza fondos insuficientes en el emisor", () => {
    const session = makeSession();
    const ana = session.players[0];
    const bob = session.players[1];
    assert.throws(
      () => executePlayerTransfer(session, ana.id, bob.id, 5000),
      (err: GameValidationError) => err.code === "INSUFFICIENT_FUNDS"
    );
  });

  it("rechaza importe cero o negativo", () => {
    const session = makeSession();
    const ana = session.players[0];
    const bob = session.players[1];
    assert.throws(() => executePlayerTransfer(session, ana.id, bob.id, 0));
    assert.throws(() => executePlayerTransfer(session, ana.id, bob.id, -1));
  });

  it("rechaza operación en partida finalizada", () => {
    const session = makeSession();
    const ana = session.players[0];
    const bob = session.players[1];
    const finished = { ...session, status: "finished" as const };
    assert.throws(
      () => executePlayerTransfer(finished, ana.id, bob.id, 100),
      (err: GameValidationError) => err.code === "GAME_FINISHED"
    );
  });

  it("el tercer jugador no se ve afectado", () => {
    const session = makeSession();
    const ana = session.players[0];
    const bob = session.players[1];
    const { updatedSession } = executePlayerTransfer(session, ana.id, bob.id, 200);
    const cam = updatedSession.players.find((p) => p.name === "Cam")!;
    assert.equal(cam.balance, 1500);
  });

  it("la suma total del dinero en mesa no cambia tras una transferencia", () => {
    const session = makeSession();
    const totalBefore = session.players.reduce((s, p) => s + p.balance, 0);
    const ana = session.players[0];
    const bob = session.players[1];
    const { updatedSession } = executePlayerTransfer(session, ana.id, bob.id, 700);
    const totalAfter = updatedSession.players.reduce((s, p) => s + p.balance, 0);
    assert.equal(totalBefore, totalAfter);
  });
});

// ---------------------------------------------------------------------------
// D. Sueldo por vuelta
// ---------------------------------------------------------------------------

describe("Sueldo por vuelta (executePassGoSalary)", () => {
  it("acredita el sueldo configurado al jugador seleccionado", () => {
    const session = makeSession({ salaryPassGo: 200 });
    const ana = session.players[0];
    const { updatedSession, transaction } = executePassGoSalary(session, ana.id);

    const updAna = updatedSession.players.find((p) => p.id === ana.id)!;
    assert.equal(updAna.balance, 1500 + 200);
    assert.equal(transaction.type, "pass_go_salary");
    assert.equal(transaction.amount, 200);
    assert.equal(transaction.fromPlayerId, "bank");
    assert.equal(transaction.toPlayerId, ana.id);
  });

  it("rechaza si el sueldo configurado es 0", () => {
    const session = makeSession({ salaryPassGo: 0 });
    const ana = session.players[0];
    assert.throws(
      () => executePassGoSalary(session, ana.id),
      (err: GameValidationError) => err.code === "NO_SALARY_CONFIGURED"
    );
  });

  it("rechaza operación en partida finalizada", () => {
    const session = makeSession({ salaryPassGo: 200 });
    const ana = session.players[0];
    const finished = { ...session, status: "finished" as const };
    assert.throws(
      () => executePassGoSalary(finished, ana.id),
      (err: GameValidationError) => err.code === "GAME_FINISHED"
    );
  });
});

// ---------------------------------------------------------------------------
// E. Ajuste de saldo
// ---------------------------------------------------------------------------

describe("Ajuste de saldo (executeBalanceAdjustment)", () => {
  it("suma al saldo con motivo registrado", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession, transaction } = executeBalanceAdjustment(
      session, ana.id, 300, "add", "Corrección manual por error"
    );
    const updAna = updatedSession.players.find((p) => p.id === ana.id)!;
    assert.equal(updAna.balance, 1500 + 300);
    assert.equal(transaction.type, "balance_adjustment");
    assert.ok(transaction.description.includes("Corrección manual por error"));
  });

  it("resta al saldo con motivo registrado", () => {
    const session = makeSession();
    const ana = session.players[0];
    const { updatedSession } = executeBalanceAdjustment(
      session, ana.id, 200, "subtract", "Ajuste administrativo"
    );
    const updAna = updatedSession.players.find((p) => p.id === ana.id)!;
    assert.equal(updAna.balance, 1500 - 200);
  });

  it("rechaza motivo vacío", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executeBalanceAdjustment(session, ana.id, 100, "add", "   "),
      (err: GameValidationError) => err.code === "EMPTY_REASON"
    );
  });

  it("rechaza restar más de lo que tiene el jugador", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => executeBalanceAdjustment(session, ana.id, 9999, "subtract", "Ajuste"),
      (err: GameValidationError) => err.code === "INSUFFICIENT_FUNDS"
    );
  });
});

// ---------------------------------------------------------------------------
// F. GameStore — Operaciones de alto nivel
// ---------------------------------------------------------------------------

describe("GameStore — operaciones bancarias integradas", () => {
  it("payFromBank actualiza saldo y persiste", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Partida Store",
      players: [{ name: "Lila" }, { name: "Marco" }],
      startingBalance: 1000,
      salaryPassGo: 150,
    });

    const sessionBefore = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const lila = sessionBefore.players[0];

    store.payFromBank(lila.id, 250);
    const sessionAfter = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const updLila = sessionAfter.players.find((p) => p.id === lila.id)!;
    assert.equal(updLila.balance, 1250);
  });

  it("chargeToBank actualiza saldo y persiste", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Partida Store",
      players: [{ name: "Lila" }, { name: "Marco" }],
      startingBalance: 1000,
    });

    const session = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const lila = session.players[0];

    store.chargeToBank(lila.id, 300);
    const updated = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const updLila = updated.players.find((p) => p.id === lila.id)!;
    assert.equal(updLila.balance, 700);
  });

  it("transferMoney cambia saldos de forma atómica", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Transfer Test",
      players: [{ name: "Lila" }, { name: "Marco" }],
      startingBalance: 1000,
    });

    const session = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const lila = session.players[0];
    const marco = session.players[1];

    store.transferMoney(lila.id, marco.id, 400);

    const updated = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const updLila = updated.players.find((p) => p.id === lila.id)!;
    const updMarco = updated.players.find((p) => p.id === marco.id)!;
    assert.equal(updLila.balance, 600);
    assert.equal(updMarco.balance, 1400);
  });

  it("collectSalary acredita el salario configurado", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Salary Test",
      players: [{ name: "Lila" }, { name: "Marco" }],
      startingBalance: 1000,
      salaryPassGo: 200,
    });

    const session = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const lila = session.players[0];

    store.collectSalary(lila.id);

    const updated = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const updLila = updated.players.find((p) => p.id === lila.id)!;
    assert.equal(updLila.balance, 1200);
  });

  it("rechaza operaciones en partidas finalizadas via GameStore", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Finished Test",
      players: [{ name: "A" }, { name: "B" }],
      startingBalance: 500,
    });

    const sessionId = store.getSnapshot().activeSessionId!;
    const session = store.getSnapshot().sessions[sessionId];
    const playerA = session.players[0];

    store.finishGame(sessionId);

    assert.throws(
      () => store.payFromBank(playerA.id, 100),
      (err: GameValidationError) => err.code === "GAME_FINISHED"
    );
  });

  it("no deja saldos parcialmente modificados cuando el emisor no tiene fondos", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Atomic Test",
      players: [{ name: "A" }, { name: "B" }],
      startingBalance: 500,
    });

    const session = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const playerA = session.players[0];
    const playerB = session.players[1];

    let threw = false;
    try {
      store.transferMoney(playerA.id, playerB.id, 9999);
    } catch {
      threw = true;
    }

    assert.ok(threw);
    const afterSession = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    assert.equal(afterSession.players[0].balance, 500);
    assert.equal(afterSession.players[1].balance, 500);
  });

  it("las transacciones se persisten y recuperan correctamente", () => {
    const storage = makeMockStorage();
    const store1 = new GameStore(storage);
    store1.init();

    store1.createGame({
      name: "Persistence Test",
      players: [{ name: "X" }, { name: "Y" }],
      startingBalance: 1000,
    });

    const session1 = store1.getSnapshot().sessions[store1.getSnapshot().activeSessionId!];
    const playerX = session1.players[0];
    store1.payFromBank(playerX.id, 300, "Test persistence");

    // Nueva instancia del store con el mismo storage (simula recarga)
    const store2 = new GameStore(storage);
    store2.init();

    const session2 = store2.getSnapshot().sessions[store2.getSnapshot().activeSessionId!];
    assert.ok(session2 !== undefined);

    const updX = session2.players.find((p) => p.id === playerX.id)!;
    assert.equal(updX.balance, 1300);

    const txFound = session2.transactions.some((tx) => tx.description === "Test persistence");
    assert.ok(txFound, "La transacción debe persistir entre recargas");
  });

  it("el historial tiene orden cronológico inverso (más reciente primero)", () => {
    const storage = makeMockStorage();
    const store = new GameStore(storage);
    store.init();

    store.createGame({
      name: "Orden Historial",
      players: [{ name: "A" }, { name: "B" }],
      startingBalance: 2000,
    });

    const session = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const playerA = session.players[0];
    const playerB = session.players[1];

    store.payFromBank(playerA.id, 100, "Primera");
    store.payFromBank(playerB.id, 200, "Segunda");
    store.payFromBank(playerA.id, 300, "Tercera");

    const final = store.getSnapshot().sessions[store.getSnapshot().activeSessionId!];
    const txOps = final.transactions.filter(
      (tx) => ["Primera", "Segunda", "Tercera"].includes(tx.description)
    );

    assert.equal(txOps[0].description, "Tercera", "La más reciente debe ser la primera");
    assert.equal(txOps[1].description, "Segunda");
    assert.equal(txOps[2].description, "Primera");
  });

  it("es compatible con sesiones existentes (sin transacciones de fase 3)", () => {
    // Simula datos guardados de Fase 1/2 que ya tienen transactions como array
    const storage = makeMockStorage();
    const sessionId = "game_legacy_001";
    const legacyData = JSON.stringify({
      version: 1,
      sessions: {
        [sessionId]: {
          id: sessionId,
          name: "Partida Legada",
          mode: "local",
          status: "active",
          createdAt: Date.now() - 100000,
          updatedAt: Date.now() - 50000,
          settings: {
            startingBalance: 1500,
            salaryPassGo: 200,
            currencySymbol: "₵",
            maxPlayers: 8,
          },
          players: [
            { id: "p1_legacy", name: "Legado A", color: "purple", balance: 1200, avatarSymbol: "🎩" },
            { id: "p2_legacy", name: "Legado B", color: "yellow", balance: 1800, avatarSymbol: "🚗" },
          ],
          transactions: [],
          activePlayerId: "p1_legacy",
        },
      },
      activeSessionId: sessionId,
      lastUpdated: Date.now(),
    });

    storage.setItem("canasto_bank_v1", legacyData);

    const store = new GameStore(storage);
    store.init();

    const snap = store.getSnapshot();
    assert.ok(snap.sessions[sessionId] !== undefined, "Debe cargar la partida legada");
    assert.equal(snap.sessions[sessionId].players[0].balance, 1200);

    // Operar sobre la partida legada
    store.payFromBank("p1_legacy", 100, "Operación sobre partida legada");
    const updated = store.getSnapshot().sessions[sessionId];
    assert.equal(updated.players[0].balance, 1300);
  });
});

// ---------------------------------------------------------------------------
// G. Validaciones de importe aisladas
// ---------------------------------------------------------------------------

describe("Validaciones de importe", () => {
  it("validateBankToPlayer rechaza importe fuera de límites", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(() => validateBankToPlayer(session, ana.id, 0));
    assert.throws(() => validateBankToPlayer(session, ana.id, -1));
    assert.throws(() => validateBankToPlayer(session, ana.id, 200_000_000));
  });

  it("validateTransfer rechaza cuando fromId === toId", () => {
    const session = makeSession();
    const ana = session.players[0];
    assert.throws(
      () => validateTransfer(session, ana.id, ana.id, 100),
      (err: GameValidationError) => err.code === "SAME_PLAYER_TRANSFER"
    );
  });

  it("validatePassGoSalary rechaza sueldo 0", () => {
    const session = makeSession({ salaryPassGo: 0 });
    const ana = session.players[0];
    assert.throws(
      () => validatePassGoSalary(session, ana.id),
      (err: GameValidationError) => err.code === "NO_SALARY_CONFIGURED"
    );
  });

  it("validatePlayerToBank rechaza fondos insuficientes", () => {
    const session = makeSession({ startingBalance: 100 });
    const ana = session.players[0];
    assert.throws(
      () => validatePlayerToBank(session, ana.id, 101),
      (err: GameValidationError) => err.code === "INSUFFICIENT_FUNDS"
    );
  });
});

