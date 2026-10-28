/**
 * Capa de validaciones del dominio para Canasto Bank
 * Garantiza integridad de datos, tipos y límites numéricos seguros.
 */

import { CreateGameInput, GameSession, Player } from "@/types";

export const DOMAIN_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  MIN_STARTING_BALANCE: 1,
  MAX_STARTING_BALANCE: 100_000_000,
  MIN_SALARY_PASS_GO: 0,
  MAX_SALARY_PASS_GO: 10_000_000,
  MIN_TRANSACTION_AMOUNT: 1,
  MAX_TRANSACTION_AMOUNT: 100_000_000,
  MAX_GAME_NAME_LENGTH: 50,
  MAX_PLAYER_NAME_LENGTH: 30,
  MAX_TRANSACTION_DESCRIPTION_LENGTH: 100,
} as const;

export type ValidationErrorCode =
  | "INVALID_GAME_NAME"
  | "INVALID_PLAYER_COUNT"
  | "EMPTY_PLAYER_NAME"
  | "PLAYER_NAME_TOO_LONG"
  | "DUPLICATE_PLAYER_NAME"
  | "INVALID_STARTING_BALANCE"
  | "INVALID_SALARY"
  | "INVALID_SESSION_DATA"
  | "INVALID_TRANSACTION_AMOUNT"
  | "INSUFFICIENT_FUNDS"
  | "SAME_PLAYER_TRANSFER"
  | "PLAYER_NOT_FOUND"
  | "GAME_FINISHED"
  | "NO_SALARY_CONFIGURED"
  | "EMPTY_REASON";

export class GameValidationError extends Error {
  public readonly code: ValidationErrorCode;
  public readonly field?: string;

  constructor(code: ValidationErrorCode, message: string, field?: string) {
    super(message);
    this.name = "GameValidationError";
    this.code = code;
    this.field = field;
    Object.setPrototypeOf(this, GameValidationError.prototype);
  }
}

/**
 * Valida la entrada para la creación de una partida
 */
export function validateCreateGameInput(input: CreateGameInput): void {
  if (!input || typeof input !== "object") {
    throw new GameValidationError(
      "INVALID_SESSION_DATA",
      "La información de la partida es obligatoria y debe ser un objeto válido."
    );
  }

  // 1. Validar nombre de la partida
  if (
    typeof input.name !== "string" ||
    input.name.trim().length === 0 ||
    input.name.trim().length > DOMAIN_LIMITS.MAX_GAME_NAME_LENGTH
  ) {
    throw new GameValidationError(
      "INVALID_GAME_NAME",
      `El nombre de la partida debe tener entre 1 y ${DOMAIN_LIMITS.MAX_GAME_NAME_LENGTH} caracteres.`,
      "name"
    );
  }

  // 2. Validar cantidad de jugadores
  if (!Array.isArray(input.players)) {
    throw new GameValidationError(
      "INVALID_PLAYER_COUNT",
      "La lista de jugadores debe ser un arreglo.",
      "players"
    );
  }

  const playerCount = input.players.length;
  if (
    playerCount < DOMAIN_LIMITS.MIN_PLAYERS ||
    playerCount > DOMAIN_LIMITS.MAX_PLAYERS
  ) {
    throw new GameValidationError(
      "INVALID_PLAYER_COUNT",
      `Una partida requiere entre ${DOMAIN_LIMITS.MIN_PLAYERS} y ${DOMAIN_LIMITS.MAX_PLAYERS} jugadores (recibidos: ${playerCount}).`,
      "players"
    );
  }

  // 3. Validar nombres de cada jugador y unicidad
  const seenNames = new Set<string>();

  input.players.forEach((p, index) => {
    const rawName = typeof p === "string" ? p : p?.name;

    if (typeof rawName !== "string" || rawName.trim().length === 0) {
      throw new GameValidationError(
        "EMPTY_PLAYER_NAME",
        `El nombre del jugador #${index + 1} no puede estar vacío.`,
        `players[${index}].name`
      );
    }

    const cleanName = rawName.trim();
    if (cleanName.length > DOMAIN_LIMITS.MAX_PLAYER_NAME_LENGTH) {
      throw new GameValidationError(
        "PLAYER_NAME_TOO_LONG",
        `El nombre de '${cleanName}' excede el máximo de ${DOMAIN_LIMITS.MAX_PLAYER_NAME_LENGTH} caracteres.`,
        `players[${index}].name`
      );
    }

    const normalized = cleanName.toLowerCase();
    if (seenNames.has(normalized)) {
      throw new GameValidationError(
        "DUPLICATE_PLAYER_NAME",
        `El nombre de jugador '${cleanName}' está duplicado en la partida.`,
        `players[${index}].name`
      );
    }
    seenNames.add(normalized);
  });

  // 4. Validar capital inicial
  if (input.startingBalance !== undefined) {
    validateSafePositiveInteger(
      input.startingBalance,
      DOMAIN_LIMITS.MIN_STARTING_BALANCE,
      DOMAIN_LIMITS.MAX_STARTING_BALANCE,
      "INVALID_STARTING_BALANCE",
      "El capital inicial",
      "startingBalance"
    );
  }

  // 5. Validar sueldo por vuelta si se especifica
  if (input.salaryPassGo !== undefined) {
    validateSafePositiveInteger(
      input.salaryPassGo,
      DOMAIN_LIMITS.MIN_SALARY_PASS_GO,
      DOMAIN_LIMITS.MAX_SALARY_PASS_GO,
      "INVALID_SALARY",
      "El sueldo por vuelta",
      "salaryPassGo"
    );
  }
}

