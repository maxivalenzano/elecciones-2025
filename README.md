# Sistema de Gestión Electoral - Siete Palmas

Sistema de gestión electoral completo construido con Next.js y Supabase para administrar elecciones, fiscales, padrón electoral y resultados en tiempo real.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/maxi-valenzanos-projects/v0-siete-palmas-elecciones)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/L9awqsgD9Q3)

## 📋 Características

- ✅ Búsqueda de padrón electoral por DNI
- ✅ Panel de administración completo
- ✅ Sistema de fiscales con asignación de mesas
- ✅ Carga de resultados en tiempo real
- ✅ Visualización pública de resultados
- ✅ Sistema de etiquetas para votantes
- ✅ Estadísticas y gráficos en vivo
- ✅ Control de asistencia y auditoría

## 🚀 Configuración e Instalación

### Requisitos Previos

- Node.js 18+ instalado
- pnpm (gestor de paquetes)
- Cuenta en Supabase (gratuita)

### 1. Instalar pnpm (si no lo tienes)

```bash
npm install -g pnpm
```

### 2. Clonar e Instalar Dependencias

```bash
# Clonar el repositorio (si no lo has hecho)
git clone <url-del-repositorio>
cd elecciones-2025-main

# Instalar dependencias
pnpm install
```

### 3. Configurar Supabase

#### 3.1 Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que el proyecto se inicialice

#### 3.2 Obtener las credenciales

En tu proyecto de Supabase:
1. Ve a **Settings** → **API**
2. Copia la **URL** del proyecto
3. Copia la **anon/public key**

#### 3.3 Ejecutar los scripts SQL

En Supabase, ve a **SQL Editor** y ejecuta los siguientes scripts **en orden**:

1. `scripts/01-create-tables.sql` - Crea las tablas principales
2. `scripts/02-seed-data.sql` - Datos de ejemplo (opcional)
3. `scripts/03-add-resultados-control.sql` - Tabla de control de resultados
4. `scripts/04-create-mesas-function.sql` - Funciones para mesas
5. `scripts/05-create-etiquetas-system.sql` - Sistema de etiquetas
6. `scripts/06-add-resultados-publicos.sql` - Vista pública de resultados
7. `scripts/07-modify-mesa-type.sql` - Modificación de tipo de mesa
8. `scripts/08-create-total-votos-function.sql` - Función para totales

> **Nota**: Copia el contenido de cada archivo y ejecútalo en el SQL Editor de Supabase uno por uno.

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

Reemplaza `tu_url_de_supabase` y `tu_clave_anon_de_supabase` con los valores que copiaste en el paso 3.2.

### 5. Iniciar el Proyecto

```bash
# Modo desarrollo
pnpm dev

# El servidor estará disponible en http://localhost:3000
```

Para producción:

```bash
# Compilar
pnpm build

# Iniciar servidor de producción
pnpm start
```

## 🗂️ Estructura del Proyecto

```
elecciones-2025-main/
├── app/                      # Páginas de Next.js (App Router)
│   ├── admin/               # Panel de administración
│   ├── fiscal/              # Panel de fiscales
│   ├── buscar/              # Búsqueda de padrón
│   ├── resultados/          # Resultados públicos
│   └── login/               # Página de inicio de sesión
├── components/              # Componentes reutilizables
│   ├── ui/                  # Componentes UI (shadcn/ui)
│   └── charts/              # Gráficos y visualizaciones
├── lib/                     # Utilidades y configuración
│   ├── supabase.ts          # Cliente de Supabase
│   └── utils.ts             # Funciones auxiliares
├── scripts/                 # Scripts SQL para la base de datos
└── public/                  # Archivos estáticos
```

## 🔑 Acceso al Sistema

### Usuario Administrador
- Accede a `/login` para iniciar sesión como administrador

### Fiscales
- Cada fiscal tiene credenciales asignadas
- Panel de fiscal disponible en `/fiscal`

### Público General
- Búsqueda de mesa: `/buscar`
- Resultados públicos: `/resultados`

## 📚 Tecnologías Utilizadas

- **Framework**: Next.js 14 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **Validación**: Zod + React Hook Form
- **Iconos**: Lucide React

## 🛠️ Scripts Disponibles

```bash
pnpm dev      # Inicia el servidor de desarrollo
pnpm build    # Compila el proyecto para producción
pnpm start    # Inicia el servidor de producción
pnpm lint     # Ejecuta el linter
```

## 📄 Licencia

Este proyecto es privado y está destinado para uso interno.

## 🔗 Deployment

Your project is live at:
**[https://vercel.com/maxi-valenzanos-projects/v0-siete-palmas-elecciones](https://vercel.com/maxi-valenzanos-projects/v0-siete-palmas-elecciones)**

---

*Automatically synced with your [v0.dev](https://v0.dev) deployments*
