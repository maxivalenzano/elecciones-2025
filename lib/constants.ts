/**
 * Constantes centralizadas para la aplicación de elecciones
 */

export const ELECCIONES = {
  // Fecha de las elecciones
  fecha: "26 de octubre de 2025",
  fechaCorta: "26 de octubre",
  año: "2025",
  diaSemana: "Domingo",
  
  // Información del lugar
  lugar: "Siete Palmas",
  
  // Títulos combinados (para usar directamente)
  tituloCompleto: "Elecciones Siete Palmas",
  fechaCompleta: "Domingo 26 de octubre de 2025",
  subtituloCompleto: "Siete Palmas - 26 de octubre de 2025",
} as const

// Re-exportar valores individuales para facilitar el uso
export const FECHA_ELECCIONES = ELECCIONES.fechaCompleta
export const FECHA_CORTA = ELECCIONES.subtituloCompleto
export const LUGAR_ELECCIONES = ELECCIONES.lugar

