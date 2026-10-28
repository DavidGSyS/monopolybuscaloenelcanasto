/**
 * Capa de Persistencia Local para Canasto Bank
 * Maneja almacenamiento en localStorage con esquema versionado, migraciones y salvaguardas de corrupción.
 */

import {
  CanastoStorageData,
  GameSession,
  StorageOperationResult,
} from "@/types";
import { isValidGameSession } from "./validation";

export const STORAGE_KEYS = {
  PRIMARY: "canasto_bank_v1",
  CORRUPTED_BACKUP_PREFIX: "canasto_backup_corrupted_",
} as const;

export const CURRENT_STORAGE_VERSION = 1;

/**
 * Crea una estructura de datos vacía por defecto
 */
export function createDefaultStorageData(): CanastoStorageData {
  return {
    version: CURRENT_STORAGE_VERSION,
    sessions: {},
    activeSessionId: null,
    lastUpdated: Date.now(),
  };
}

/**
 * Comprueba de forma segura si el almacenamiento local está habilitado y accesible
 */
export function isStorageAvailable(customStorage?: Storage): boolean {
  try {
    const storage =
      customStorage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!storage) return false;

    const testKey = "__canasto_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Carga y valida los datos almacenados en localStorage
 */
export function loadStorageData(
  customStorage?: Storage
): StorageOperationResult<CanastoStorageData> {
  const isBrowser = typeof window !== "undefined";
  const storage = customStorage ?? (isBrowser ? window.localStorage : undefined);

  if (!storage) {
    return {
      success: true,
      data: createDefaultStorageData(),
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEYS.PRIMARY);
  } catch (err) {
    return {
      success: false,
      data: createDefaultStorageData(),
      error: {
        kind: "access_denied",
        message:
          "El acceso a localStorage está bloqueado o restringido en este navegador.",
        timestamp: Date.now(),
        originalError: err,
      },
    };
  }

  // Primera ejecución o almacenamiento vacío
  if (!raw) {
    return {
      success: true,
      data: createDefaultStorageData(),
    };
  }

  // Deserialización protegida contra JSON malformado
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Salvaguarda: Respaldar el contenido corrupto para evitar pérdida irreversible
    backupCorruptedData(storage, raw);
    return {
      success: false,
      data: createDefaultStorageData(),
      error: {
        kind: "corrupted_data",
        message:
          "Los datos locales contenían formato JSON corrupto. Se guardó un respaldo de seguridad y se inicializó un estado limpio.",
        timestamp: Date.now(),
        originalError: err,
      },
    };
  }

  // Aplicar migraciones si provienen de versiones anteriores
  const migrated = migrateStorageData(parsed);

  // Validar integridad de las partidas
  const validatedSessions: Record<string, GameSession> = {};
  let corruptedSessionCount = 0;

  if (migrated.sessions && typeof migrated.sessions === "object") {
    for (const [id, session] of Object.entries(migrated.sessions)) {
      if (isValidGameSession(session)) {
        validatedSessions[id] = session;
      } else {
        corruptedSessionCount++;
      }
    }
  }

  // Asegurar que activeSessionId apunte a una partida existente
  let activeId = migrated.activeSessionId;
  if (activeId && !validatedSessions[activeId]) {
    const remainingIds = Object.keys(validatedSessions);
    activeId = remainingIds.length > 0 ? remainingIds[0] : null;
  }

  const cleanData: CanastoStorageData = {
    version: CURRENT_STORAGE_VERSION,
    sessions: validatedSessions,
    activeSessionId: activeId,
    lastUpdated: migrated.lastUpdated || Date.now(),
  };

  if (corruptedSessionCount > 0) {
    backupCorruptedData(storage, raw);
    return {
      success: true,
      data: cleanData,
      error: {
        kind: "corrupted_data",
        message: `Se detectaron ${corruptedSessionCount} partida(s) con estructura inválida que fueron omitidas de la carga. Se conservó una copia de respaldo.`,
        timestamp: Date.now(),
      },
    };
  }

  return {
    success: true,
    data: cleanData,
  };
}

/**
 * Guarda los datos en localStorage manejando cuotas excedidas y errores de permisos
 */
