# 📊 Arquitectura de RIZZO v2.0

## Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    PANEL WEB (index.html)               │
│         - Dashboard                                      │
│         - Gestión de Clientes                            │
│         - Control de Bots                                │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 SERVIDOR EXPRESS (index.js)             │
│         - Rutas API                                      │
│         - Middleware                                     │
│         - Manejo de archivos estáticos                   │
└────┬────────────────────────────────────────────┬───────┘
     │                                            │
     │ /api/clients                              │ /api/bots
     │ /api/flows                                │
     │ /api/health                               │
     ▼                                            ▼
┌────────────────────────────────┐  ┌───────────────────────────────┐
│      DATABASE (database.js)    │  │   BOT MANAGER (botManager.js) │
│                                │  │                               │
│ - Clients                      │  │ - Instancias de bots          │
│ - Sessions                     │  │ - Control de ciclo de vida    │
│ - Flows                        │  │ - Manejo de eventos           │
│                                │  │ - Aislamiento de clientes     │
│ data/database.json             │  └───┬────────────────────┬──────┘
└────────────────────────────────┘      │                    │
                                        ▼                    ▼
                                    ┌─────────────────────────────┐
                                    │  INSTANCIA BOT 1 (Client)   │
                                    │  - clientId: restaurant_1   │
                                    │  - Flow: foodies            │
                                    │  - Estado: connected        │
                                    └─────────────────────────────┘
                                        ┌─────────────────────────────┐
                                        │  INSTANCIA BOT 2 (Client)   │
                                        │  - clientId: hotel_1        │
                                        │  - Flow: hotel              │
                                        │  - Estado: connected        │
                                        └─────────────────────────────┘
                                        ┌─────────────────────────────┐
                                        │  INSTANCIA BOT N (Client)   │
                                        │  - clientId: ...            │
                                        │  - Flow: ...                │
                                        │  - Estado: ...              │
                                        └─────────────────────────────┘
                                            │
                                            ▼
                                    ┌─────────────────────┐
                                    │  WHATSAPP-WEB.JS    │
                                    │  (Cliente Puppeteer)│
                                    └─────────────────────┘
                                            │
                                            ▼
                                    ┌─────────────────────┐
                                    │  WHATSAPP SERVERS   │
                                    └─────────────────────┘
```

## Flujo de Mensajes

### Recibir Mensaje

```
Usuario WhatsApp
        │
        ▼
    WhatsApp Servers
        │
        ▼
    Cliente whatsapp-web.js
        │
        ▼ (evento "message")
    BotManager (botManager.js)
        │
        ├─ Obtener clientId del mensaje
        ├─ Obtener instancia de bot del cliente
        ├─ Cargar flow del cliente
        │
        ▼
    Flow (ej: foodies.flow.js)
        │
        ├─ Procesar texto del mensaje
        ├─ Generar respuesta
        │
        ▼
    Bot Manager
        │
        └─ Enviar mensaje al MISMO CHAT (chatId = msg.from)
        │
        ▼
    WhatsApp Servers
        │
        ▼
    Usuario WhatsApp (respuesta)
```

## Gestión de Clientes Independientes

Cada cliente tiene:

1. **Directorio de sesión**: `clients/{clientId}/`
   - Credenciales de WhatsApp
   - Cache de autenticación
   - Datos de sesión

2. **Instancia de Bot**: Objeto `Client` independiente en memoria
   - Listeners propios
   - Procesamiento de eventos aislado
   - Flow específico del cliente

3. **Configuración**: En `data/database.json`
   - Nombre, email, teléfono
   - Flow asignado
   - Estado
   - Metadata

## Aislamiento de Mensajes

### ✅ Correcto en v2.0

```javascript
// botManager.js - Line 56
botClient.on("message", async msg => {
    const from = msg.from;      // ← ID del chat que envió el mensaje
    const chatId = msg.from;     // ← USAR ESTE ID para responder
    
    // Procesar...
    
    await botClient.sendMessage(chatId, response);  // ← Responde al mismo chat
});
```

Esto garantiza que:
- Cliente A recibe mensaje en su chat
- Se procesa con el Bot Manager del Cliente A
- Se busca la respuesta en el Flow del Cliente A
- Se envía la respuesta SOLO al chat que envió el mensaje

No hay riesgo de que:
- ❌ La respuesta vaya a otro chat del mismo cliente
- ❌ La respuesta vaya a un cliente diferente
- ❌ Se procese con el flow incorrecto

## Flujos de Datos

### Crear Cliente

```
POST /api/clients
    │
    ▼
