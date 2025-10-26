import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula el porcentaje con 2 decimales
 * @param parte - La parte del total
 * @param total - El total
 * @returns El porcentaje con 2 decimales
 */
export function calcularPorcentaje(parte: number, total: number): number {
  if (total === 0) return 0
  return Number(((parte / total) * 100).toFixed(2))
}

/**
 * Formatea un porcentaje para mostrarlo con formato español (coma decimal)
 * @param porcentaje - El porcentaje numérico
 * @returns El porcentaje formateado como string con formato español
 */
export function formatearPorcentaje(porcentaje: number): string {
  return porcentaje.toLocaleString("es-AR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}