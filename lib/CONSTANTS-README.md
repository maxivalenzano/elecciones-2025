# Constantes Centralizadas - Elecciones

Este archivo documenta las constantes centralizadas del sistema de elecciones, ubicadas en `lib/constants.ts`.

## Ubicación

**Archivo:** `lib/constants.ts`

## Propósito

Centralizar todas las constantes relacionadas con las elecciones (fechas, lugares, títulos) para facilitar su mantenimiento y actualización.

## Uso

### Importar las constantes

```typescript
import { ELECCIONES } from "@/lib/constants"

// O importar valores individuales
import { FECHA_ELECCIONES, LUGAR_ELECCIONES } from "@/lib/constants"
```

### Constantes disponibles

```typescript
ELECCIONES.fecha              // "26 de octubre de 2025"
ELECCIONES.fechaCorta         // "26 de octubre"
ELECCIONES.año                // "2025"
ELECCIONES.diaSemana          // "Domingo"
ELECCIONES.lugar              // "Siete Palmas"
ELECCIONES.tituloCompleto     // "Elecciones Siete Palmas"
ELECCIONES.fechaCompleta      // "Domingo 26 de octubre de 2025"
ELECCIONES.subtituloCompleto  // "Siete Palmas - 26 de octubre de 2025"
```

### Ejemplos de uso

#### Página principal (app/page.tsx)
```tsx
<h1>{ELECCIONES.tituloCompleto}</h1>
<p>{ELECCIONES.fechaCompleta}</p>
```

#### Página de resultados (app/resultados/page.tsx)
```tsx
<p>{ELECCIONES.subtituloCompleto}</p>
```

#### Dashboard de admin (app/admin/dashboard/page.tsx)
```tsx
<p>{ELECCIONES.tituloCompleto} {ELECCIONES.año}</p>
```

## Archivos que usan estas constantes

- ✅ `app/page.tsx` - Página principal
- ✅ `app/resultados/page.tsx` - Página de resultados públicos
- ✅ `app/admin/dashboard/page.tsx` - Dashboard administrativo
- ✅ `app/layout.tsx` - Metadata de la aplicación (valores hardcoded)

## Cómo actualizar la fecha de las elecciones

1. Abre el archivo `lib/constants.ts`
2. Modifica los valores del objeto `ELECCIONES`
3. Guarda los cambios
4. Todos los archivos que usan estas constantes se actualizarán automáticamente

### Ejemplo de actualización

```typescript
export const ELECCIONES = {
  fecha: "15 de noviembre de 2025",      // ← Cambiar aquí
  fechaCorta: "15 de noviembre",          // ← Cambiar aquí
  año: "2025",
  diaSemana: "Sábado",                    // ← Cambiar si es necesario
  lugar: "Siete Palmas",
  tituloCompleto: "Elecciones Siete Palmas",
  fechaCompleta: "Sábado 15 de noviembre de 2025",  // ← Cambiar aquí
  subtituloCompleto: "Siete Palmas - 15 de noviembre de 2025",  // ← Cambiar aquí
} as const
```

## Nota importante sobre app/layout.tsx

El archivo `app/layout.tsx` contiene metadata estática de Next.js que no puede usar imports dinámicos. 
Si cambias la fecha en `constants.ts`, también debes actualizar manualmente:

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "Elecciones Siete Palmas 2025",
  description: "Sistema de gestión electoral para Siete Palmas - 26 de octubre de 2025",
  // ↑ Actualizar manualmente estos valores
}
```

## Beneficios de la centralización

- ✅ **Un solo lugar** para actualizar fechas y títulos
- ✅ **Consistencia** garantizada en toda la aplicación
- ✅ **Mantenimiento simplificado** - no buscar en múltiples archivos
- ✅ **Menos errores** - imposible olvidar actualizar algún lugar
- ✅ **TypeScript** - autocompletado y verificación de tipos

