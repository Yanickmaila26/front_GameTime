# GameTime — Frontend SPA (React + Vite)

Este es el frontend desacoplado para la aplicación **GameTime** (Torneo de Invierno Latacunga 2026). Consume los endpoints JSON provistos por el backend en Laravel (`gametime`).

## Tecnologías Utilizadas
- **Core**: React 18
- **Enrutamiento**: React Router DOM (v6)
- **Estilos**: Tailwind CSS v4 (con configuraciones temáticas de básquetbol)
- **Animación 3D**: Three.js (en la landing page)
- **Consumo API**: Axios (con interceptores para Sanctum Tokens)
- **Alertas**: SweetAlert2 (configurado con tema oscuro personalizado)
- **Iconos**: Lucide React (v0.400.0)

---

## Requisitos Previos
1. El backend Laravel (`gametime`) debe estar ejecutándose (normalmente en `http://localhost:8000`).
2. Tener instalado **Node.js** (v18 o superior).

---

## Configuración y Arranque

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar el Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en `http://localhost:5173`.

3. **Variables de Entorno** (opcional):
   Por defecto, el cliente API apunta a `http://localhost:8000/api`. Si necesitas cambiar la URL del backend, crea un archivo `.env` en la raíz de este proyecto:
   ```env
   VITE_API_URL=http://tu-servidor-backend/api
   ```

4. **Compilar para Producción**:
   ```bash
   npm run build
   ```
   Esto generará los activos estáticos minificados en el directorio `dist/`.

---

## Arquitectura de Autenticación
- El inicio de sesión se realiza mediante `POST /api/login`.
- Si las credenciales son válidas, el backend retorna un token de **Laravel Sanctum** (`personal_access_token`) y el objeto de usuario.
- El token y los datos del usuario se guardan en el `localStorage` (`auth_token` y `user`).
- El cliente Axios de `src/api/client.js` inyecta automáticamente la cabecera `Authorization: Bearer <token>` en todas las peticiones salientes.
- Si una petición responde con un código `401 Unauthorized` (sesión expirada o token inválido), el cliente borra el token local y redirige al usuario a `/login`.
