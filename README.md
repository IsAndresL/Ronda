# RONDA - CRUD de Login (React + Node/Express + Supabase)

Implementación completa del CRUD de login solicitado para RONDA, con arquitectura MVC en backend y frontend React responsive.

## Stack usado

### Backend
- Node.js + Express
- Supabase (`@supabase/supabase-js`)
- `bcryptjs` (hash de contraseña para mesero)
- `dotenv`
- `cors`

### Frontend
- React + Vite
- React Router DOM
- Axios
- Supabase JS (cliente disponible para futuras integraciones)

## Estructura del proyecto

```txt
/ronda
  /backend
    /config
      supabase.js
    /modelo
      Usuario.js
    /controlador
      ControladorUsuario.js
    /rutas
      usuarioRutas.js
    /middleware
      authMiddleware.js
    .env
    package.json
    server.js

  /frontend
    .env
    package.json
    vite.config.js
    index.html
    /src
      /config
        supabaseCliente.js
      /vista
        Login.jsx
        Bienvenida.jsx
        ActualizarCredenciales.jsx
      /servicios
        authServicio.js
      /estilos
        app.css
      App.jsx
      main.jsx

  /database
    ronda_schema.sql

  README.md
```

## 1) Configuración de Supabase

1. Crea un proyecto en Supabase.
2. En `Settings > API` copia:
   - `Project URL` -> `SUPABASE_URL`
   - `anon public key` -> `SUPABASE_ANON_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`
3. En `Authentication > Providers` habilita:
   - Email/Password (admin)
  - Anonymous Sign-Ins (requerido para generar JWT de mesero después de validar usuario/contraseña)
4. En `SQL Editor` ejecuta el archivo `database/ronda_schema.sql`.

## 2) Variables de entorno

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

## 3) Crear credenciales de prueba

### Admin (Supabase Auth)

Crea usuario admin desde:
- `Authentication > Users > Add user`
- Ejemplo sugerido:
  - Email: `admin2@ronda.com`
  - Contraseña: `123456`

### Mesero (tabla personalizada)

Ya queda creado por SQL:
- Nombre: `mesero1`
- Usuario: `mesero1`
- Contraseña real: `123456`

## 4) Instalar dependencias y correr el proyecto

### Backend

```bash
cd backend
npm install
npm run dev
```

Servidor en: `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App en: `http://localhost:5173`

## 5) Endpoints CRUD de Login

### CREATE
- `POST /api/auth/registro` (protegida, solo admin autenticado)

Body ejemplo:

```json
{
  "rolObjetivo": "admin",
  "nombre_usuario": "Laura Admin",
  "correo_electronico": "laura@ronda.com",
  "contrasena": "Admin1234*",
  "confirmar_contrasena": "Admin1234*"
}
```

### READ
- `POST /api/auth/login`
- `GET /api/auth/perfil` (protegida)

Admin login:

```json
{
  "correo_electronico": "admin@ronda.com",
  "contrasena": "Admin1234*"
}
```

Mesero login:

```json
{
  "usuario": "carlos.mesero",
  "contrasena": "Mesero123"
}
```

### UPDATE
- `PUT /api/auth/actualizar` (protegida)

Admin update:

```json
{
  "nuevaContrasena": "NuevaClave123",
  "confirmarContrasena": "NuevaClave123"
}
```

Mesero update:

```json
{
  "nuevaContrasena": "Mesero456",
  "confirmarContrasena": "Mesero456"
}
```

### Gestión interna de usuarios (solo admin)
- `GET /api/auth/usuarios` para listar admins y meseros
- `PUT /api/auth/suspender/:id` para suspender/reactivar credenciales

Body de suspensión:

```json
{
  "rolObjetivo": "mesero",
  "suspender": true
}
```

### DELETE
- `DELETE /api/auth/:id` (protegida)

Body ejemplo:

```json
{
  "rolObjetivo": "mesero"
}
```

`rolObjetivo` soporta: `admin` o `mesero`.

## 6) Notas de seguridad aplicadas

- Contraseña de admin gestionada por Supabase Auth.
- Contraseña de mesero protegida con `bcryptjs` (`saltRounds = 10`).
- Rutas sensibles protegidas con `authMiddleware` y validación de JWT vía `supabase.auth.getUser(token)`.
- Claves sensibles solo en `.env`.
- Validaciones backend de formato y campos obligatorios.
- CORS restringido al origen del frontend (`FRONTEND_URL`).

## 7) Alcance de esta entrega

Esta implementación cubre exclusivamente el CRUD de login solicitado:
- Registro interno por admin para admin/mesero
- Login admin/mesero
- Consulta de perfil
- Actualización de contraseña
- Eliminación de usuario

Además incluye administración interna de credenciales:
- Listado de usuarios
- Suspensión/reactivación de credenciales

No se incluyeron módulos de mesas, pedidos ni pagos.
