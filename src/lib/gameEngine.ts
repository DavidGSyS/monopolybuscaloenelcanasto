/**
 * Motor de Dominio para Canasto Bank
 * Contiene funciones puras independientes de la interfaz de usuario y del almacenamiento.
 */

import {
  CreateGameInput,
  GameSession,
  Player,
  PlayerColor,
  Transaction,
} from "@/types";
import {
  validateCreateGameInput,
  validateTransfer,
  validateBankToPlayer,
  validatePlayerToBank,
  validatePassGoSalary,
  validateBalanceAdjustment,
  DOMAIN_LIMITS,
} from "./validation";

export const DEFAULT_PLAYER_COLORS: PlayerColor[] = [
  "purple",
  "yellow",
  "coral",
  "mint",
  "blue",
  "orange",
];

export const DEFAULT_AVATAR_SYMBOLS: string[] = [
  "🎩",
  "🚗",
  "🐕",
  "🚢",
  "⚡",
  "🎲",
  "🏠",
  "💎",
];

const DEFAULT_STARTING_BALANCE = 1500;
const DEFAULT_SALARY_PASS_GO = 200;
const DEFAULT_CURRENCY = "₵";

/**
 * Genera identificadores únicos universales con soporte para entornos sin Web Crypto
 */
export function generateId(prefix: string = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const randomPart = Math.random().toString(36).substring(2, 11);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`;
}

/**
 * Crea una nueva sesión de juego con jugadores, saldos y configuración inicial
 */
export function createGameSession(input: CreateGameInput): GameSession {
  // 1. Ejecutar validaciones de dominio
  validateCreateGameInput(input);

  const now = Date.now();
  const startingBalance = input.startingBalance ?? DEFAULT_STARTING_BALANCE;
  const salaryPassGo = input.salaryPassGo ?? DEFAULT_SALARY_PASS_GO;
  const currencySymbol = input.currencySymbol ?? DEFAULT_CURRENCY;
  const maxPlayers = input.maxPlayers ?? DOMAIN_LIMITS.MAX_PLAYERS;

  // 2. Mapear jugadores con sus identificadores únicos y saldos independientes
  const players: Player[] = input.players.map((item, index) => {
    const rawName = typeof item === "string" ? item : item.name;
    const specifiedColor = typeof item === "object" ? item.color : undefined;
    const specifiedAvatar = typeof item === "object" ? item.avatarSymbol : undefined;

    const assignedColor: PlayerColor =
      specifiedColor ||
      DEFAULT_PLAYER_COLORS[index % DEFAULT_PLAYER_COLORS.length];

    const assignedAvatar: string =
      specifiedAvatar ||
      DEFAULT_AVATAR_SYMBOLS[index % DEFAULT_AVATAR_SYMBOLS.length];

    return {
      id: generateId(`p${index + 1}`),
      name: rawName.trim(),
      color: assignedColor,
      balance: startingBalance,
      avatarSymbol: assignedAvatar,
      isHost: index === 0,
    };
  });

  // 3. Registrar transacción de apertura contable de la partida
  const initialTransactions: Transaction[] = players.map((player) => ({
    id: generateId("tx_init"),
    timestamp: now,
    type: "bank_to_player",
    amount: startingBalance,
    description: `Asignación de capital inicial para ${player.name}`,
    fromPlayerId: "bank",
    toPlayerId: player.id,
  }));

  const session: GameSession = {
    id: generateId("game"),
    name: input.name.trim(),
    mode: input.mode || "local",
    status: "active",
    createdAt: now,
    updatedAt: now,
    settings: {
      startingBalance,
      salaryPassGo,
      currencySymbol,
      maxPlayers,
    },
    players,
    transactions: initialTransactions,
    activePlayerId: players[0]?.id,
  };

  return session;
}

/**
 * Finaliza una partida preservando su historial y los saldos finales
 */
export function finishGameSession(session: GameSession): GameSession {
  if (session.status === "finished") {
    return session;
  }

  const now = Date.now();
  return {
    ...session,
    status: "finished",
    finishedAt: now,
    updatedAt: now,
  };
}

/**
 * Reanuda una partida previamente finalizada
 */
export function resumeGameSession(session: GameSession): GameSession {
  if (session.status === "active") {
    return session;
  }

  const now = Date.now();
  return {
    ...session,
    status: "active",
    finishedAt: undefined,
    updatedAt: now,
  };
}

/**
 * Actualiza los datos generales de una sesión de forma inmutable
 */
export function updateGameSessionMeta(
  session: GameSession,
  updates: Partial<Pick<GameSession, "name" | "activePlayerId">>
): GameSession {
  const now = Date.now();
  return {
    ...session,
    ...updates,
    updatedAt: now,
  };
}

/**
 * Entrega dinero desde el banco a un jugador (el saldo del jugador aumenta)
 */
export function executeBankToPlayer(
  session: GameSession,
  playerId: string,
  amount: number,
  customDescription?: string
): { updatedSession: GameSession; transaction: Transaction } {
  const { player, validAmount } = validateBankToPlayer(session, playerId, amount);
  const now = Date.now();
  const desc =
    customDescription?.trim() ||
    `Cobro del banco para ${player.name}`;

  const tx: Transaction = {
    id: generateId("tx_b2p"),
    timestamp: now,
    type: "bank_to_player",
    amount: validAmount,
    description: desc,
    fromPlayerId: "bank",
    toPlayerId: playerId,
  };

  const updatedPlayers = session.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance + validAmount };
    }
    return p;
  });

  const updatedSession: GameSession = {
    ...session,
    players: updatedPlayers,
    transactions: [tx, ...session.transactions],
    updatedAt: now,
  };

  return { updatedSession, transaction: tx };
}

/**
 * Cobra dinero de un jugador hacia el banco (el saldo del jugador disminuye si tiene fondos suficientes)
 */
export function executePlayerToBank(
  session: GameSession,
  playerId: string,
  amount: number,
  customDescription?: string
): { updatedSession: GameSession; transaction: Transaction } {
  const { player, validAmount } = validatePlayerToBank(session, playerId, amount);
  const now = Date.now();
  const desc =
    customDescription?.trim() ||
    `Pago al banco por ${player.name}`;

  const tx: Transaction = {
    id: generateId("tx_p2b"),
    timestamp: now,
    type: "player_to_bank",
    amount: validAmount,
    description: desc,
    fromPlayerId: playerId,
    toPlayerId: "bank",
  };

  const updatedPlayers = session.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance - validAmount };
    }
    return p;
  });

  const updatedSession: GameSession = {
    ...session,
    players: updatedPlayers,
    transactions: [tx, ...session.transactions],
    updatedAt: now,
  };

  return { updatedSession, transaction: tx };
}

/**
 * Transfiere dinero atómicamente entre dos jugadores distintos
 */
export function executePlayerTransfer(
  session: GameSession,
  fromPlayerId: string,
  toPlayerId: string,
  amount: number,
  customDescription?: string
): { updatedSession: GameSession; transaction: Transaction } {
  const { fromPlayer, toPlayer, validAmount } = validateTransfer(
    session,
    fromPlayerId,
    toPlayerId,
    amount
  );
  const now = Date.now();
  const desc =
    customDescription?.trim() ||
    `Transferencia de ${fromPlayer.name} a ${toPlayer.name}`;

  const tx: Transaction = {
    id: generateId("tx_xfer"),
    timestamp: now,
    type: "player_to_player",
    amount: validAmount,
    description: desc,
    fromPlayerId,
    toPlayerId,
  };

  const updatedPlayers = session.players.map((p) => {
    if (p.id === fromPlayerId) {
      return { ...p, balance: p.balance - validAmount };
    }
    if (p.id === toPlayerId) {
      return { ...p, balance: p.balance + validAmount };
    }
    return p;
  });

  const updatedSession: GameSession = {
    ...session,
    players: updatedPlayers,
    transactions: [tx, ...session.transactions],
    updatedAt: now,
  };

  return { updatedSession, transaction: tx };
}

/**
 * Paga el sueldo configurado por pasar por la casilla de salida
 */
export function executePassGoSalary(
  session: GameSession,
  playerId: string
): { updatedSession: GameSession; transaction: Transaction } {
  const { player, salary } = validatePassGoSalary(session, playerId);
  const now = Date.now();
  const desc = `Sueldo por vuelta para ${player.name}`;

  const tx: Transaction = {
    id: generateId("tx_sal"),
    timestamp: now,
    type: "pass_go_salary",
    amount: salary,
    description: desc,
    fromPlayerId: "bank",
    toPlayerId: playerId,
  };

  const updatedPlayers = session.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, balance: p.balance + salary };
    }
    return p;
  });

  const updatedSession: GameSession = {
    ...session,
    players: updatedPlayers,
    transactions: [tx, ...session.transactions],
    updatedAt: now,
  };

  return { updatedSession, transaction: tx };
}

/**
 * Ajusta manualmente el saldo de un jugador registrando el motivo obligatorio
 */
export function executeBalanceAdjustment(
  session: GameSession,
  playerId: string,
  amount: number,
  direction: "add" | "subtract",
  reason: string
): { updatedSession: GameSession; transaction: Transaction } {
  const { validAmount } = validateBalanceAdjustment(
    session,
    playerId,
    amount,
    direction,
    reason
  );
  const now = Date.now();
  const sign = direction === "add" ? "+" : "-";
  const desc = `Ajuste (${sign}${validAmount}): ${reason.trim()}`;

  const tx: Transaction = {
    id: generateId("tx_adj"),
    timestamp: now,
    type: "balance_adjustment",
    amount: validAmount,
    description: desc,
    fromPlayerId: direction === "add" ? "bank" : playerId,
    toPlayerId: direction === "add" ? playerId : "bank",
  };

  const updatedPlayers = session.players.map((p) => {
    if (p.id === playerId) {
      const nextBalance =
        direction === "add" ? p.balance + validAmount : p.balance - validAmount;
      return { ...p, balance: nextBalance };
    }
    return p;
  });

  const updatedSession: GameSession = {
    ...session,
    players: updatedPlayers,
    transactions: [tx, ...session.transactions],
    updatedAt: now,
  };

  return { updatedSession, transaction: tx };
}
