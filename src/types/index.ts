/**
 * Definiciones de tipos para Canasto Bank
 */

export type GameMode = "local" | "multiplayer";

export type GameStatus = "active" | "finished" | "abandoned";

export type PlayerColor =
  | "purple"
  | "yellow"
  | "coral"
  | "mint"
  | "blue"
  | "orange";

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  balance: number;
  avatarSymbol: string;
  isHost?: boolean;
}

export type TransactionType =
  | "bank_to_player"
  | "player_to_bank"
  | "player_to_player"
  | "pass_go_salary"
  | "balance_adjustment";

export interface Transaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  amount: number;
  description: string;
  fromPlayerId?: string | "bank";
  toPlayerId?: string | "bank";
}

export interface GameSettings {
  startingBalance: number;
  salaryPassGo: number;
  currencySymbol: string;
  maxPlayers: number;
}

export interface GameSession {
  id: string;
  name: string;
  code?: string;
  mode: GameMode;
  status: GameStatus;
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
  settings: GameSettings;
  players: Player[];
  transactions: Transaction[];
  activePlayerId?: string;
}

export interface CreatePlayerInput {
  name: string;
  color?: PlayerColor;
  avatarSymbol?: string;
}

export interface CreateGameInput {
  name: string;
  mode?: GameMode;
  players: (CreatePlayerInput | string)[];
  startingBalance?: number;
  salaryPassGo?: number;
  currencySymbol?: string;
  maxPlayers?: number;
}

/**
 * Esquema versionado para persistencia en localStorage
 */
export interface CanastoStorageData {
  version: number;
  sessions: Record<string, GameSession>;
  activeSessionId: string | null;
  lastUpdated: number;
}

export type StorageErrorKind =
  | "quota_exceeded"
  | "access_denied"
  | "corrupted_data"
  | "unavailable";

export interface StorageErrorDetail {
  kind: StorageErrorKind;
  message: string;
  timestamp: number;
  originalError?: unknown;
}

export interface StorageOperationResult<T> {
  success: boolean;
  data?: T;
  error?: StorageErrorDetail;
}