/**
 * Valida enteros seguros dentro de un rango inclusivo
 */
export function validateSafePositiveInteger(
  value: unknown,
  min: number,
  max: number,
  errorCode: ValidationErrorCode,
  fieldNameDesc: string,
  fieldKey: string
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new GameValidationError(
      errorCode,
      `${fieldNameDesc} debe ser un número entero seguro entre ${min} y ${max}.`,
      fieldKey
    );
  }
}

/**
 * Valida una cantidad monetaria para cualquier transacción
 */
export function validateTransactionAmount(amount: unknown): number {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    !Number.isSafeInteger(amount) ||
    amount < DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT ||
    amount > DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT
  ) {
    throw new GameValidationError(
      "INVALID_TRANSACTION_AMOUNT",
      `El importe debe ser un número entero positivo entre ${DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT} y ${DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString()}.`,
      "amount"
    );
  }
  return amount;
}

/**
 * Valida que la partida no esté finalizada
 */
export function validateGameActive(session: GameSession): void {
  if (!session || typeof session !== "object") {
    throw new GameValidationError(
      "INVALID_SESSION_DATA",
      "La sesión de juego no es válida."
    );
  }
  if (session.status === "finished") {
    throw new GameValidationError(
      "GAME_FINISHED",
      "No se pueden realizar operaciones monetarias en una partida finalizada."
    );
  }
}

/**
 * Busca y retorna un jugador dentro de la sesión o lanza error
 */
export function findPlayerInSession(session: GameSession, playerId: string): Player {
  const player = session.players.find((p) => p.id === playerId);
  if (!player) {
    throw new GameValidationError(
      "PLAYER_NOT_FOUND",
      `El jugador especificado no se encuentra en esta partida.`,
      "playerId"
    );
  }
  return player;
}

/**
 * Valida que un jugador tenga fondos suficientes para cubrir un importe
 */
export function validateSufficientFunds(player: Player, amount: number): void {
  if (player.balance < amount) {
    throw new GameValidationError(
      "INSUFFICIENT_FUNDS",
      `Fondos insuficientes: ${player.name} dispone de ${player.balance} y la operación requiere ${amount}.`,
      "balance"
    );
  }
}

/**
 * Valida una transferencia completa entre dos jugadores
 */
