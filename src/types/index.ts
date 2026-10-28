/**
 * Definiciones de tipos para Canasto Bank
 */

export type GameMode = "local" | "multiplayer";

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
  | "pass_go_salary";

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
  code?: string;
  mode: GameMode;
  createdAt: number;
  updatedAt: number;
  settings: GameSettings;
  players: Player[];
  transactions: Transaction[];
  activePlayerId?: string;
}
