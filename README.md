# 🤖 RIZZO - WhatsApp Bot Manager

Plataforma profesional para gestionar múltiples bots de WhatsApp de forma independiente.

## 📋 Características

✅ **Múltiples Clientes Independientes** - Cada cliente tiene su propia instancia de bot aislada  
✅ **API REST Completa** - Control total de bots y clientes mediante API  
✅ **Panel Web Intuitivo** - Interfaz moderna para gestionar todo  
✅ **Gestión de Flujos** - Diferentes flujos de conversación por cliente  
✅ **Base de Datos Local** - Almacenamiento JSON de clientes y sesiones  
✅ **Respuestas Aisladas** - Las respuestas se envían SOLO al chat que envió el mensaje  
✅ **Estado en Tiempo Real** - Monitor de bots activos y sesiones  

## 🏗️ Arquitectura

```
RIZZO/
├── index.js                 # Servidor Express principal
├── package.json
├── public/
│   └── index.html          # Panel web
├── src/
│   ├── bot.js              # Controlador antiguo (legacy)
│   ├── botManager.js       # Gestor de instancias de bots
│   ├── database.js         # Gestor de base de datos JSON
│   ├── api.js              # Rutas API REST
│   ├── flowLoader.js       # Cargador de flujos
│   ├── logger.js           # Logger de mensajes
│   └── utils.js            # Utilidades
├── flows/
│   ├── default.flow.js     # Flujo por defecto
│   ├── foodies.flow.js     # Flujo para restaurantes
│   └── hotel.flow.js       # Flujo para hoteles
├── clients/
│   └── [clientId]/         # Sesión de WhatsApp del cliente
│       └── config.json
└── data/
    └── database.json       # Base de datos centralizada
```

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start

# El servidor escuchará en http://localhost:3000
```

## 📱 Flujo de Trabajo

### 1. Crear un Cliente
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "restaurant001",
    "name": "Mi Restaurante",
    "email": "admin@mirestaurante.com",
    "phone": "+51987654321",
    "flow": "foodies"
  }'
```

### 2. Iniciar Bot para el Cliente
```bash
curl -X POST http://localhost:3000/api/bots/restaurant001/start
```

Escanea el QR que aparecerá en la consola con tu teléfono.

### 3. El Bot está Listo
Una vez autenticado, el bot responderá automáticamente a los mensajes del cliente.

## 🔌 API REST

### Clientes

#### Obtener todos los clientes
```http
GET /api/clients
```

#### Obtener cliente específico
```http
GET /api/clients/:clientId
```

#### Crear cliente
```http
POST /api/clients
Content-Type: application/json

{
  "clientId": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "flow": "string"
}
```

#### Actualizar cliente
```http
PUT /api/clients/:clientId
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "flow": "string",
  "config": {}
}
```

#### Eliminar cliente
```http
DELETE /api/clients/:clientId
```

### Bots

#### Iniciar bot
```http
POST /api/bots/:clientId/start
```

#### Detener bot
```http
POST /api/bots/:clientId/stop
```

#### Obtener estado del bot
```http
GET /api/bots/:clientId/status
```

#### Obtener estado de todos los bots
```http
GET /api/bots/status/all
```

### Flujos

#### Obtener flujos disponibles
```http
GET /api/flows
```

#### Cambiar flujo de cliente
```http
POST /api/clients/:clientId/flow
Content-Type: application/json

{
  "flowName": "foodies"
}
```

## 📊 Panel Web

Accede a `http://localhost:3000` para usar el panel interactivo donde puedes:

- 📊 **Dashboard** - Ver resumen de clientes y bots activos
- 👥 **Clientes** - Crear, editar y eliminar clientes
- 🤖 **Bots** - Iniciar y detener bots por cliente

## 🔧 Crear Flujos Personalizados

Los flujos son funciones asincrónicas que procesan los mensajes:

```javascript
// flows/miflujocustom.flow.js
export default async (text, msg) => {
    const t = text.toLowerCase();

    if (t.includes("hola")) {
        return "👋 ¡Hola! ¿Cómo estás?";
    }

    if (t.includes("precio")) {
        return "💵 Nuestro precio es de S/ 100";
    }

    // Si no hay coincidencia, devolver null no genera respuesta
    return null;
};
```

Luego asigna el flujo a un cliente:

```bash
curl -X POST http://localhost:3000/api/clients/restaurant001/flow \
  -H "Content-Type: application/json" \
  -d '{ "flowName": "miflujocustom" }'
```

## 🔑 Características Clave

### Instancias Aisladas de Bots
- Cada cliente tiene su propia instancia de `Client` de whatsapp-web.js
- Los mensajes se procesan independientemente
- Las sesiones se almacenan separadamente por cliente

### Respuestas Precisas
```javascript
// En botManager.js - Línea crítica:
await botClient.sendMessage(chatId, response);
// chatId es el ID del chat que envió el mensaje
// Esto garantiza que la respuesta vaya al chat correcto
```

### Persistencia de Sesiones
- Las credenciales de WhatsApp se almacenan en `clients/{clientId}/`
- La sesión persiste entre reinicios del servidor
- No es necesario escanear QR cada vez

### Base de Datos Centralizada
- `data/database.json` almacena información de todos los clientes
- Fácil de gestionar y respaldar
- Accesible desde cualquier punto de la aplicación

## 📝 Logs

Los mensajes se registran en:
```
clients/{clientId}/messages.log
```

Cada log contiene:
```
[ISO_TIMESTAMP] SENDER_ID: MESSAGE_TEXT
```

## 🛑 Detener Servidor

```bash
Presiona Ctrl+C en la terminal
```

El servidor detendrá automáticamente todos los bots activos.

## 📦 Estructura de Base de Datos

```json
{
  "clients": {
    "restaurant001": {
      "id": "restaurant001",
      "name": "Mi Restaurante",
      "email": "admin@mirestaurante.com",
      "phone": "+51987654321",
      "flow": "foodies",
      "status": "active",
      "createdAt": "2025-11-25T...",
      "config": {}
    }
  },
  "sessions": {
    "restaurant001": {
      "clientId": "restaurant001",
      "status": "connected",
      "startedAt": "2025-11-25T...",
      "lastActivity": "2025-11-25T..."
    }
  },
  "flows": {}
}
```

## 🐛 Troubleshooting

### El bot no responde
1. Verifica que el bot esté activo: `GET /api/bots/:clientId/status`
2. Revisa los logs en la consola
3. Asegúrate de que el flujo está asignado correctamente

### QR no aparece
1. El bot puede estar tardando en iniciar
2. Intenta detener y reiniciar el bot
3. Verifica que Puppeteer esté instalado correctamente

### Las respuestas van a múltiples chats
Este problema ya está resuelto en la v2.0:
- Usamos `msg.from` como `chatId` para asegurar que las respuestas vayan al chat correcto
- Cada cliente tiene su propia instancia aislada

## 📞 Soporte

Para más información o reportar errores, revisa los logs en la consola del servidor.

---

**RIZZO v2.0** - Plataforma profesional de bots de WhatsApp
