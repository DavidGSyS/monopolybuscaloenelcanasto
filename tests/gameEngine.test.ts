import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGameSession,
  finishGameSession,
  resumeGameSession,
  updateGameSessionMeta,
  generateId,
} from "../src/lib/gameEngine";
import { GameValidationError } from "../src/lib/validation";

describe("Motor de Partidas (Game Engine) - Dominio", () => {
  it("crea una partida válida con identificadores únicos y saldos asignados", () => {
    const session = createGameSession({
      name: "Noche de Juegos Familiar",
      players: ["David", "Laura", "Carlos"],
      startingBalance: 1500,
    });

    assert.ok(session.id.startsWith("game_"), "ID de partida debe tener prefijo game_");
    assert.strictEqual(session.name, "Noche de Juegos Familiar");
    assert.strictEqual(session.status, "active");
    assert.strictEqual(session.players.length, 3);
    assert.strictEqual(session.settings.startingBalance, 1500);

    // Cada jugador debe tener su saldo independiente igual al capital inicial
    session.players.forEach((player) => {
      assert.strictEqual(player.balance, 1500);
      assert.ok(player.id.length > 5);
      assert.ok(Number.isSafeInteger(player.balance));
    });

    // Los identificadores de jugadores deben ser únicos
    const playerIds = new Set(session.players.map((p) => p.id));
    assert.strictEqual(playerIds.size, 3, "Los IDs de jugador deben ser únicos");

    // Debe registrar la transacción inicial para cada participante
    assert.strictEqual(session.transactions.length, 3);
    session.transactions.forEach((tx) => {
      assert.strictEqual(tx.type, "bank_to_player");
      assert.strictEqual(tx.amount, 1500);
      assert.strictEqual(tx.fromPlayerId, "bank");
    });
  });

  it("rechaza partidas con menos de 2 jugadores", () => {
    assert.throws(
      () => {
        createGameSession({
          name: "Partida Solitaria",
          players: ["Solitario"],
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof GameValidationError);
        assert.strictEqual(err.code, "INVALID_PLAYER_COUNT");
        return true;
      }
    );
  });

  it("rechaza partidas con más de 8 jugadores", () => {
    assert.throws(
      () => {
        createGameSession({
          name: "Partida Masiva",
          players: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"],
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof GameValidationError);
        assert.strictEqual(err.code, "INVALID_PLAYER_COUNT");
        return true;
      }
    );
  });

  it("rechaza jugadores con nombres vacíos o solo espacios", () => {
    assert.throws(
      () => {
        createGameSession({
          name: "Mesa 1",
          players: ["David", "   "],
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof GameValidationError);
        assert.strictEqual(err.code, "EMPTY_PLAYER_NAME");
        return true;
      }
    );
  });

  it("rechaza nombres de jugadores duplicados (insensible a mayúsculas)", () => {
    assert.throws(
      () => {
        createGameSession({
          name: "Mesa 2",
          players: ["Carlos", "carlos"],
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof GameValidationError);
        assert.strictEqual(err.code, "DUPLICATE_PLAYER_NAME");
        return true;
      }
    );
  });

  it("rechaza capital inicial no entero, negativo o cero", () => {
    const invalidAmounts = [0, -500, 1500.5, NaN, Infinity, -Infinity];

    invalidAmounts.forEach((badAmount) => {
      assert.throws(
        () => {
          createGameSession({
            name: "Mesa Prueba",
            players: ["Jugador 1", "Jugador 2"],
            startingBalance: badAmount,
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof GameValidationError);
          assert.strictEqual(err.code, "INVALID_STARTING_BALANCE");
          return true;
        }
      );
    });
  });

  it("rechaza capital inicial que exceda los límites seguros", () => {
    assert.throws(
      () => {
        createGameSession({
          name: "Mesa Hiperinflación",
          players: ["Jugador 1", "Jugador 2"],
          startingBalance: 100_000_001,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof GameValidationError);
        assert.strictEqual(err.code, "INVALID_STARTING_BALANCE");
        return true;
      }
    );
  });

  it("rechaza nombres de partida vacíos o inválidos", () => {
    assert.throws(
      () => {
        createGameSession({
          name: "   ",
          players: ["Jugador 1", "Jugador 2"],
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof GameValidationError);
        assert.strictEqual(err.code, "INVALID_GAME_NAME");
        return true;
      }
    );
  });

  it("finaliza una partida sin eliminar historial ni jugadores", () => {
    const original = createGameSession({
      name: "Partida de Prueba",
      players: ["Ana", "Beto"],
    });

    const finished = finishGameSession(original);

    // Debe cambiar a estado finalizado y asignar marca de tiempo
    assert.strictEqual(finished.status, "finished");
    assert.ok(typeof finished.finishedAt === "number");
    assert.ok(finished.updatedAt >= original.updatedAt);

    // Debe conservar intactos los jugadores y transacciones
    assert.strictEqual(finished.players.length, 2);
    assert.strictEqual(finished.transactions.length, 2);

    // La función es inmutable: el objeto original no debe mutar
    assert.strictEqual(original.status, "active");
  });

  it("reanuda una partida finalizada", () => {
    const session = createGameSession({
      name: "Partida Pausable",
      players: ["Ana", "Beto"],
    });

    const finished = finishGameSession(session);
    assert.strictEqual(finished.status, "finished");

    const resumed = resumeGameSession(finished);
    assert.strictEqual(resumed.status, "active");
    assert.strictEqual(resumed.finishedAt, undefined);
  });

  it("actualiza metadatos de sesión de forma inmutable", () => {
    const session = createGameSession({
      name: "Nombre Original",
      players: ["Ana", "Beto"],
    });

    const updated = updateGameSessionMeta(session, {
      name: "Nombre Actualizado",
      activePlayerId: session.players[1].id,
    });

    assert.strictEqual(updated.name, "Nombre Actualizado");
    assert.strictEqual(updated.activePlayerId, session.players[1].id);
    assert.strictEqual(session.name, "Nombre Original"); // Inmutable
  });

  it("generateId produce identificadores únicos consecutivos", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateId("test");
      assert.ok(!ids.has(id), "No debe haber colisión de identificadores");
      ids.add(id);
    }
  });
});