validate inputs
    │
    ▼
database.createClient()
    │
    ├─ Guardar en data/database.json
    ├─ Crear directorio clients/{clientId}/
    │
    ▼
Response 201 Created
```

### Iniciar Bot

```
POST /api/bots/{clientId}/start
    │
    ▼
botManager.createBotForClient()
    │
    ├─ Validar cliente existe
    ├─ Cargar flow del cliente
    ├─ Crear instancia Client de whatsapp-web.js
    ├─ Registrar event listeners
    ├─ Guardar en memory (this.bots[clientId])
    ├─ Inicializar cliente
    │
    ▼
Mostrar QR
Esperar autenticación
    │
    ▼
Evento "ready"
    │
    ├─ Actualizar estado en database
    ├─ Bot listo para recibir mensajes
    │
    ▼
Escuchar eventos "message"
```

### Procesar Mensaje

```
Usuario envía mensaje a WhatsApp del Cliente A
    │
    ▼
WhatsApp Servers notifican al cliente puppeteer
    │
    ▼
Evento "message" en instancia bot del Cliente A
    │
    ├─ from = ID del chat que envió el mensaje
    ├─ text = Contenido del mensaje
    │
    ▼
Cargar flow del Cliente A
    │
    ▼
flow(text, msg) ejecuta lógica
    │
    ├─ Evalúa palabras clave
    ├─ Genera respuesta
    │
    ▼
if (response) {
    sendMessage(chatId, response)
}
    │
    ▼
Respuesta llega al chat correcto
```

## Base de Datos JSON

Estructura en `data/database.json`:

```json
{
  "clients": {
    "cliente_1": {
      "id": "cliente_1",
      "name": "Restaurante XYZ",
      "email": "admin@xyz.com",
      "phone": "+51987654321",
      "flow": "foodies",
      "status": "active",
      "createdAt": "2025-11-25T10:30:00Z",
      "config": {}
    },
    "cliente_2": {
      "id": "cliente_2",
      "name": "Hotel ABC",
      "email": "reservas@abc.com",
      "phone": "+51998765432",
      "flow": "hotel",
      "status": "inactive",
      "createdAt": "2025-11-25T10:45:00Z",
      "config": {}
    }
  },
  "sessions": {
    "cliente_1": {
      "clientId": "cliente_1",
      "status": "connected",
      "startedAt": "2025-11-25T11:00:00Z",
      "lastActivity": "2025-11-25T11:30:00Z"
    }
  },
  "flows": {}
}
```

## Escalabilidad

### Puede manejar:
- ✅ Múltiples clientes sin interferencia
- ✅ Cientos de bots activos simultáneamente
- ✅ Flujos personalizados por cliente
- ✅ Persistencia de sesiones entre reinicios

### Limitaciones actuales:
- Base de datos JSON (considerar migrar a SQLite/PostgreSQL para producción)
- Almacenamiento en memoria de instancias (considerar cluster para múltiples servidores)
- Una sola instancia de Node.js (considerar usar PM2 para alta disponibilidad)

## Deployment

Para producción:

1. **Usar base de datos real**: PostgreSQL, MongoDB
2. **Usar gestor de procesos**: PM2, systemd
3. **Agregar reverse proxy**: Nginx
4. **Usar HTTPS**: Let's Encrypt
5. **Agregar autenticación**: JWT, OAuth
6. **Agregar rate limiting**: Para proteger la API
7. **Agregar logging centralizado**: ELK Stack, Datadog
8. **Agregar monitoring**: Prometheus, Grafana

---

**RIZZO v2.0** - Arquitectura profesional y escalable