export function validateTransfer(
  session: GameSession,
  fromPlayerId: string,
  toPlayerId: string,
  amount: number
): { fromPlayer: Player; toPlayer: Player; validAmount: number } {
  validateGameActive(session);

  if (fromPlayerId === toPlayerId) {
    throw new GameValidationError(
      "SAME_PLAYER_TRANSFER",
      "No es posible transferir dinero al mismo jugador.",
      "toPlayerId"
    );
  }

  const validAmount = validateTransactionAmount(amount);
  const fromPlayer = findPlayerInSession(session, fromPlayerId);
  const toPlayer = findPlayerInSession(session, toPlayerId);

  validateSufficientFunds(fromPlayer, validAmount);

  return { fromPlayer, toPlayer, validAmount };
}

/**
 * Valida una entrega de dinero del banco a un jugador
 */
export function validateBankToPlayer(
  session: GameSession,
  playerId: string,
  amount: number
): { player: Player; validAmount: number } {
  validateGameActive(session);
  const validAmount = validateTransactionAmount(amount);
  const player = findPlayerInSession(session, playerId);
  return { player, validAmount };
}

/**
 * Valida un cobro de dinero de un jugador al banco
 */
export function validatePlayerToBank(
  session: GameSession,
  playerId: string,
  amount: number
): { player: Player; validAmount: number } {
  validateGameActive(session);
  const validAmount = validateTransactionAmount(amount);
  const player = findPlayerInSession(session, playerId);
  validateSufficientFunds(player, validAmount);
  return { player, validAmount };
}

/**
 * Valida el cobro de sueldo por vuelta
 */
export function validatePassGoSalary(
  session: GameSession,
  playerId: string
): { player: Player; salary: number } {
  validateGameActive(session);
  const player = findPlayerInSession(session, playerId);

  const salary = session.settings.salaryPassGo;
  if (
    typeof salary !== "number" ||
    !Number.isSafeInteger(salary) ||
    salary <= 0
  ) {
    throw new GameValidationError(
      "NO_SALARY_CONFIGURED",
      "Esta partida no tiene un sueldo por vuelta configurado mayor a 0.",
      "salaryPassGo"
    );
  }

  return { player, salary };
}

/**
 * Valida un ajuste o corrección de saldo manual
 */
export function validateBalanceAdjustment(
  session: GameSession,
  playerId: string,
  amount: number,
  direction: "add" | "subtract",
  reason: string
): { player: Player; validAmount: number } {
  validateGameActive(session);

  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    throw new GameValidationError(
      "EMPTY_REASON",
      "El motivo del ajuste de saldo es obligatorio.",
      "reason"
    );
  }

  const validAmount = validateTransactionAmount(amount);
  const player = findPlayerInSession(session, playerId);

  if (direction === "subtract") {
    validateSufficientFunds(player, validAmount);
  }

  return { player, validAmount };
}

/**
 * Valida la integridad estructural de una sesión cargada desde persistencia
 */
export function isValidGameSession(data: unknown): data is GameSession {
  if (!data || typeof data !== "object") return false;

  const s = data as Partial<GameSession>;

  return (
    typeof s.id === "string" &&
    s.id.length > 0 &&
    typeof s.name === "string" &&
    s.name.trim().length > 0 &&
    (s.mode === "local" || s.mode === "multiplayer") &&
    (s.status === "active" || s.status === "finished" || s.status === "abandoned") &&
    typeof s.createdAt === "number" &&
    typeof s.updatedAt === "number" &&
    s.settings !== undefined &&
    typeof s.settings.startingBalance === "number" &&
    Number.isSafeInteger(s.settings.startingBalance) &&
    s.settings.startingBalance >= 0 &&
    Array.isArray(s.players) &&
    s.players.length >= DOMAIN_LIMITS.MIN_PLAYERS &&
    s.players.length <= DOMAIN_LIMITS.MAX_PLAYERS &&
    s.players.every(isValidPlayerStructure) &&
    Array.isArray(s.transactions)
  );
}

function isValidPlayerStructure(p: unknown): p is Player {
  if (!p || typeof p !== "object") return false;
  const player = p as Partial<Player>;
  return (
    typeof player.id === "string" &&
    player.id.length > 0 &&
    typeof player.name === "string" &&
    player.name.trim().length > 0 &&
    typeof player.balance === "number" &&
    Number.isSafeInteger(player.balance) &&
    typeof player.color === "string"
  );
}
