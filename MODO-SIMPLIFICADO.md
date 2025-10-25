# 🔄 Modo Simplificado - Documentación

## 📋 ¿Qué es el Modo Simplificado?

El **Modo Simplificado** es una variante de operación del sistema electoral que permite trabajar **sin padrón electoral completo**. Solo requiere definir las mesas y permite que los fiscales carguen directamente los resultados finales, sin necesidad de marcar votantes individualmente.

---

## 🎯 Casos de Uso

El modo simplificado es ideal para:
- ✅ Elecciones pequeñas sin padrón digital
- ✅ Cargar resultados de actas físicas
- ✅ Elecciones donde no se necesita tracking individual de votantes
- ✅ Escrutinio rápido sin control de voto individual

---

## 🔄 Diferencias entre Modos

| Característica | Modo Completo | Modo Simplificado |
|---------------|---------------|-------------------|
| **Padrón Electoral** | Completo (todos los votantes) | Mínimo (1 reg. por mesa) |
| **Búsqueda por DNI** | ✅ Habilitada | ❌ Deshabilitada |
| **Marcación Individual** | ✅ Habilitada | ❌ Deshabilitada |
| **Sistema de Etiquetas** | ✅ Habilitado | ❌ Deshabilitado |
| **Carga de Resultados** | ✅ Por fiscal | ✅ Por fiscal |
| **Resultados Generales** | ✅ Habilitado | ✅ Habilitado |
| **Resultados por Mesa** | ✅ Habilitado | ✅ Habilitado |
| **Vista de Padrón** | ✅ Completa | ❌ Oculta |

---

## 🚀 Cómo Activar el Modo Simplificado

### Opción 1: Desde el Panel de Admin (Recomendado)

1. Inicia sesión como **Admin** (`sietepalmas869`)
2. Ve a **Control Electoral** (`/admin/control`)
3. En la sección "Configuración Electoral"
4. Busca **"Modo de Operación"**
5. Clic en **"Cambiar a Simplificado"**

### Opción 2: Desde SQL

```sql
-- Activar modo simplificado
UPDATE configuracion_eleccion 
SET valor = 'true' 
WHERE clave = 'modo_simplificado';

-- Desactivar (volver a modo completo)
UPDATE configuracion_eleccion 
SET valor = 'false' 
WHERE clave = 'modo_simplificado';
```

---

## 📦 Configuración Inicial para Modo Simplificado

### Paso 1: Ejecutar Scripts SQL

```bash
# 1. Ejecuta el script de configuración
psql -f scripts/09-add-modo-simplificado.sql

# 2. Ejecuta el script de ejemplo (opcional)
psql -f scripts/10-seed-modo-simplificado.sql
```

### Paso 2: Definir Mesas

Hay dos formas de definir las mesas:

#### A) Usando el padrón (1 registro por mesa)
```sql
INSERT INTO padron (dni, sexo, clase, apellido_nombre, domicilio, mesa, orden) VALUES
('00000001', 'M', '2000', 'REFERENCIA MESA 1', 'N/A', '1', 1),
('00000002', 'M', '2000', 'REFERENCIA MESA 2', 'N/A', '2', 1),
('00000003', 'M', '2000', 'REFERENCIA MESA 3', 'N/A', '3', 1)
ON CONFLICT (dni) DO NOTHING;
```

#### B) Los fiscales definen las mesas automáticamente
Al crear fiscales con `mesa_asignada`, el sistema detecta las mesas:
```sql
INSERT INTO fiscales (nombre, mesa_asignada, password) VALUES
('Fiscal Mesa 1', '1', 'fiscal-1'),
('Fiscal Mesa 2', '2', 'fiscal-2'),
('Fiscal Mesa 3', '3', 'fiscal-3')
ON CONFLICT DO NOTHING;
```

### Paso 3: Crear Candidatos

```sql
-- Igual en ambos modos
INSERT INTO candidatos (nombre, partido, color) VALUES
('CANDIDATO A', 'PARTIDO 1', '#3B82F6'),
('CANDIDATO B', 'PARTIDO 2', '#EF4444')
ON CONFLICT DO NOTHING;
```

### Paso 4: Activar Modo Simplificado

