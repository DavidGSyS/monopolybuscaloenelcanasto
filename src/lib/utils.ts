/**
 * Utilidades compartidas para Canasto Bank
 */

/**
 * Combina nombres de clases CSS condicionales
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formatea cantidades numéricas como moneda de juego
 */
export function formatMoney(amount: number, symbol: string = "₵"): string {
  const formatted = new Intl.NumberFormat("es-ES", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${symbol} ${formatted}`;
}
