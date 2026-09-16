# Sistema Integral de Gestión Electoral - Siete Palmas (Elecciones 2025)

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel Deployed](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://elecciones-siete-palmas.vercel.app)

> **🌐 Live Demo:** [https://elecciones-siete-palmas.vercel.app](https://elecciones-siete-palmas.vercel.app)

---

## 📌 Project Overview

**Sistema Integral de Gestión Electoral - Siete Palmas** es una plataforma de grado de producción diseñada específicamente para la administración, fiscalización y escrutinio en tiempo real de las elecciones municipales en la localidad de Siete Palmas.

El sistema centraliza el padrón de electores, la asignación y coordinación de fiscales partidarios por mesa, el registro del escrutinio provisorio con auditoría estricta de sufragios, y la difusión transparente de resultados electorales a través de portales públicos y administrativos diferenciados.

---

## 🚀 Key Modules

- **🗳️ Padrón Electoral Inteligente**: Búsqueda instantánea y responsiva por DNI o apellido/nombre, visualización de mesa y orden de votación, estado de sufragio y etiquetado avanzado de electores (categorización y seguimiento en campo).
- **👥 Gestión y Asignación de Fiscales**: Administración de fiscales generales y de mesa con asignación unívoca, control de asistencia, verificación de identidad y credenciales de acceso.
- **📊 Escrutinio Provisorio en Tiempo Real**: Carga distribuida de actas de escrutinio por mesa, cómputo automatizado de votos afirmativos por lista, votos en blanco, nulos e impugnados, con validaciones matemáticas cruzadas y trazabilidad de cambios.
- **📈 Visualizador Público y Analítica en Vivo**: Tableros dinámicos impulsados por [Recharts](https://recharts.org/) con actualización en tiempo real, porcentajes de participación por mesa/escuela, distribución porcentual de votos y comparativas visuales accesibles para la ciudadanía.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components y optimización de renderizado)
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/) (tipado estricto end-to-end)
- **Estilos & UI**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/)
- **Visualización de Datos**: [Recharts](https://recharts.org/)
- **Formularios y Validación**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Iconografía**: [Lucide React](https://lucide.dev/)

### Backend & Base de Datos
- **Backend-as-a-Service**: [Supabase](https://supabase.com/)
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/)
- **Lógica de Negocio & Seguridad**:
  - Funciones almacenadas en **PL/pgSQL** para control de mesas, cálculo automatizado de totales de votos y cierres.
  - Políticas de seguridad a nivel de fila (**Row Level Security - RLS**) para garantizar el aislamiento de permisos entre administradores, fiscales y acceso público.
  - Suscripciones **Realtime** de Supabase para transmisión instantánea del escrutinio provisorio.

---

## 🗄️ SQL Migrations & Database Architecture

El esquema de base de datos se despliega mediante 10 scripts de migración ordenados y modulares ubicados en el directorio [`scripts/`](./scripts):

| Script | Propósito y Descripción |
|---|---|
| `01-create-tables.sql` | Definición del esquema base: tablas de mesas, escuelas, electores (padrón), listas electorales, fiscales y resultados. |
| `02-seed-data.sql` | Carga de datos iniciales de referencia (escuelas, mesas de votación y listas participantes). |
| `03-add-resultados-control.sql` | Estructuras de auditoría y control de estado para el cierre y validación de actas de escrutinio por mesa. |
| `04-create-mesas-function.sql` | Funciones PL/pgSQL para la administración y consulta optimizada de mesas de votación. |
| `05-create-etiquetas-system.sql` | Sistema relacional de etiquetas personalizadas y colores para categorización de electores en el padrón. |
| `06-add-resultados-publicos.sql` | Vistas y políticas RLS específicas para habilitar la lectura segura de resultados provisorios al público general. |
| `07-modify-mesa-type.sql` | Ajustes de tipos y compatibilidad en la estructura de mesas electorales. |
| `08-create-total-votos-function.sql` | Función PL/pgSQL para el cálculo matemático consolidado de totales de votos (positivos, en blanco, nulos, recurridos e impugnados). |
| `09-add-modo-simplificado.sql` | Soporte para esquema de carga ágil y consolidada durante contingencias en mesa ("Modo Simplificado"). |
| `10-seed-modo-simplificado.sql` | Datos de prueba y configuración base para la operación del modo simplificado. |

---

## 💻 Local Setup & Configuration

### Requisitos Previos
- **Node.js**: v18.17 o superior
- **pnpm**: Recomendado (`npm install -g pnpm`)
- **Cuenta y Proyecto en Supabase**: [https://supabase.com](https://supabase.com)

### 1. Clonar el repositorio
```bash
git clone https://github.com/maxivalenzano/elecciones-2025.git
cd elecciones-2025
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con las credenciales de tu proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-public-key
```

> Obtén estas credenciales en el panel de Supabase: **Project Settings** → **API**.

### 4. Inicializar la Base de Datos
Ejecuta secuencialmente en el **SQL Editor** de Supabase los scripts ubicados en la carpeta [`scripts/`](./scripts) del `01` al `10`.

### 5. Iniciar el servidor de desarrollo
```bash
pnpm dev
```
La aplicación estará disponible localmente en `http://localhost:3000`.

---

## 🧭 Portales y Accesos

- **🌐 Consulta de Padrón**: `/buscar` — Búsqueda de mesa, número de orden y escuela para votantes.
- **📊 Portal Público de Resultados**: `/resultados` — Visualización en vivo del recuento de votos con gráficos y estadísticas.
- **🗳️ Portal de Fiscales**: `/fiscal` — Carga y verificación de actas de escrutinio para fiscales acreditados.
- **⚙️ Panel de Administración**: `/admin` (`/login`) — Monitoreo integral, asignación de fiscales, auditoría y control de escrutinio.

---

## 📦 Scripts Disponibles

```bash
pnpm dev      # Servidor de desarrollo con Fast Refresh
pnpm build    # Compilación optimizada para producción
pnpm start    # Inicio del servidor de producción
pnpm lint     # Análisis estático de código con ESLint
```

---

## 📄 Licencia

Este proyecto está destinado para la gestión electoral municipal de Siete Palmas. Todos los derechos reservados.