Desde el admin o SQL:
```sql
UPDATE configuracion_eleccion 
SET valor = 'true' 
WHERE clave = 'modo_simplificado';
```

---

## 👤 Experiencia del Usuario por Rol

### 🌐 Público

**Modo Completo:**
- ✅ Ve card "Buscar Mesa" en página principal
- ✅ Puede buscar su mesa por DNI
- ✅ Ve si ya votó

**Modo Simplificado:**
- ❌ Card "Buscar Mesa" **oculto** en página principal
- ❌ Ruta `/buscar` muestra mensaje: "Función no disponible"
- ℹ️ Solo ve resultados públicos (si están habilitados) y botón de login

### 👨‍⚖️ Fiscal de Mesa

**Modo Completo:**
- Ve lista de votantes de su mesa
- Puede marcar individualmente quién votó
- Puede asignar etiquetas
- Busca votantes por DNI
- Carga resultados finales
- Ve vista previa de resultados de su mesa

**Modo Simplificado:**
- ❌ No ve lista de votantes
- ❌ No puede marcar votos individuales
- ❌ No gestiona etiquetas
- ✅ **Ve vista previa de resultados de su mesa en tiempo real**
- ✅ **Solo carga resultados finales**
- ✅ Botón "Actualizar" para recargar resultados
- Mensaje informativo: "Carga de Resultados Electorales"

**Vista del Fiscal en Modo Simplificado:**
```
┌─────────────────────────────────────┐
│ Mesa 1 - Fiscal: Juan Pérez         │
├─────────────────────────────────────┤
│ 📊 Carga de Resultados Electorales  │
│ Ingrese resultados del escrutinio   │
│ según el acta electoral             │
├─────────────────────────────────────┤
│ 📊 Cargar Resultados                │
│ [Botón]                             │
├─────────────────────────────────────┤
│ Resultados de la Mesa  [Actualizar] │
│ ┌─────────────────────────────────┐ │
│ │ #1 🔵 Candidato A    150 (45%)  │ │
│ │ #2 🔴 Candidato B    100 (30%)  │ │
│ │ #3 🟢 Candidato C     83 (25%)  │ │
│ │ Total: 333 votos                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 📊 Visualizador de Resultados

**Modo Completo:**
- Tab 1: Resultados Generales ✅
- Tab 2: Resultados por Mesa ✅
- Tab 3: Padrón Electoral ✅

**Modo Simplificado:**
- Tab 1: Resultados Generales ✅
- Tab 2: Resultados por Mesa ✅
- Tab 3: ❌ Oculto

### 🔧 Administrador

**Cambios en el Dashboard:**
- Badge indica modo actual
- Estadísticas ajustadas al modo
- Puede cambiar entre modos

**Panel de Control:**
- Toggle "Modo de Operación"
- Estado visual (⚡ Simplificado / 📋 Completo)
- Descripción de cambios

---

## 🔍 Flujo de Trabajo

### Modo Completo

1. Admin carga padrón completo (CSV)
2. Admin crea candidatos y fiscales
3. **Durante elección:**
   - Público busca su mesa por DNI
   - Fiscales marcan votantes individualmente
   - Fiscales asignan etiquetas
4. **Post-cierre:**
   - Admin habilita carga de resultados
   - Fiscales cargan totales
5. **Publicación:**
   - Admin publica resultados

### Modo Simplificado

1. Admin crea candidatos y fiscales
2. Admin inserta 1 reg. por mesa en padrón (o las mesas se crean con fiscales)
3. **Admin activa modo simplificado**
4. **Durante elección:**
   - ❌ Sin búsqueda por DNI
   - ❌ Sin marcación individual
5. **Post-cierre:**
   - Admin habilita carga de resultados
   - **Fiscales cargan resultados de actas físicas**
6. **Publicación:**
   - Admin publica resultados

---

## ⚠️ Consideraciones Importantes

### Al Cambiar de Modo

- ✅ **Seguro:** Cambiar entre modos es seguro
- ✅ **Datos preservados:** Los resultados y configuraciones se mantienen
- ⚠️ **Padrón:** Si cambias a simplificado con padrón completo, se ocultan funciones pero los datos permanecen

### Recomendaciones

1. **Decide el modo ANTES de la elección**
2. **No cambies de modo durante la elección activa**
3. **En modo simplificado:**
   - Usa DNIs ficticios (00000001, 00000002, etc.)
   - Mantén 1 solo registro por mesa
   - Documenta las mesas externamente

### Backup

Siempre haz backup antes de:
- Cambiar de modo
- Cargar/vaciar padrón
- Operaciones de limpieza

---

## 📊 Estadísticas en Modo Simplificado

### Lo que se muestra:
- ✅ **Votos Emitidos** - Total de votos cargados
- ✅ **Total Mesas** - Número de mesas electorales
- ✅ Resultados por candidato
- ✅ Resultados por mesa

### Lo que NO se muestra:
- ❌ **Total Padrón** - No aplica sin padrón completo
- ❌ **Porcentaje de participación** - No aplica sin control individual
- ❌ Total de votantes individuales
- ❌ Lista del padrón

### Diseño de Estadísticas:

**Modo Simplificado (2 columnas):**
```
┌─────────────────┬─────────────────┐
│ 150             │ 9               │
│ Votos Emitidos  │ Total Mesas     │
└─────────────────┴─────────────────┘
```

**Modo Completo (3 columnas):**
```
┌──────────────┬──────────────┬──────────────┐
│ 3,245        │ 150          │ 85%          │
│ Total Padrón │ Votos        │ Participación│
└──────────────┴──────────────┴──────────────┘
```

---

## 🧩 Componentes Reutilizables

La aplicación utiliza componentes reutilizables para evitar duplicación de código y garantizar consistencia visual.

### `ResultadoMesa` - Resultados por Mesa Electoral

Muestra los resultados de una mesa específica.

**Ubicación:** `components/resultado-mesa.tsx`

**Props:**
- `mesa`: string - Número de mesa
- `candidatos`: Array de candidatos con votos y porcentajes
- `totalVotos`: number - Total de votos de la mesa
- `mostrarTitulo`: boolean - Si muestra header del card (default: true)
- `className`: string - Clases CSS adicionales
- `compact`: boolean - Modo compacto (sin barras de progreso)

**Usado en:**
1. ✅ `/fiscal/mesa` - Vista previa de resultados del fiscal
2. ✅ `/resultados` - Tab de resultados por mesa
3. ✅ Componente público `resultados-publicos.tsx`

**Ejemplo:**
```tsx
<ResultadoMesa
  mesa="1"
  candidatos={[
    { id: 1, nombre: "Candidato A", partido: "Partido 1", color: "#3b82f6", votos: 150, porcentaje: 45 },
    { id: 2, nombre: "Candidato B", partido: "Partido 2", color: "#ef4444", votos: 100, porcentaje: 30 }
  ]}
  totalVotos={250}
  mostrarTitulo={false}
  compact={true}
