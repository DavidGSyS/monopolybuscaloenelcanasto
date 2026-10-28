/**
 * Utilidades de detección de plataforma y modo de ejecución PWA
 * Diseñado para ejecutarse de forma segura únicamente en el cliente (evita errores de hidratación).
 */

export type PlatformType = "ios" | "android" | "desktop" | "unknown";

export interface DeviceInfo {
  platform: PlatformType;
  isStandalone: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
}

export const DEFAULT_DEVICE_INFO: DeviceInfo = {
  platform: "unknown",
  isStandalone: false,
  isSafari: false,
  isChrome: false,
  isIOS: false,
  isAndroid: false,
  isTouchDevice: false,
};

let cachedDeviceInfo: DeviceInfo = DEFAULT_DEVICE_INFO;

/**
 * Detecta la plataforma del dispositivo de forma exhaustiva
 * Soporta iPhone, iPod, iPad tradicional y iPadOS moderno (MacIntel con multitouch)
 */
export function detectPlatform(): PlatformType {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "unknown";
  }

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // Detección iOS / iPadOS:
  // 1. Cadena User-Agent tradicional (iPhone, iPod, iPad)
  // 2. iPadOS moderno que solicita vista de escritorio (se identifica como MacIntel pero tiene pantalla táctil)
  const isAppleMobile =
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);

  if (isAppleMobile) {
    return "ios";
  }

  // Detección Android:
  const isAndroid = /android/i.test(ua);
  if (isAndroid) {
    return "android";
  }

  // Otros dispositivos (Windows, macOS sin touch, Linux, etc.)
  return "desktop";
}

/**
 * Detecta si la aplicación se está ejecutando en modo independiente (PWA instalada)
 */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Modo standalone en iOS Safari tradicional
  const isIOSStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;

  // Consulta de medios estándar CSS display-mode (Android Chrome, Edge, Safari 17+)
  const isMediaStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches;

  // Referrer en algunas versiones de Android
  const isReferrerStandalone =
    typeof document !== "undefined" &&
    document.referrer.includes("android-app://");

  return Boolean(isIOSStandalone || isMediaStandalone || isReferrerStandalone);
}

/**
 * Obtiene la información del dispositivo garantizando igualdad de referencia (memoized)
 * para evitar bucles infinitos en useSyncExternalStore.
 */
export function getCachedDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return DEFAULT_DEVICE_INFO;
  }

  // Si ya tenemos cache y no es el valor por defecto de servidor, lo devolvemos
  if (cachedDeviceInfo !== DEFAULT_DEVICE_INFO) {
    return cachedDeviceInfo;
  }

  return refreshDeviceInfo();
}

/**
 * Recalcula la información del dispositivo y actualiza el caché
 */
export function refreshDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    cachedDeviceInfo = DEFAULT_DEVICE_INFO;
    return cachedDeviceInfo;
  }

  const platform = detectPlatform();
  const isStandalone = isRunningStandalone();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

  const isSafari =
    /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua);
  const isTouchDevice =
    typeof navigator !== "undefined" &&
    (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

  cachedDeviceInfo = {
    platform,
    isStandalone,
    isSafari,
    isChrome,
    isIOS: platform === "ios",
    isAndroid: platform === "android",
    isTouchDevice,
  };

  return cachedDeviceInfo;
}
