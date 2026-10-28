/**
 * Canasto Bank - Configuración y constantes compartidas
 */

export const APP_CONFIG = {
  name: "Canasto Bank",
  slogan: "Tu mesa, tus reglas",
  description:
    "Banco digital para juegos de mesa. Reemplaza el dinero físico y al banquero tradicional con control ágil, transparente e intuitivo.",
  version: "0.1.0",
  themeColor: "#6D28D9", // Morado principal
  backgroundColor: "#F8FAFC",
} as const;

export const DEFAULT_GAME_PRESETS = [
  {
    id: "classic-board",
    name: "Clásico de Finanzas",
    startingCash: 1500,
    salaryPassGo: 200,
    currencySymbol: "₵",
  },
  {
    id: "custom",
    name: "Partida Personalizada",
    startingCash: 2000,
    salaryPassGo: 200,
    currencySymbol: "$",
  },
] as const;

export const GAME_MODES = [
  {
    id: "local",
    title: "Modo Local",
    subtitle: "1 Dispositivo • Sin Internet",
    description:
      "Un solo jugador o anfitrión administra la banca y los saldos de todos los participantes desde este mismo teléfono o tableta.",
    badge: "100% Offline",
    status: "ready_preview",
  },
  {
    id: "multiplayer",
    title: "Modo Multijugador",
    subtitle: "Múltiples teléfonos • En Vivo",
    description:
      "Cada participante se une desde su propio teléfono mediante un código de sala, con transferencias y saldos sincronizados en tiempo real.",
    badge: "Próximamente",
    status: "planned",
  },
] as const;
