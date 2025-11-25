# 🚀 RIZZO - Inicio Rápido

## 1️⃣ Instalación (2 minutos)

```bash
# Clonar o descargar el proyecto
cd RIZZO

# Instalar dependencias
npm install

# ✅ Listo!
```

## 2️⃣ Iniciar Servidor (1 minuto)

```bash
npm start
```

Verás:
```
🚀 Servidor RIZZO iniciado en puerto 3000
📍 URL: http://localhost:3000
📊 Panel: http://localhost:3000
📚 API: http://localhost:3000/api
```

## 3️⃣ Abrir Panel Web (1 minuto)

Abre tu navegador en: **http://localhost:3000**

Verás una interfaz moderna con 3 tabs:
- 📊 **Dashboard** - Resumen de clientes y bots
- 👥 **Clientes** - Crear, editar y eliminar clientes
- 🤖 **Bots** - Iniciar y detener bots

## 4️⃣ Crear Primer Cliente (2 minutos)

En el tab **Clientes**:

1. Completa el formulario:
   - **ID del Cliente**: `mi_restaurante`
   - **Nombre**: `Mi Restaurante`
   - **Email**: `admin@mirestaurante.com`
   - **Teléfono WhatsApp**: `+51987654321`
   - **Flujo**: `foodies` (o tu flujo personalizado)

2. Click en **"Crear Cliente"**

3. ✅ Listo! Tu cliente aparecerá en la lista

## 5️⃣ Iniciar Bot (3 minutos)

En el tab **Bots**:

1. Selecciona el cliente que acabas de crear
2. Click en **"Iniciar Bot"**
3. En la consola verás un **QR Code**
4. Abre WhatsApp en tu teléfono
5. Escanea el QR
6. ✅ El bot estará listo después de 1-2 minutos

El panel mostrará **"🟢 Activo"** cuando esté conectado.

## 6️⃣ Probar el Bot

Ahora puedes:
1. Abre WhatsApp en tu teléfono
2. Busca el número que escaneaste
3. Envía un mensaje (ej: "hola")
4. ✅ Recibirás la respuesta automáticamente

## 📋 Ejemplos de Uso

### Crear cliente vía API
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "mi_hotel",
    "name": "Mi Hotel",
    "email": "reservas@mihotel.com",
    "phone": "+51987654321",
    "flow": "hotel"
  }'
```

### Obtener todos los clientes
```bash
curl http://localhost:3000/api/clients
```

### Obtener estado de todos los bots
```bash
curl http://localhost:3000/api/bots/status/all
```

### Iniciar bot
```bash
curl -X POST http://localhost:3000/api/bots/mi_restaurante/start
```

### Detener bot
```bash
curl -X POST http://localhost:3000/api/bots/mi_restaurante/stop
```

## 🔄 Cambiar Flujo

Para cambiar el flujo de un cliente:

```bash
curl -X POST http://localhost:3000/api/clients/mi_restaurante/flow \
  -H "Content-Type: application/json" \
  -d '{ "flowName": "hotel" }'
```

## 📱 Flujos Disponibles

- **default** - Flujo básico de demostración
- **foodies** - Flujo para restaurantes (menú, promos, reservas)
- **hotel** - Flujo para hoteles (habitaciones, precios, reservas)

## 🛑 Detener Servidor

Presiona **Ctrl+C** en la terminal.

Todos los bots se detendrán automáticamente.

## 🧪 Probar Todo Automáticamente

Ejecuta las pruebas:
```bash
node test.js
```

Verás:
```
✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE!
```

## 📚 Más Documentación

- **README.md** - Documentación completa
- **ARCHITECTURE.md** - Arquitectura del sistema
- **examples.js** - Ejemplos de código

## ⚠️ Problemas Comunes

### "El QR no aparece"
- El bot puede estar tardando en iniciar (espera 10 segundos)
- Intenta detener y reiniciar el bot

### "No recibo respuestas"
- Asegúrate de que el bot esté activo (🟢 en el panel)
- Verifica que el flujo esté correcto
- Revisa la consola para ver los logs

### "Error: EACCES"
- Permiso denegado. Intenta ejecutar con permisos de administrador

### "Puerto 3000 ya está en uso"
- Cambia el puerto: `PORT=3001 npm start`

## 🎯 Próximos Pasos

1. **Crear flujos personalizados** - Edita los archivos en `flows/`
2. **Agregar más clientes** - Repite el paso 4 y 5
3. **Ir a producción** - Mira ARCHITECTURE.md para deployment

## 📞 Soporte

Para ayuda, revisa:
1. Los logs en la consola
2. La documentación en README.md
3. Los ejemplos en examples.js

---

¡Disfruta usando **RIZZO**! 🚀
