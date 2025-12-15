# Sistema de Gestión de Restaurante

Sistema completo de gestión de restaurante con frontend en React + TypeScript y backend en Express + TypeScript, utilizando Supabase como base de datos.

## Características

- **Gestión de Menú**: Agregar, editar y eliminar platos del menú
- **Tomar Pedidos**: Crear pedidos con múltiples items y notas especiales
- **Vista de Cocina**: Ver y gestionar el estado de los pedidos (Pendiente, Listo, Entregado)

## Estructura del Proyecto

```
├── backend/               # API Express + TypeScript
│   ├── config/           # Configuración (Supabase)
│   ├── controllers/      # Controladores de rutas
│   ├── routes/           # Definición de rutas
│   ├── database/         # Schema SQL
│   ├── index.ts          # Punto de entrada del servidor
│   └── package.json      # Dependencias del backend
├── frontend/             # Aplicación React + TypeScript
│   ├── components/       # Componentes reutilizables
│   │   ├── layout/       # Componentes de layout
│   │   └── common/       # Componentes comunes
│   ├── pages/            # Páginas principales
│   ├── services/         # Servicios API
│   ├── types/            # Tipos TypeScript
│   ├── constants/        # Constantes de la aplicación
│   ├── hooks/            # Custom hooks
│   ├── App.tsx           # Componente principal
│   ├── index.tsx         # Punto de entrada
│   └── index.css         # Estilos globales
├── scripts/              # Scripts de utilidad
│   ├── kill-port.bat     # Detener procesos en puerto (Windows)
│   └── kill-port.ps1     # Detener procesos en puerto (PowerShell)
├── index.html            # HTML principal
├── package.json          # Dependencias del frontend
└── vite.config.ts        # Configuración de Vite
```

## Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Cuenta de Supabase (para la base de datos)

## Instalación

### 1. Instalar dependencias del frontend

```bash
npm install
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
cd ..
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL en `backend/database/schema.sql` en el SQL Editor de Supabase
3. Actualiza las credenciales en `backend/config/supabase.ts` o usa variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Uso

### Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

El backend estará disponible en `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Producción

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
npm run build
npm run preview
```

## Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Express, TypeScript, Supabase
- **Base de Datos**: PostgreSQL (via Supabase)
