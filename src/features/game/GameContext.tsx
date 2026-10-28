"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  CreateGameInput,
  GameSession,
  StorageErrorDetail,
  Transaction,
} from "@/types";
import { GameStore, defaultGameStore } from "@/lib/gameStore";

export interface GameContextValue {
  isHydrated: boolean;
  isStorageSupported: boolean;
  sessions: Record<string, GameSession>;
  activeSessionId: string | null;
  activeSession: GameSession | null;
  savedGamesList: GameSession[];
  storageError: StorageErrorDetail | null;
  createGame: (input: CreateGameInput) => GameSession;
  switchActiveGame: (sessionId: string) => void;
  finishActiveGame: (sessionId?: string) => void;
  resumeActiveGame: (sessionId?: string) => void;
  deleteGame: (sessionId: string) => void;
  clearStorageError: () => void;
  reloadFromStorage: () => void;
  // Fase 3: Operaciones Bancarias
  payFromBank: (playerId: string, amount: number, description?: string) => Transaction;
  chargeToBank: (playerId: string, amount: number, description?: string) => Transaction;
  transferMoney: (fromPlayerId: string, toPlayerId: string, amount: number, description?: string) => Transaction;
  collectSalary: (playerId: string) => Transaction;
  adjustBalance: (playerId: string, amount: number, direction: "add" | "subtract", reason: string) => Transaction;
}

const GameContext = createContext<GameContextValue | null>(null);

export interface GameProviderProps {
  children: React.ReactNode;
  customStorage?: Storage;
}

export function GameProvider({ children, customStorage }: GameProviderProps) {
  const store = useMemo(() => {
    return customStorage ? new GameStore(customStorage) : defaultGameStore;
  }, [customStorage]);

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const activeSession = useMemo(() => {
    if (!snapshot.activeSessionId) return null;
    return snapshot.sessions[snapshot.activeSessionId] || null;
  }, [snapshot.activeSessionId, snapshot.sessions]);

  const savedGamesList = useMemo(() => {
    return Object.values(snapshot.sessions).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }, [snapshot.sessions]);

  const value = useMemo<GameContextValue>(
    () => ({
      isHydrated: snapshot.isHydrated,
      isStorageSupported: snapshot.isStorageSupported,
      sessions: snapshot.sessions,
      activeSessionId: snapshot.activeSessionId,
      activeSession,
      savedGamesList,
      storageError: snapshot.storageError,
      createGame: (input) => store.createGame(input),
      switchActiveGame: (id) => store.switchActiveGame(id),
      finishActiveGame: (id) => store.finishGame(id),
      resumeActiveGame: (id) => store.resumeGame(id),
      deleteGame: (id) => store.deleteGame(id),
      clearStorageError: () => store.clearStorageError(),
      reloadFromStorage: () => store.reloadFromStorage(),
      // Fase 3
      payFromBank: (playerId, amount, description) =>
        store.payFromBank(playerId, amount, description),
      chargeToBank: (playerId, amount, description) =>
        store.chargeToBank(playerId, amount, description),
      transferMoney: (fromPlayerId, toPlayerId, amount, description) =>
        store.transferMoney(fromPlayerId, toPlayerId, amount, description),
      collectSalary: (playerId) => store.collectSalary(playerId),
      adjustBalance: (playerId, amount, direction, reason) =>
        store.adjustBalance(playerId, amount, direction, reason),
    }),
    [snapshot, activeSession, savedGamesList, store]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error(
      "useGame debe ser utilizado dentro de un componente envuelto por <GameProvider>."
    );
  }
  return context;
}