export function saveStorageData(
  data: CanastoStorageData,
  customStorage?: Storage
): StorageOperationResult<void> {
  const isBrowser = typeof window !== "undefined";
  const storage = customStorage ?? (isBrowser ? window.localStorage : undefined);

  if (!storage) {
    return {
      success: false,
      error: {
        kind: "unavailable",
        message: "No hay un almacenamiento local disponible en este entorno.",
        timestamp: Date.now(),
      },
    };
  }

  try {
    const serialized = JSON.stringify({
      ...data,
      version: CURRENT_STORAGE_VERSION,
      lastUpdated: Date.now(),
    });
    storage.setItem(STORAGE_KEYS.PRIMARY, serialized);
    return { success: true };
  } catch (err: unknown) {
    // Detección de QuotaExceededError en Safari iOS y Chromium
    const isQuota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.code === 22 ||
        err.code === 1014);

    if (isQuota) {
      return {
        success: false,
        error: {
          kind: "quota_exceeded",
          message:
            "Espacio de almacenamiento local lleno en este dispositivo. No se pudo guardar la última modificación.",
          timestamp: Date.now(),
          originalError: err,
        },
      };
    }

    return {
      success: false,
      error: {
        kind: "access_denied",
        message:
          "Error al intentar escribir en localStorage. Verifique permisos del navegador o modo privado.",
        timestamp: Date.now(),
        originalError: err,
      },
    };
  }
}

/**
 * Mecanismo de migración para compatibilidad con esquemas futuros
 */
export function migrateStorageData(raw: unknown): CanastoStorageData {
  if (!raw || typeof raw !== "object") {
    return createDefaultStorageData();
  }

  const obj = raw as Record<string, unknown>;
  const version = typeof obj.version === "number" ? obj.version : 0;

  // Esquema actual (versión 1)
  if (version === CURRENT_STORAGE_VERSION) {
    return {
      version: CURRENT_STORAGE_VERSION,
      sessions: (obj.sessions as Record<string, GameSession>) || {},
      activeSessionId: (obj.activeSessionId as string | null) || null,
      lastUpdated: (obj.lastUpdated as number) || Date.now(),
    };
  }

  // Migración desde versiones anteriores hipotéticas (v0 -> v1)
  // Permite adaptar formatos heredados sin perder datos del usuario
  const sessions: Record<string, GameSession> = {};

  if (obj.sessions && typeof obj.sessions === "object") {
    for (const [id, s] of Object.entries(obj.sessions as Record<string, unknown>)) {
      if (s && typeof s === "object") {
        const sessionRecord = s as Record<string, unknown>;
        sessions[id] = {
          id: (sessionRecord.id as string) || id,
          name: (sessionRecord.name as string) || "Partida recuperada",
          mode: (sessionRecord.mode as GameSession["mode"]) || "local",
          status: (sessionRecord.status as GameSession["status"]) || "active",
          createdAt: (sessionRecord.createdAt as number) || Date.now(),
          updatedAt: (sessionRecord.updatedAt as number) || Date.now(),
          settings: (sessionRecord.settings as GameSession["settings"]) || {
            startingBalance: 1500,
            salaryPassGo: 200,
            currencySymbol: "₵",
            maxPlayers: 8,
          },
          players: Array.isArray(sessionRecord.players)
            ? (sessionRecord.players as GameSession["players"])
            : [],
          transactions: Array.isArray(sessionRecord.transactions)
            ? (sessionRecord.transactions as GameSession["transactions"])
            : [],
          activePlayerId: sessionRecord.activePlayerId as string | undefined,
        };
      }
    }
  }

  return {
    version: CURRENT_STORAGE_VERSION,
    sessions,
    activeSessionId: (obj.activeSessionId as string | null) || null,
    lastUpdated: Date.now(),
  };
}

/**
 * Crea un respaldo de seguridad con timestamp si se detecta corrupción
 */
function backupCorruptedData(storage: Storage, rawContent: string): void {
  try {
    const backupKey = `${STORAGE_KEYS.CORRUPTED_BACKUP_PREFIX}${Date.now()}`;
    storage.setItem(backupKey, rawContent);
  } catch {
    // Si la cuota no permite el respaldo, se ignora silenciosamente para no detener la ejecución
  }
}
