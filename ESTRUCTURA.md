# Estructura del Proyecto

## Organización General

```
Sprints/
├── backend/                    # API Backend (Express + TypeScript)
│   ├── config/                # Configuración
│   │   └── supabase.ts        # Cliente de Supabase
│   ├── controllers/           # Controladores de lógica de negocio
│   │   ├── menuController.ts  # Controlador del menú
│   │   └── orderController.ts # Controlador de pedidos
│   ├── routes/                # Definición de rutas API
│   │   ├── menuRoutes.ts      # Rutas del menú
│   │   └── orderRoutes.ts     # Rutas de pedidos
│   ├── database/              # Scripts de base de datos
│   │   └── schema.sql         # Schema de la base de datos
│   ├── index.ts               # Punto de entrada del servidor
│   ├── package.json           # Dependencias del backend
│   ├── tsconfig.json          # Configuración TypeScript
│   └── nodemon.json           # Configuración de nodemon
│
├── frontend/                   # Aplicación Frontend (React + TypeScript)
│   ├── components/            # Componentes reutilizables
│   │   ├── layout/           # Componentes de layout
│   │   │   └── Layout.tsx     # Layout principal con navegación
│   │   └── common/            # Componentes comunes (reservado)
│   ├── pages/                 # Páginas de la aplicación
│   │   ├── MenuPage.tsx       # Gestión del menú
│   │   ├── OrderPage.tsx      # Tomar pedidos
│   │   └── KitchenPage.tsx    # Vista de cocina
│   ├── services/              # Servicios API
│   │   ├── api.ts             # Cliente HTTP configurado (axios)
│   │   ├── menuService.ts      # Servicio de menú
│   │   ├── orderService.ts    # Servicio de pedidos
│   │   └── index.ts           # Exportaciones centralizadas
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts           # Definiciones de tipos
│   ├── constants/             # Constantes de la aplicación
│   │   ├── routes.ts          # Rutas de la aplicación
│   │   └── api.ts             # Configuración de API
│   ├── hooks/                 # Custom hooks (reservado)
│   ├── App.tsx                # Componente raíz de la aplicación
│   ├── index.tsx              # Punto de entrada
│   └── index.css              # Estilos globales (Tailwind)
│
├── scripts/                    # Scripts de utilidad
│   ├── kill-port.bat          # Detener procesos en puerto (Windows CMD)
│   └── kill-port.ps1          # Detener procesos en puerto (PowerShell)
│
├── index.html                  # HTML principal
├── package.json                # Dependencias del frontend
├── vite.config.ts              # Configuración de Vite
├── tailwind.config.js          # Configuración de Tailwind CSS
├── postcss.config.js           # Configuración de PostCSS
├── tsconfig.json               # Configuración TypeScript (frontend)
├── tsconfig.node.json          # Configuración TypeScript (Node)
├── .eslintrc.cjs              # Configuración de ESLint
├── .gitignore                 # Archivos ignorados por Git
└── README.md                  # Documentación del proyecto
```

## Separación Frontend/Backend

- **Frontend**: Todo el código React está en `src/`
- **Backend**: Todo el código del servidor está en `backend/`
- **Scripts**: Utilidades en `scripts/`

## Flujo de Datos

```
Frontend (src/)
    ↓ HTTP Requests
Backend (backend/)
    ↓ Supabase Client
Supabase (Base de datos PostgreSQL)
```

## Comandos Importantes

### Frontend
```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo
npm run build        # Producción
npm run preview      # Preview de producción
```

### Backend
```bash
cd backend
npm install          # Instalar dependencias
npm run dev          # Desarrollo (con nodemon)
npm run build        # Compilar TypeScript
npm run start:prod   # Producción
```

