/**
 * Motor de Estado Observable para Canasto Bank
 * Desacoplado de React, compatible con useSyncExternalStore y seguro contra errores de hidratación.
 */

import {
  CanastoStorageData,
  CreateGameInput,
  GameSession,
  StorageErrorDetail,
  Transaction,
} from "@/types";
import {
  createGameSession,
  finishGameSession,
  resumeGameSession,
  updateGameSessionMeta,
  executePlayerTransfer,
  executeBankToPlayer,
  executePlayerToBank,
  executePassGoSalary,
  executeBalanceAdjustment,
} from "./gameEngine";
import { GameValidationError } from "./validation";
import {
  createDefaultStorageData,
  loadStorageData,
  saveStorageData,
  isStorageAvailable,
  CURRENT_STORAGE_VERSION,
} from "./storage";

export interface GameStoreSnapshot {
  isHydrated: boolean;
  isStorageSupported: boolean;
  version: number;
  sessions: Record<string, GameSession>;
  activeSessionId: string | null;
  storageError: StorageErrorDetail | null;
  lastUpdated: number;
}

const SERVER_SNAPSHOT: GameStoreSnapshot = {
  isHydrated: false,
  isStorageSupported: true,
  version: CURRENT_STORAGE_VERSION,
  sessions: {},
  activeSessionId: null,
  storageError: null,
  lastUpdated: 0,
};

export class GameStore {
  private state: GameStoreSnapshot = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();
  private customStorage?: Storage;
  private initialized = false;

  constructor(customStorage?: Storage) {
    this.customStorage = customStorage;
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    // Inicializar carga de persistencia en la primera suscripción cliente
    if (!this.initialized && typeof window !== "undefined") {
      this.init();
    }
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): GameStoreSnapshot => {
    return this.state;
  };

  public getServerSnapshot = (): GameStoreSnapshot => {
    return SERVER_SNAPSHOT;
  };

  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const supported = isStorageAvailable(this.customStorage);
    const loadResult = loadStorageData(this.customStorage);
    const data = loadResult.data || createDefaultStorageData();