/>
```

---

### `ResultadosGenerales` - Resultados Totales

Muestra el resumen general de votos por candidato con ranking.

**Ubicación:** `components/resultados-generales.tsx`

**Props:**
- `candidatos`: Array de candidatos con total_votos y porcentaje
- `totalVotos`: number - Total de votos general
- `titulo`: string - Título del card (default: "Resultados Generales")
- `descripcion`: string - Descripción opcional
- `mostrarCard`: boolean - Si muestra el card wrapper (default: true)
- `className`: string - Clases CSS adicionales

**Usado en:**
1. ✅ Página principal - Resultados públicos
2. ✅ `/resultados` - Tab de resultados generales
3. ✅ `/admin/resultados` - Resumen para administrador

**Características:**
- ✅ Ranking automático (#1, #2, #3...)
- ✅ Círculos de color por candidato
- ✅ Barras de progreso
- ✅ Formato de números con separadores de miles
- ✅ Manejo de estado vacío

**Ejemplo:**
```tsx
<ResultadosGenerales
  candidatos={[
    { id: 1, nombre: "Candidato A", partido: "Partido 1", color: "#3b82f6", total_votos: 1500, porcentaje: 45, activo: true },
    { id: 2, nombre: "Candidato B", partido: "Partido 2", color: "#ef4444", total_votos: 1000, porcentaje: 30, activo: true }
  ]}
  totalVotos={3333}
  titulo="Resumen General"
  descripcion="Resultados totales por candidato"
/>
```

---

### Beneficios de la Componentización

| Beneficio | Antes | Ahora |
|-----------|-------|-------|
| **Código duplicado** | ~120 líneas duplicadas | 0 líneas |
| **Archivos afectados** | 3 archivos con código repetido | 2 componentes reutilizables |
| **Mantenimiento** | Cambios en 3 lugares | Cambios en 1 lugar |
| **Consistencia** | Manual | Automática |
| **Testing** | 3 implementaciones | 2 componentes |
| **Tiempo de desarrollo** | Alto | -60% para nuevas vistas |

---

## 🐛 Troubleshooting

### Problema: No aparecen las mesas

**Solución:**
```sql
-- Verifica que exista al menos 1 registro por mesa
SELECT DISTINCT mesa FROM padron ORDER BY mesa;

-- O verifica los fiscales
SELECT mesa_asignada FROM fiscales WHERE activo = true;
```

### Problema: El fiscal no puede cargar resultados

**Verificar:**
1. ¿Está habilitada la carga de resultados?
   ```sql
   SELECT valor FROM configuracion_eleccion 
   WHERE clave = 'carga_resultados_habilitada';
   ```
2. ¿El fiscal está activo?
   ```sql
   SELECT * FROM fiscales WHERE password = 'tu-password';
   ```

### Problema: Quiero volver al modo completo

**Solución:**
1. Desde admin: Control Electoral → "Cambiar a Completo"
2. O por SQL:
   ```sql
   UPDATE configuracion_eleccion 
   SET valor = 'false' 
   WHERE clave = 'modo_simplificado';
   ```

---

## 📝 Ejemplo Completo

### Escenario: Elección de 3 mesas sin padrón

```sql
-- 1. Configuración inicial
INSERT INTO configuracion_eleccion (clave, valor, descripcion) VALUES
('modo_simplificado', 'true', 'Modo sin padrón completo');

-- 2. Candidatos
INSERT INTO candidatos (nombre, partido, color) VALUES
('CANDIDATO A', 'PARTIDO AZUL', '#3B82F6'),
('CANDIDATO B', 'PARTIDO ROJO', '#EF4444'),
('CANDIDATO C', 'PARTIDO VERDE', '#10B981');

-- 3. Fiscales y Mesas
INSERT INTO fiscales (nombre, mesa_asignada, password) VALUES
('María López', '1', 'fiscal1'),
('Juan Pérez', '2', 'fiscal2'),
('Ana García', '3', 'fiscal3');

-- 4. Registros mínimos del padrón (1 por mesa)
INSERT INTO padron (dni, sexo, clase, apellido_nombre, domicilio, mesa, orden) VALUES
('00000001', 'M', '2000', 'REF MESA 1', 'N/A', '1', 1),
('00000002', 'M', '2000', 'REF MESA 2', 'N/A', '2', 1),
('00000003', 'M', '2000', 'REF MESA 3', 'N/A', '3', 1);

-- 5. Habilitar carga de resultados
UPDATE configuracion_eleccion 
SET valor = 'true' 
WHERE clave = 'carga_resultados_habilitada';
```

**Resultado:**
- ✅ 3 mesas disponibles
- ✅ 3 fiscales pueden cargar resultados
- ✅ Sin funciones de padrón completo
- ✅ Resultados visibles por candidato y por mesa

---

## 🎉 Ventajas del Modo Simplificado

1. **Rápida configuración** - Solo mesas y candidatos
2. **Menor complejidad** - Sin gestión de votantes individuales
3. **Ideal para actas físicas** - Transcripción directa de resultados
4. **Menos datos requeridos** - No necesita padrón electoral completo
5. **Mismo código base** - Sin necesidad de mantener dos aplicaciones

---

## 📞 Soporte

Si tienes dudas:
1. Revisa este documento
2. Consulta los scripts de ejemplo (`scripts/10-seed-modo-simplificado.sql`)
3. Verifica la configuración en `/admin/control`
4. Revisa los logs de la aplicación

---

**¡El modo simplificado te permite usar el sistema sin padrón completo, manteniendo todas las funcionalidades de carga y visualización de resultados!** 🚀