    this.setState({
      isHydrated: true,
      isStorageSupported: supported,
      version: data.version,
      sessions: data.sessions,
      activeSessionId: data.activeSessionId,
      storageError: loadResult.error || null,
      lastUpdated: data.lastUpdated,
    });
  }

  private setState(next: Partial<GameStoreSnapshot>): void {
    this.state = {
      ...this.state,
      ...next,
    };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private persist(newSessions: Record<string, GameSession>, newActiveId: string | null): void {
    const payload: CanastoStorageData = {
      version: CURRENT_STORAGE_VERSION,
      sessions: newSessions,
      activeSessionId: newActiveId,
      lastUpdated: Date.now(),
    };

    const result = saveStorageData(payload, this.customStorage);
    if (!result.success && result.error) {
      this.setState({ storageError: result.error });
    }
  }

  public createGame(input: CreateGameInput): GameSession {
    // Si aún no se había inicializado en el cliente, cargar antes de mutar
    if (!this.initialized && typeof window !== "undefined") {
      this.init();
    }

    const session = createGameSession(input);
    const nextSessions = {
      ...this.state.sessions,
      [session.id]: session,
    };

    this.setState({
      sessions: nextSessions,
      activeSessionId: session.id,
      lastUpdated: session.createdAt,
    });

    this.persist(nextSessions, session.id);
    return session;
  }

  public switchActiveGame(sessionId: string): void {
    if (!this.state.sessions[sessionId]) {
      console.warn(`Partida no encontrada: ${sessionId}`);
      return;
    }

    this.setState({
      activeSessionId: sessionId,
      lastUpdated: Date.now(),
    });

    this.persist(this.state.sessions, sessionId);
  }

  public finishGame(sessionId?: string): void {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) return;

    const current = this.state.sessions[targetId];
    const finished = finishGameSession(current);

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: finished,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: finished.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
  }

  public resumeGame(sessionId?: string): void {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) return;

    const current = this.state.sessions[targetId];
    const resumed = resumeGameSession(current);

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: resumed,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: resumed.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
  }

  public updateSessionMeta(
    sessionId: string,
    updates: Partial<Pick<GameSession, "name" | "activePlayerId">>
  ): void {
    if (!this.state.sessions[sessionId]) return;

    const updated = updateGameSessionMeta(this.state.sessions[sessionId], updates);
    const nextSessions = {
      ...this.state.sessions,
      [sessionId]: updated,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: updated.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
  }

  public deleteGame(sessionId: string): void {
    if (!this.state.sessions[sessionId]) return;

    const nextSessions = { ...this.state.sessions };
    delete nextSessions[sessionId];

    let nextActiveId = this.state.activeSessionId;
    if (this.state.activeSessionId === sessionId) {
      const remainingIds = Object.keys(nextSessions);
      nextActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
    }

    this.setState({
      sessions: nextSessions,
      activeSessionId: nextActiveId,
      lastUpdated: Date.now(),
    });

    this.persist(nextSessions, nextActiveId);
  }

  /**
   * Ejecuta una transferencia de dinero entre dos jugadores en una partida
   */
  public transferMoney(
    fromPlayerId: string,
    toPlayerId: string,
    amount: number,
    description?: string,
    sessionId?: string
  ): Transaction {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) {
      throw new GameValidationError(
        "INVALID_SESSION_DATA",
        "No hay una partida activa seleccionada para realizar la transferencia."
      );
    }

    const current = this.state.sessions[targetId];
    const { updatedSession, transaction } = executePlayerTransfer(
      current,
      fromPlayerId,
      toPlayerId,
      amount,
      description
    );

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: updatedSession,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: updatedSession.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
    return transaction;
  }

  /**
   * Entrega dinero desde el banco a un jugador
   */
  public payFromBank(
    playerId: string,
    amount: number,
    description?: string,
    sessionId?: string
  ): Transaction {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) {
      throw new GameValidationError(
        "INVALID_SESSION_DATA",
        "No hay una partida activa seleccionada para realizar la operación."
      );
    }

    const current = this.state.sessions[targetId];
    const { updatedSession, transaction } = executeBankToPlayer(
      current,
      playerId,
      amount,
      description
    );

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: updatedSession,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: updatedSession.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
    return transaction;
  }

  /**
   * Cobra dinero de un jugador hacia el banco
   */
  public chargeToBank(
    playerId: string,
    amount: number,
    description?: string,
    sessionId?: string
  ): Transaction {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) {
      throw new GameValidationError(
        "INVALID_SESSION_DATA",
        "No hay una partida activa seleccionada para realizar el cobro."
      );
    }

    const current = this.state.sessions[targetId];
    const { updatedSession, transaction } = executePlayerToBank(
      current,
      playerId,
      amount,
      description
    );

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: updatedSession,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: updatedSession.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
    return transaction;
  }

  /**
   * Cobra el sueldo configurado por vuelta
   */
  public collectSalary(playerId: string, sessionId?: string): Transaction {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) {
      throw new GameValidationError(
        "INVALID_SESSION_DATA",
        "No hay una partida activa seleccionada para cobrar el sueldo."
      );
    }

    const current = this.state.sessions[targetId];
    const { updatedSession, transaction } = executePassGoSalary(current, playerId);

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: updatedSession,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: updatedSession.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
    return transaction;
  }

  /**
   * Registra un ajuste de saldo manual justificado
   */
  public adjustBalance(
    playerId: string,
    amount: number,
    direction: "add" | "subtract",
    reason: string,
    sessionId?: string
  ): Transaction {
    const targetId = sessionId || this.state.activeSessionId;
    if (!targetId || !this.state.sessions[targetId]) {
      throw new GameValidationError(
        "INVALID_SESSION_DATA",
        "No hay una partida activa seleccionada para ajustar el saldo."
      );
    }

    const current = this.state.sessions[targetId];
    const { updatedSession, transaction } = executeBalanceAdjustment(
      current,
      playerId,
      amount,
      direction,
      reason
    );

    const nextSessions = {
      ...this.state.sessions,
      [targetId]: updatedSession,
    };

    this.setState({
      sessions: nextSessions,
      lastUpdated: updatedSession.updatedAt,
    });

    this.persist(nextSessions, this.state.activeSessionId);
    return transaction;
  }

  public clearStorageError(): void {
    this.setState({ storageError: null });
  }

  public reloadFromStorage(): void {
    this.initialized = false;
    this.init();
  }
}

// Instancia global compartida por defecto para la aplicación
export const defaultGameStore = new GameStore();
